defmodule CGraph.Repo.Migrations.AddE2eeRatchetTracking do
  use Ecto.Migration

  def change do
    create table(:e2ee_sessions, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :peer_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :conversation_type, :string, null: false
      add :conversation_id, :binary_id, null: false
      add :device_id, :string
      add :session_state, :string, default: "active", null: false
      add :current_ratchet_public_key, :binary
      add :message_count, :integer, default: 0
      add :last_key_rotation_at, :utc_datetime_usec

      timestamps(type: :utc_datetime_usec)
    end

    create index(:e2ee_sessions, [:user_id, :peer_id, :conversation_type])
    create unique_index(:e2ee_sessions, [:user_id, :peer_id, :conversation_id, :device_id],
      name: :e2ee_sessions_user_peer_convo_device_idx
    )

    alter table(:e2ee_identity_keys) do
      add :one_time_prekey_count, :integer, default: 100
      add :prekey_low_watermark, :integer, default: 25
      add :last_prekey_replenish_at, :utc_datetime_usec
    end
  end
end
