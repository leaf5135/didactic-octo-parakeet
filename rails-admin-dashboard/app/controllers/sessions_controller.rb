class SessionsController < ApplicationController
  def new
  end

  def create
    user = User.find_by(email: params[:session][:email].downcase)
    if user && user.authenticate(params[:session][:password])
      if user.active?
        session[:user_id] = user.id
        render_for_agent({
          success: true,
          message: "Logged in successfully",
          user: { id: user.id, email: user.email, name: user.full_name },
          redirect_url: dashboard_path
        }) do
          flash[:notice] = "Logged in successfully"
          redirect_to dashboard_path
        end
      else
        render_for_agent({
          success: false,
          error: "Your account is inactive"
        }) do
          flash.now[:alert] = "Your account is inactive"
          render 'new', status: :unprocessable_entity
        end
      end
    else
      render_for_agent({
        success: false,
        error: "Invalid email or password"
      }) do
        flash.now[:alert] = "Invalid email or password"
        render 'new', status: :unprocessable_entity
      end
    end
  end

  def destroy
    session[:user_id] = nil
    render_for_agent({
      success: true,
      message: "Logged out successfully",
      redirect_url: login_path
    }) do
      flash[:notice] = "Logged out successfully"
      redirect_to login_path
    end
  end
end
