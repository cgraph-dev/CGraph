defmodule CGraph.Repo.Migrations.AddForumSubscriptions do
  use Ecto.Migration

  def change do
    create table(:forum_subscriptions, primary_key: false) do
      add :id, :uuid, primary_key: true, default: fragment("gen_random_uuid()")
      add :user_id, references(:users, type: :uuid, on_delete: :delete_all), null: false
      add :forum_id, references(:forums, type: :uuid, on_delete: :delete_all)
      add :board_id, references(:boards, type: :uuid, on_delete: :delete_all)
      add :thread_id, references(:threads, type: :uuid, on_delete: :delete_all)
      
      # Subscription settings
      add :notification_mode, :string, default: "instant" # instant, daily, weekly, none
      add :email_notifications, :boolean, default: true
      add :push_notifications, :boolean, default: true
      add :include_replies, :boolean, default: true
      
      # Tracking
      add :last_notified_at, :utc_datetime
      add :unread_count, :integer, default: 0
      
      timestamps()
    end

    # Ensure unique subscription per entity type per user
    create unique_index(:forum_subscriptions, [:user_id, :forum_id], 
      where: "forum_id IS NOT NULL", 
      name: :forum_subscriptions_user_forum_unique)
    create unique_index(:forum_subscriptions, [:user_id, :board_id], 
      where: "board_id IS NOT NULL", 
      name: :forum_subscriptions_user_board_unique)
    create unique_index(:forum_subscriptions, [:user_id, :thread_id], 
      where: "thread_id IS NOT NULL", 
      name: :forum_subscriptions_user_thread_unique)
    
    create index(:forum_subscriptions, [:user_id])
    create index(:forum_subscriptions, [:forum_id])
    create index(:forum_subscriptions, [:board_id])
    create index(:forum_subscriptions, [:thread_id])
    create index(:forum_subscriptions, [:notification_mode])
    
    # Email digest queue
    create table(:subscription_digest_queue, primary_key: false) do
      add :id, :uuid, primary_key: true, default: fragment("gen_random_uuid()")
      add :subscription_id, references(:forum_subscriptions, type: :uuid, on_delete: :delete_all), null: false
      add :thread_id, references(:threads, type: :uuid, on_delete: :delete_all)
      add :post_id, references(:posts, type: :uuid, on_delete: :delete_all)
      add :processed, :boolean, default: false
      
      timestamps()
    end
    
    create index(:subscription_digest_queue, [:subscription_id])
    create index(:subscription_digest_queue, [:processed, :inserted_at])
  end
end
