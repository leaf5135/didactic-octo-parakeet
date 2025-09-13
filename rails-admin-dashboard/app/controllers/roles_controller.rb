class RolesController < ApplicationController
  before_action :require_user
  before_action :check_role_permissions
  before_action :set_role, only: %i[ show edit update destroy ]

  # GET /roles
  def index
    @roles = Role.all
    render_for_agent({ success: true, roles: @roles.map { |r| { id: r.id, name: r.name, description: r.description } } }) do
      # Normal HTML response for non-agent requests
    end
  end

  # GET /roles/1
  def show
    render_for_agent({ success: true, role: { id: @role.id, name: @role.name, description: @role.description } }) do
      # Normal HTML response for non-agent requests
    end
  end

  # GET /roles/new
  def new
    @role = Role.new
  end

  # GET /roles/1/edit
  def edit
  end

  # POST /roles
  def create
    @role = Role.new(role_params)

    if @role.save
      render_for_agent({ success: true, message: "Role created", role: { id: @role.id, name: @role.name } }) do
        redirect_to @role, notice: "Role was successfully created."
      end
    else
      render_for_agent({ success: false, errors: @role.errors.full_messages }) do
        render :new, status: :unprocessable_entity
      end
    end
  end

  # PATCH/PUT /roles/1
  def update
    if @role.update(role_params)
      render_for_agent({ success: true, message: "Role updated", role: { id: @role.id, name: @role.name } }) do
        redirect_to @role, notice: "Role was successfully updated.", status: :see_other
      end
    else
      render_for_agent({ success: false, errors: @role.errors.full_messages }) do
        render :edit, status: :unprocessable_entity
      end
    end
  end

  # DELETE /roles/1
  def destroy
    @role.destroy!
    render_for_agent({ success: true, message: "Role deleted" }) do
      redirect_to roles_path, notice: "Role was successfully destroyed.", status: :see_other
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_role
      @role = Role.find(params.expect(:id))
    end

    # Only allow a list of trusted parameters through.
    def role_params
      params.expect(role: [ :name, :description ])
    end

    def check_role_permissions
      action_name = params[:action]
      case action_name
      when 'index'
        require_permission('roles', 'index')
      when 'show'
        require_permission('roles', 'show')
      when 'new', 'create'
        require_permission('roles', 'create')
      when 'edit', 'update'
        require_permission('roles', 'update')
      when 'destroy'
        require_permission('roles', 'destroy')
      end
    end
end
