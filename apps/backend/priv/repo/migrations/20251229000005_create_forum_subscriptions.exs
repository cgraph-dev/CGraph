defmodule Cgraph.Repo.Migrations.CreateForumSubscriptions do
  @moduledoc """
  Create forum_subscriptions table.
  
  This table tracks which users are subscribed to which forums,
  enabling personalized home feeds and notification preferences.
  """
  use Ecto.Migration

  def change do
    create table(:forum_subscriptions, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :forum_id, references(:forums, on_delete: :delete_all, type: :binary_id), null: false
      add :user_id, references(:users, on_delete: :delete_all, type: :binary_id), null: false
      add :notification_level, :string, default: "all"

      timestamps(type: :utc_datetime_usec)
    end

    create unique_index(:forum_subscriptions, [:forum_id, :user_id])
    create index(:forum_subscriptions, [:user_id])
  end
end
