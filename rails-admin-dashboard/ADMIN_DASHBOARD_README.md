# Rails Admin Dashboard with RBAC

## Overview
This is a basic admin dashboard built with Rails featuring Role-Based Access Control (RBAC). The application is completely server-side rendered without Turbo or Stimulus.

## Technical Stack
- Ruby 3.4.5
- Rails 8.0.2.1
- SQLite3 Database
- Server-side rendering only (no Turbo/Stimulus)
- BCrypt for password hashing

## Features
- User authentication (login/logout)
- Role-Based Access Control (RBAC)
- User management
- Role management
- Permission management
- Dashboard with statistics

## RBAC Structure
- **Users**: Can have multiple roles
- **Roles**: Can have multiple permissions
- **Permissions**: Define access to specific resources and actions

## Default Users
The application comes with three pre-configured users:

1. **Admin User**
   - Email: admin@example.com
   - Password: password123
   - Role: admin (full system access)

2. **Manager User**
   - Email: manager@example.com
   - Password: password123
   - Role: manager (can manage users and view reports)

3. **Viewer User**
   - Email: viewer@example.com
   - Password: password123
   - Role: viewer (read-only access)

## Getting Started

### Prerequisites
- Ruby 3.4.5 or later
- Rails 8.0.2.1 or later
- SQLite3

### Installation
1. Navigate to the Rails app directory:
   ```bash
   cd rails-admin-dashboard
   ```

2. Install dependencies:
   ```bash
   bundle install
   ```

3. Setup the database:
   ```bash
   rails db:create
   rails db:migrate
   rails db:seed
   ```

4. Start the server:
   ```bash
   rails server
   ```

5. Access the application at: http://localhost:3000

## Usage

### Login
1. Navigate to http://localhost:3000
2. You'll be redirected to the login page
3. Use one of the default credentials listed above

### Dashboard
After logging in, you'll see:
- User statistics
- Role statistics
- Permission statistics
- Quick action links for managing users, roles, and permissions

### Managing Users
- Click "Manage Users" from the dashboard
- Create, edit, view, or delete users (based on your permissions)
- Assign roles to users

### Managing Roles
- Click "Manage Roles" from the dashboard
- Create, edit, view, or delete roles (based on your permissions)
- Assign permissions to roles

### Managing Permissions
- Click "Manage Permissions" from the dashboard
- Create, edit, view, or delete permissions (based on your permissions)

## Authorization
The application uses before_action filters to enforce authorization:
- `require_user`: Ensures user is logged in
- `require_role(role_name)`: Ensures user has specific role
- `require_permission(resource, action)`: Ensures user has specific permission

## Database Schema

### Users Table
- email (unique)
- password_digest
- first_name
- last_name
- active (boolean)

### Roles Table
- name (unique)
- description

### Permissions Table
- resource
- action
- description

### Join Tables
- user_roles (users <-> roles)
- role_permissions (roles <-> permissions)

## Security Features
- Passwords are hashed using BCrypt
- Session-based authentication
- RBAC for fine-grained access control
- Active/inactive user status

## Development

### Adding New Resources
1. Generate scaffold: `rails generate scaffold ResourceName`
2. Add permissions in seeds.rb
3. Add authorization filters in controller
4. Run migrations: `rails db:migrate`
5. Update seeds: `rails db:seed`

### Testing Authorization
1. Login with different user accounts
2. Try accessing different resources
3. Verify permissions are enforced correctly

## Notes
- This is a basic implementation suitable for small to medium applications
- For production use, consider adding:
  - Email verification
  - Password reset functionality
  - Two-factor authentication
  - Audit logging
  - More sophisticated permission system