require "test_helper"

class RbacAccessTest < ActionDispatch::IntegrationTest
  setup do
    @admin = users(:admin_user)
    @manager = users(:manager_user)
    @viewer = users(:viewer_user)
  end

  # Helper method to login a user
  def login_as(user)
    post login_path, params: { session: { email: user.email, password: 'password123' } }
  end

  # ===== ADMIN USER TESTS =====
  test "admin can access all user actions" do
    login_as(@admin)

    get users_path
    assert_response :success

    get user_path(@viewer)
    assert_response :success

    get new_user_path
    assert_response :success

    get edit_user_path(@viewer)
    assert_response :success
  end

  test "admin can create users" do
    login_as(@admin)

    assert_difference('User.count') do
      post users_path, params: { user: {
        email: 'newuser@test.com',
        password: 'password123',
        password_confirmation: 'password123',
        first_name: 'New',
        last_name: 'User',
        active: true
      }}
    end
    assert_redirected_to user_path(User.last)
  end

  test "admin can update users" do
    login_as(@admin)

    patch user_path(@viewer), params: { user: { first_name: 'Updated' } }
    assert_redirected_to user_path(@viewer)
    @viewer.reload
    assert_equal 'Updated', @viewer.first_name
  end

  test "admin can delete users" do
    login_as(@admin)

    assert_difference('User.count', -1) do
      delete user_path(@viewer)
    end
    assert_redirected_to users_path
  end

  test "admin can access all role actions" do
    login_as(@admin)

    get roles_path
    assert_response :success

    get role_path(roles(:viewer))
    assert_response :success

    get new_role_path
    assert_response :success

    get edit_role_path(roles(:viewer))
    assert_response :success
  end

  test "admin can access permission views" do
    login_as(@admin)

    get permissions_path
    assert_response :success

    get permission_path(permissions(:dashboard_index))
    assert_response :success
  end

  # ===== MANAGER USER TESTS =====
  test "manager can view users" do
    login_as(@manager)

    get users_path
    assert_response :success

    get user_path(@viewer)
    assert_response :success
  end

  test "manager cannot edit users due to missing admin role" do
    login_as(@manager)

    get edit_user_path(@viewer)
    assert_redirected_to root_path
    assert_equal "You don't have the required role to access this resource", flash[:alert]
  end

  test "manager cannot delete users" do
    login_as(@manager)

    assert_no_difference('User.count') do
      delete user_path(@viewer)
    end
    assert_redirected_to root_path
  end

  test "manager cannot access role management" do
    login_as(@manager)

    get roles_path
    assert_redirected_to root_path
    assert_equal "You don't have permission to perform that action", flash[:alert]

    get new_role_path
    assert_redirected_to root_path

    get edit_role_path(roles(:viewer))
    assert_redirected_to root_path
  end

  test "manager cannot access permission management" do
    login_as(@manager)

    get permissions_path
    assert_redirected_to root_path
    assert_equal "You don't have permission to perform that action", flash[:alert]
  end

  test "manager can access dashboard" do
    login_as(@manager)

    get dashboard_path
    assert_response :success
  end

  # ===== VIEWER USER TESTS =====
  test "viewer can only view users" do
    login_as(@viewer)

    get users_path
    assert_response :success

    get user_path(@admin)
    assert_response :success
  end

  test "viewer cannot create users" do
    login_as(@viewer)

    get new_user_path
    assert_redirected_to root_path
    assert_equal "You don't have the required role to access this resource", flash[:alert]

    assert_no_difference('User.count') do
      post users_path, params: { user: {
        email: 'hacker@test.com',
        password: 'password123',
        password_confirmation: 'password123',
        first_name: 'Hacker',
        last_name: 'User',
        active: true
      }}
    end
    assert_redirected_to root_path
  end

  test "viewer cannot edit users" do
    login_as(@viewer)

    get edit_user_path(@admin)
    assert_redirected_to root_path
    assert_equal "You don't have the required role to access this resource", flash[:alert]

    patch user_path(@admin), params: { user: { first_name: 'Hacked' } }
    assert_redirected_to root_path

    @admin.reload
    assert_equal 'Admin', @admin.first_name # Verify name wasn't changed
  end

  test "viewer cannot delete users" do
    login_as(@viewer)

    assert_no_difference('User.count') do
      delete user_path(@admin)
    end
    assert_redirected_to root_path
  end

  test "viewer can view roles but not manage them" do
    login_as(@viewer)

    get roles_path
    assert_response :success

    get role_path(roles(:admin))
    assert_response :success

    get new_role_path
    assert_redirected_to root_path
    assert_equal "You don't have permission to perform that action", flash[:alert]

    get edit_role_path(roles(:admin))
    assert_redirected_to root_path
  end

  test "viewer can view permissions but not manage them" do
    login_as(@viewer)

    get permissions_path
    assert_response :success

    get permission_path(permissions(:users_index))
    assert_response :success

    get new_permission_path
    assert_redirected_to root_path
    assert_equal "You don't have permission to perform that action", flash[:alert]
  end

  test "viewer can access dashboard" do
    login_as(@viewer)

    get dashboard_path
    assert_response :success
  end

  # ===== UNAUTHORIZED ACCESS TESTS =====
  test "unauthenticated user cannot access any protected resource" do
    # Ensure we're logged out
    delete logout_path

    get users_path
    assert_redirected_to login_path

    get roles_path
    assert_redirected_to login_path

    get permissions_path
    assert_redirected_to login_path

    get dashboard_path
    assert_redirected_to login_path
  end

  test "user without any roles cannot perform actions" do
    # Create a user without any roles
    no_role_user = User.create!(
      email: 'norole@test.com',
      password: 'password123',
      password_confirmation: 'password123',
      first_name: 'No',
      last_name: 'Role',
      active: true
    )

    login_as(no_role_user)

    # Can't view users without permission
    get users_path
    assert_redirected_to root_path
    assert_equal "You don't have permission to perform that action", flash[:alert]

    # Can't access dashboard without permission
    get dashboard_path
    assert_redirected_to root_path
    assert_equal "You don't have permission to perform that action", flash[:alert]
  end
end