class AddLocIdToStatuses < ActiveRecord::Migration[5.2]
  def change
  	add_column :statuses, :loc_id, :string, null: true, default: '90711512'
  end
end

