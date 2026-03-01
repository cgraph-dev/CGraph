defmodule CGraph.Repo.Migrations.CreateGroupE2eeSessions do
  use Ecto.Migration

  def change do
    create table(:group_e2ee_sessions, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :group_id, references(:groups, type: :binary_id, on_delete: :delete_all), null: false
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :device_id, :string, null: false
      add :sender_key_id, :string, null: false
      add :public_sender_key, :binary, null: false
      add :chain_key_index, :integer, default: 0
      add :is_active, :boolean, default: true

      timestamps()
    end

    create unique_index(:group_e2ee_sessions, [:group_id, :user_id, :device_id])
    create index(:group_e2ee_sessions, [:group_id, :is_active])
    create index(:group_e2ee_sessions, [:sender_key_id])

    create table(:group_sender_key_distributions, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :session_id, references(:group_e2ee_sessions, type: :binary_id, on_delete: :delete_all), null: false
      add :recipient_user_id, references(:users, type: :binary_id), null: false
      add :recipient_device_id, :string, null: false
      add :encrypted_sender_key, :binary, null: false
      add :distributed_at, :utc_datetime_usec

      timestamps()
    end

    create index(:group_sender_key_distributions, [:recipient_user_id, :recipient_device_id])
    create index(:group_sender_key_distributions, [:session_id])
  end
end
