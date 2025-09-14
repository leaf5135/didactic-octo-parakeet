class User < ApplicationRecord
  has_secure_password

  has_many :user_roles, dependent: :destroy
  has_many :roles, through: :user_roles

  validates :email, presence: true, uniqueness: true
  validates :first_name, presence: true
  validates :last_name, presence: true

  def full_name
    "#{first_name} #{last_name}"
  end

  def has_permission?(resource, action)
    roles.joins(:permissions).where(
      permissions: { resource: resource, action: action }
    ).exists?
  end

  def has_role?(role_name)
    roles.where(name: role_name).exists?
  end
end
