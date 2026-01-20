defmodule CGraph.Repo.Migrations.AddEmailPreferences do
  use Ecto.Migration

  def change do
    alter table(:users) do
      # Email notification preferences
      add :email_notifications_enabled, :boolean, default: true, null: false
      add :email_digest_enabled, :boolean, default: true, null: false
      add :email_digest_frequency, :string, default: "weekly", null: false # daily, weekly, monthly
      add :email_on_new_message, :boolean, default: true, null: false
      add :email_on_friend_request, :boolean, default: true, null: false
      add :email_on_mention, :boolean, default: true, null: false
      add :email_on_reply, :boolean, default: true, null: false
      add :email_on_achievement, :boolean, default: false, null: false
      add :last_digest_sent_at, :utc_datetime
    end

    create index(:users, [:email_digest_enabled])
    create index(:users, [:last_digest_sent_at])
  end
end
