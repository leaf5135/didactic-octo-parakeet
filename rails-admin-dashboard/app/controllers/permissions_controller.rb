class PermissionsController < ApplicationController
  before_action :require_user
  before_action :check_permission_permissions
  before_action :set_permission, only: %i[ show edit update destroy ]

  # GET /permissions
  def index
    @permissions = Permission.all
    render_for_agent({ success: true, permissions: @permissions.map { |p| { id: p.id, resource: p.resource, action: p.action, description: p.description } } }) do
      # Normal HTML response for non-agent requests
    end
  end

  # GET /permissions/1
  def show
    render_for_agent({ success: true, permission: { id: @permission.id, resource: @permission.resource, action: @permission.action, description: @permission.description } }) do
      # Normal HTML response for non-agent requests
    end
  end

  # GET /permissions/new
  def new
    @permission = Permission.new
  end

  # GET /permissions/1/edit
  def edit
  end

  # POST /permissions
  def create
    @permission = Permission.new(permission_params)

    if @permission.save
      render_for_agent({ success: true, message: "Permission created", permission: { id: @permission.id, resource: @permission.resource, action: @permission.action }, redirect_url: permission_url(@permission) }) do
        redirect_to @permission, notice: "Permission was successfully created."
      end
    else
      render_for_agent({ success: false, errors: @permission.errors.full_messages }) do
        render :new, status: :unprocessable_entity
      end
    end
  end

  # PATCH/PUT /permissions/1
  def update
    if @permission.update(permission_params)
      render_for_agent({ success: true, message: "Permission updated", permission: { id: @permission.id, resource: @permission.resource, action: @permission.action }, redirect_url: permission_url(@permission) }) do
        redirect_to @permission, notice: "Permission was successfully updated.", status: :see_other
      end
    else
      render_for_agent({ success: false, errors: @permission.errors.full_messages }) do
        render :edit, status: :unprocessable_entity
      end
    end
  end

  # DELETE /permissions/1
  def destroy
    @permission.destroy!
    render_for_agent({ success: true, message: "Permission deleted", redirect_url: permissions_url }) do
      redirect_to permissions_path, notice: "Permission was successfully destroyed.", status: :see_other
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_permission
      @permission = Permission.find(params.expect(:id))
    end

    # Only allow a list of trusted parameters through.
    def permission_params
      params.expect(permission: [ :resource, :action, :description ])
    end

    def check_permission_permissions
      action_name = params[:action]
      case action_name
      when 'index'
        require_permission('permissions', 'index')
      when 'show'
        require_permission('permissions', 'show')
      when 'new', 'create'
        require_permission('permissions', 'create')
      when 'edit', 'update'
        require_permission('permissions', 'update')
      when 'destroy'
        require_permission('permissions', 'destroy')
      end
    end
end
