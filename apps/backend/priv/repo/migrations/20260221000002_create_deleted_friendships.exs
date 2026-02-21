defmodule CGraph.Repo.Migrations.CreateDeletedFriendships do
  use Ecto.Migration

  @moduledoc """
  Creates a deleted_friendships audit table for sync detection.

  When a user unfriends someone, the friendship row is hard-deleted.
  This means sync clients can never detect the removal. This table
  records every unfriend event so the sync pull endpoint can report
  removed friendships to mobile/web clients.
  """

  def change do
    create table(:deleted_friendships, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("gen_random_uuid()")
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :friend_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :deleted_at, :utc_datetime_usec, null: false

      timestamps(type: :utc_datetime_usec)
    end

    create index(:deleted_friendships, [:user_id])
    create index(:deleted_friendships, [:friend_id])
    create index(:deleted_friendships, [:deleted_at])
  end
end
