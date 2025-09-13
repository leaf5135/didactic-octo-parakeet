class DashboardController < ApplicationController
  before_action :require_user
  before_action :check_dashboard_permissions

  def index
    @users_count = User.count
    @roles_count = Role.count
    @permissions_count = Permission.count

    render_for_agent({
      success: true,
      dashboard: {
        users_count: @users_count,
        roles_count: @roles_count,
        permissions_count: @permissions_count
      }
    }) do
      # Normal HTML response for non-agent requests
    end
  end

  private

  def check_dashboard_permissions
    require_permission('dashboard', 'index')
  end
end
