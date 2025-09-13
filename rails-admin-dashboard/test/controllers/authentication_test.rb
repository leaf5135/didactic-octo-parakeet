require "test_helper"

class AuthenticationTest < ActionDispatch::IntegrationTest
  setup do
    @admin = users(:admin_user)
    @viewer = users(:viewer_user)
    @inactive = users(:inactive_user)
  end

  test "should redirect to login when not authenticated" do
    get dashboard_path
    assert_redirected_to login_path
    assert_equal "You must be logged in to perform that action", flash[:alert]
  end

  test "should login with valid credentials" do
    post login_path, params: { session: { email: @admin.email, password: 'password123' } }
    assert_redirected_to dashboard_path
    assert_equal "Logged in successfully", flash[:notice]
  end

  test "should not login with invalid password" do
    post login_path, params: { session: { email: @admin.email, password: 'wrongpassword' } }
    assert_response :unprocessable_entity
    assert_equal "Invalid email or password", flash.now[:alert]
  end

  test "should not login with non-existent email" do
    post login_path, params: { session: { email: 'nonexistent@test.com', password: 'password123' } }
    assert_response :unprocessable_entity
    assert_equal "Invalid email or password", flash.now[:alert]
  end

  test "should not login inactive user" do
    post login_path, params: { session: { email: @inactive.email, password: 'password123' } }
    assert_response :unprocessable_entity
    assert_equal "Your account is inactive", flash.now[:alert]
  end

  test "should logout successfully" do
    # First login
    post login_path, params: { session: { email: @admin.email, password: 'password123' } }
    assert_redirected_to dashboard_path

    # Then logout
    delete logout_path
    assert_redirected_to login_path
    assert_equal "Logged out successfully", flash[:notice]

    # Verify can't access protected pages
    get dashboard_path
    assert_redirected_to login_path
  end

  test "should access dashboard when logged in" do
    post login_path, params: { session: { email: @admin.email, password: 'password123' } }
    get dashboard_path
    assert_response :success
  end
end