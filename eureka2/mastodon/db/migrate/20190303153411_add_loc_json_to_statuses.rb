class AddLocJsonToStatuses < ActiveRecord::Migration[5.2]
  def change
  	add_column :statuses, :loc_json, :text, null: true, default: '90711512'
  end
end
