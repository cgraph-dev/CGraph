defmodule CGraph.Repo.Migrations.CreateFriendships do
  use Ecto.Migration

  def change do
    create table(:friendships, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :friend_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :status, :string, null: false, default: "pending"
      add :nickname, :string, size: 32
      add :notes, :string, size: 500

      timestamps(type: :utc_datetime)
    end

    # Index for looking up a user's friends
    create index(:friendships, [:user_id])
    create index(:friendships, [:friend_id])

    # Index for filtering by status
    create index(:friendships, [:user_id, :status])
    create index(:friendships, [:friend_id, :status])

    # Unique constraint to prevent duplicate friendships
    create unique_index(:friendships, [:user_id, :friend_id])
  end
end
