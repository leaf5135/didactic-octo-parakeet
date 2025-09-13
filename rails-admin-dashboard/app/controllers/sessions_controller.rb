class SessionsController < ApplicationController
  def new
  end

  def create
    user = User.find_by(email: params[:session][:email].downcase)
    if user && user.authenticate(params[:session][:password])
      if user.active?
        session[:user_id] = user.id
        flash[:notice] = "Logged in successfully"
        redirect_to dashboard_path
      else
        flash.now[:alert] = "Your account is inactive"
        render 'new', status: :unprocessable_entity
      end
    else
      flash.now[:alert] = "Invalid email or password"
      render 'new', status: :unprocessable_entity
    end
  end

  def destroy
    session[:user_id] = nil
    flash[:notice] = "Logged out successfully"
    redirect_to login_path
  end
end
