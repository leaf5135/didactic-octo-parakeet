class UsersController < ApplicationController
  before_action :require_user
  before_action :check_user_permissions
  before_action :require_admin_role, only: %i[ new create edit update destroy ]
  before_action :set_user, only: %i[ show edit update destroy ]

  # GET /users
  def index
    @users = User.all
    render_for_agent({ success: true, users: @users.map { |u| { id: u.id, email: u.email, name: u.full_name } } }) do
      # Normal HTML response for non-agent requests
    end
  end

  # GET /users/1
  def show
    render_for_agent({ success: true, user: { id: @user.id, email: @user.email, name: @user.full_name } }) do
      # Normal HTML response for non-agent requests
    end
  end

  # GET /users/new
  def new
    @user = User.new
  end

  # GET /users/1/edit
  def edit
  end

  # POST /users
  def create
    @user = User.new(user_params)

    if @user.save
      render_for_agent({ success: true, message: "User created", user: { id: @user.id, email: @user.email } }) do
        redirect_to @user, notice: "User was successfully created."
      end
    else
      render_for_agent({ success: false, errors: @user.errors.full_messages }) do
        render :new, status: :unprocessable_entity
      end
    end
  end

  # PATCH/PUT /users/1
  def update
    if @user.update(user_params)
      render_for_agent({ success: true, message: "User updated", user: { id: @user.id, email: @user.email } }) do
        redirect_to @user, notice: "User was successfully updated.", status: :see_other
      end
    else
      render_for_agent({ success: false, errors: @user.errors.full_messages }) do
        render :edit, status: :unprocessable_entity
      end
    end
  end

  # DELETE /users/1
  def destroy
    @user.destroy!
    render_for_agent({ success: true, message: "User deleted" }) do
      redirect_to users_path, notice: "User was successfully destroyed.", status: :see_other
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_user
      @user = User.find(params.expect(:id))
    end

    # Only allow a list of trusted parameters through.
    def user_params
      params.expect(user: [ :email, :password, :password_confirmation, :first_name, :last_name, :active, role_ids: [] ])
    end

    def require_admin_role
      require_role('admin')
    end

    def check_user_permissions
      action_name = params[:action]
      case action_name
      when 'index'
        require_permission('users', 'index')
      when 'show'
        require_permission('users', 'show')
      end
    end
end
