defmodule Cgraph.Repo.Migrations.CreateAnnouncementDismissals do
  @moduledoc """
  Creates table for tracking dismissed announcements per user.
  """
  use Ecto.Migration

  def change do
    create table(:announcement_dismissals, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :announcement_id, references(:forum_announcements, type: :binary_id, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime)
    end

    create index(:announcement_dismissals, [:user_id])
    create index(:announcement_dismissals, [:announcement_id])
    create unique_index(:announcement_dismissals, [:user_id, :announcement_id])
  end
end
