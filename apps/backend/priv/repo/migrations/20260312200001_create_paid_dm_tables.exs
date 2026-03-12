defmodule CGraph.Repo.Migrations.CreatePaidDmTables do
  use Ecto.Migration

  def change do
    create table(:paid_dm_files, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :sender_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :receiver_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :file_url, :string, null: false
      add :file_type, :string, null: false
      add :nodes_required, :integer, null: false
      add :status, :string, null: false, default: "pending"
      add :expires_at, :utc_datetime

      timestamps(type: :utc_datetime)
    end

    create index(:paid_dm_files, [:sender_id])
    create index(:paid_dm_files, [:receiver_id])
    create index(:paid_dm_files, [:status])
    create index(:paid_dm_files, [:expires_at], where: "status = 'pending'", name: :paid_dm_files_pending_expires_idx)

    create table(:paid_dm_settings, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :enabled, :boolean, null: false, default: false
      add :price_per_file, :integer
      add :accepted_types, {:array, :string}
      add :auto_accept_friends, :boolean, null: false, default: false

      timestamps(type: :utc_datetime)
    end

    create unique_index(:paid_dm_settings, [:user_id])
  end
end
