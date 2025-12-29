defmodule CGraph.Repo.Migrations.CreateUserSettings do
  use Ecto.Migration

  def change do
    create table(:user_settings, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, on_delete: :delete_all, type: :binary_id), null: false
      
      # Notification preferences
      add :email_notifications, :boolean, default: true
      add :push_notifications, :boolean, default: true
      add :notify_messages, :boolean, default: true
      add :notify_mentions, :boolean, default: true
      add :notify_friend_requests, :boolean, default: true
      add :notify_group_invites, :boolean, default: true
      add :notify_forum_replies, :boolean, default: true
      add :notification_sound, :boolean, default: true
      add :quiet_hours_enabled, :boolean, default: false
      add :quiet_hours_start, :time
      add :quiet_hours_end, :time
      
      # Privacy settings
      add :show_online_status, :boolean, default: true
      add :show_read_receipts, :boolean, default: true
      add :show_typing_indicators, :boolean, default: true
      add :profile_visibility, :string, default: "public"
      add :allow_friend_requests, :boolean, default: true
      add :allow_message_requests, :boolean, default: true
      add :show_in_search, :boolean, default: true
      add :allow_group_invites, :string, default: "anyone"
      
      # Appearance preferences
      add :theme, :string, default: "system"
      add :compact_mode, :boolean, default: false
      add :font_size, :string, default: "medium"
      add :message_density, :string, default: "comfortable"
      add :show_avatars, :boolean, default: true
      add :animate_emojis, :boolean, default: true
      
      # Accessibility
      add :reduce_motion, :boolean, default: false
      add :high_contrast, :boolean, default: false
      add :screen_reader_optimized, :boolean, default: false
      
      # Language and locale
      add :language, :string, default: "en"
      add :timezone, :string, default: "UTC"
      add :date_format, :string, default: "mdy"
      add :time_format, :string, default: "twelve_hour"
      
      # Keyboard shortcuts
      add :keyboard_shortcuts_enabled, :boolean, default: true
      add :custom_shortcuts, :map, default: %{}

      timestamps()
    end

    create unique_index(:user_settings, [:user_id])
  end
end
