require "test_helper"

class RbacTest < ActiveSupport::TestCase
  setup do
    @admin = users(:admin_user)
    @manager = users(:manager_user)
    @viewer = users(:viewer_user)
  end

  test "admin user has admin role" do
    assert @admin.has_role?('admin')
    assert_not @admin.has_role?('manager')
    assert_not @admin.has_role?('viewer')
  end

  test "manager user has manager role" do
    assert @manager.has_role?('manager')
    assert_not @manager.has_role?('admin')
    assert_not @manager.has_role?('viewer')
  end

  test "viewer user has viewer role" do
    assert @viewer.has_role?('viewer')
    assert_not @viewer.has_role?('admin')
    assert_not @viewer.has_role?('manager')
  end

  test "admin has all user permissions" do
    assert @admin.has_permission?('users', 'index')
    assert @admin.has_permission?('users', 'show')
    assert @admin.has_permission?('users', 'create')
    assert @admin.has_permission?('users', 'update')
    assert @admin.has_permission?('users', 'destroy')
  end

  test "admin has all role permissions" do
    assert @admin.has_permission?('roles', 'index')
    assert @admin.has_permission?('roles', 'show')
    assert @admin.has_permission?('roles', 'create')
    assert @admin.has_permission?('roles', 'update')
    assert @admin.has_permission?('roles', 'destroy')
  end

  test "admin has all permission permissions" do
    assert @admin.has_permission?('permissions', 'index')
    assert @admin.has_permission?('permissions', 'show')
  end

  test "admin has dashboard access" do
    assert @admin.has_permission?('dashboard', 'index')
  end

  test "manager has limited user permissions" do
    assert @manager.has_permission?('users', 'index')
    assert @manager.has_permission?('users', 'show')
    assert @manager.has_permission?('users', 'create')
    assert @manager.has_permission?('users', 'update')
    assert_not @manager.has_permission?('users', 'destroy')
  end

  test "manager cannot manage roles" do
    assert_not @manager.has_permission?('roles', 'index')
    assert_not @manager.has_permission?('roles', 'create')
    assert_not @manager.has_permission?('roles', 'update')
    assert_not @manager.has_permission?('roles', 'destroy')
  end

  test "manager cannot manage permissions" do
    assert_not @manager.has_permission?('permissions', 'index')
    assert_not @manager.has_permission?('permissions', 'create')
  end

  test "manager has dashboard access" do
    assert @manager.has_permission?('dashboard', 'index')
  end

  test "viewer has only read permissions for users" do
    assert @viewer.has_permission?('users', 'index')
    assert @viewer.has_permission?('users', 'show')
    assert_not @viewer.has_permission?('users', 'create')
    assert_not @viewer.has_permission?('users', 'update')
    assert_not @viewer.has_permission?('users', 'destroy')
  end

  test "viewer has only read permissions for roles" do
    assert @viewer.has_permission?('roles', 'index')
    assert @viewer.has_permission?('roles', 'show')
    assert_not @viewer.has_permission?('roles', 'create')
    assert_not @viewer.has_permission?('roles', 'update')
    assert_not @viewer.has_permission?('roles', 'destroy')
  end

  test "viewer has only read permissions for permissions" do
    assert @viewer.has_permission?('permissions', 'index')
    assert @viewer.has_permission?('permissions', 'show')
  end

  test "viewer has dashboard access" do
    assert @viewer.has_permission?('dashboard', 'index')
  end

  test "user without role has no permissions" do
    user = User.new(
      email: "no-role@test.com",
      password: "password123",
      first_name: "No",
      last_name: "Role",
      active: true
    )
    user.save!

    assert_not user.has_permission?('users', 'index')
    assert_not user.has_permission?('dashboard', 'index')
    assert_not user.has_role?('admin')
    assert_not user.has_role?('viewer')
  end

  test "role can have multiple permissions" do
    admin_role = roles(:admin)
    assert admin_role.permissions.count > 10
  end

  test "permission belongs to multiple roles" do
    dashboard_permission = permissions(:dashboard_index)
    roles_with_dashboard = Role.joins(:permissions).where(permissions: { id: dashboard_permission.id })
    assert roles_with_dashboard.count >= 3 # admin, manager, and viewer all have dashboard access
  end

  test "user can have multiple roles" do
    # Give viewer additional manager role
    @viewer.roles << roles(:manager)
    @viewer.reload

    assert @viewer.has_role?('viewer')
    assert @viewer.has_role?('manager')
    # Should now have manager permissions
    assert @viewer.has_permission?('users', 'create')
  end

  test "user full_name method works" do
    assert_equal "Admin User", @admin.full_name
    assert_equal "Manager User", @manager.full_name
    assert_equal "Viewer User", @viewer.full_name
  end
end