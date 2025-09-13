# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

# Create permissions
permissions = [
  { resource: 'users', action: 'index', description: 'View all users' },
  { resource: 'users', action: 'show', description: 'View user details' },
  { resource: 'users', action: 'create', description: 'Create new users' },
  { resource: 'users', action: 'update', description: 'Edit users' },
  { resource: 'users', action: 'destroy', description: 'Delete users' },
  { resource: 'roles', action: 'index', description: 'View all roles' },
  { resource: 'roles', action: 'show', description: 'View role details' },
  { resource: 'roles', action: 'create', description: 'Create new roles' },
  { resource: 'roles', action: 'update', description: 'Edit roles' },
  { resource: 'roles', action: 'destroy', description: 'Delete roles' },
  { resource: 'permissions', action: 'index', description: 'View all permissions' },
  { resource: 'permissions', action: 'show', description: 'View permission details' },
  { resource: 'permissions', action: 'create', description: 'Create new permissions' },
  { resource: 'permissions', action: 'update', description: 'Edit permissions' },
  { resource: 'permissions', action: 'destroy', description: 'Delete permissions' },
  { resource: 'dashboard', action: 'index', description: 'Access dashboard' }
]

permissions.each do |perm|
  Permission.find_or_create_by!(resource: perm[:resource], action: perm[:action]) do |p|
    p.description = perm[:description]
  end
end

# Create roles
admin_role = Role.find_or_create_by!(name: 'admin') do |r|
  r.description = 'Full system access'
end

manager_role = Role.find_or_create_by!(name: 'manager') do |r|
  r.description = 'Can manage users and view reports'
end

viewer_role = Role.find_or_create_by!(name: 'viewer') do |r|
  r.description = 'Read-only access'
end

# Assign permissions to roles
admin_role.permissions = Permission.all

manager_permissions = Permission.where(
  resource: ['users', 'dashboard'],
  action: ['index', 'show', 'create', 'update']
)
manager_role.permissions = manager_permissions

viewer_permissions = Permission.where(action: ['index', 'show'])
viewer_role.permissions = viewer_permissions

# Create users
admin_user = User.find_or_create_by!(email: 'admin@example.com') do |u|
  u.password = 'password123'
  u.password_confirmation = 'password123'
  u.first_name = 'Admin'
  u.last_name = 'User'
  u.active = true
end
admin_user.roles << admin_role unless admin_user.roles.include?(admin_role)

manager_user = User.find_or_create_by!(email: 'manager@example.com') do |u|
  u.password = 'password123'
  u.password_confirmation = 'password123'
  u.first_name = 'Manager'
  u.last_name = 'User'
  u.active = true
end
manager_user.roles << manager_role unless manager_user.roles.include?(manager_role)

viewer_user = User.find_or_create_by!(email: 'viewer@example.com') do |u|
  u.password = 'password123'
  u.password_confirmation = 'password123'
  u.first_name = 'Viewer'
  u.last_name = 'User'
  u.active = true
end
viewer_user.roles << viewer_role unless viewer_user.roles.include?(viewer_role)

puts "Seeding completed!"
puts "Created #{Permission.count} permissions"
puts "Created #{Role.count} roles"
puts "Created #{User.count} users"
puts "\nLogin credentials:"
puts "Admin: admin@example.com / password123"
puts "Manager: manager@example.com / password123"
puts "Viewer: viewer@example.com / password123"
