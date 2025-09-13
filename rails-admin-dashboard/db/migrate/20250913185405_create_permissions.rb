class CreatePermissions < ActiveRecord::Migration[8.0]
  def change
    create_table :permissions do |t|
      t.string :resource
      t.string :action
      t.text :description

      t.timestamps
    end
  end
end
