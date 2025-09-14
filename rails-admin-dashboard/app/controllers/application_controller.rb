class ApplicationController < ActionController::Base
  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern

  helper_method :current_user, :logged_in?

  def current_user
    @current_user ||= User.find(session[:user_id]) if session[:user_id]
  end

  def logged_in?
    !!current_user
  end

  def require_user
    if !logged_in?
      flash[:alert] = "You must be logged in to perform that action"
      redirect_to login_path
    end
  end

  def require_permission(resource, action)
    unless current_user&.has_permission?(resource, action)
      flash[:alert] = "You don't have permission to perform that action"
      redirect_to root_path
    end
  end

  def require_role(role_name)
    unless current_user&.has_role?(role_name)
      flash[:alert] = "You don't have the required role to access this resource"
      redirect_to root_path
    end
  end

  private

  def render_for_agent(json_response)
    if params[:agent] == 'true'
      render html: <<~HTML.html_safe
        <!DOCTYPE html>
        <html>
        <body>
        <script type="application/json" id="agent-response">#{json_response.to_json}</script>
        </body>
        </html>
      HTML
    else
      yield if block_given?
    end
  end
end
