defmodule Cgraph.Repo.Migrations.AddMissingNotificationFields do
  @moduledoc """
  Add missing columns to notifications table to match the Notification schema.
  
  The schema includes fields for:
  - clicked_at: When user clicked the notification
  - push_sent: Whether push notification was sent
  - email_sent: Whether email notification was sent
  - group_key: For grouping related notifications
  - count: For aggregated notification counts
  """
  use Ecto.Migration

  def change do
    alter table(:notifications) do
      # Additional tracking fields
      add_if_not_exists :clicked_at, :utc_datetime
      add_if_not_exists :push_sent, :boolean, default: false
      add_if_not_exists :email_sent, :boolean, default: false
      
      # Notification grouping
      add_if_not_exists :group_key, :string
      add_if_not_exists :count, :integer, default: 1
    end

    # Index for grouping
    create_if_not_exists index(:notifications, [:user_id, :group_key])
  end
end
