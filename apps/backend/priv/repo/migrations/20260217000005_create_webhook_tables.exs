defmodule CGraph.Repo.Migrations.CreateWebhookTables do
  use Ecto.Migration

  def change do
    create table(:webhook_endpoints, primary_key: false) do
      add :id, :string, primary_key: true
      add :url, :string, null: false
      add :secret, :string, null: false
      add :events, {:array, :string}, null: false, default: ["*"]
      add :active, :boolean, null: false, default: true
      add :metadata, :map, default: %{}
      add :failure_count, :integer, null: false, default: 0
      add :description, :string

      timestamps(type: :utc_datetime_usec)
    end

    create index(:webhook_endpoints, [:active])

    create table(:webhook_deliveries, primary_key: false) do
      add :id, :string, primary_key: true
      add :endpoint_id, references(:webhook_endpoints, type: :string, on_delete: :delete_all),
        null: false
      add :event_id, :string, null: false
      add :event_type, :string, null: false
      add :payload, :map, null: false
      add :status, :string, null: false, default: "pending"
      add :attempts, :integer, null: false, default: 0
      add :max_attempts, :integer, null: false, default: 5
      add :last_attempt_at, :utc_datetime_usec
      add :next_retry_at, :utc_datetime_usec
      add :response_code, :integer
      add :response_body, :text
      add :error, :text
      add :latency_ms, :integer

      timestamps(type: :utc_datetime_usec)
    end

    create index(:webhook_deliveries, [:endpoint_id, :inserted_at])
    create index(:webhook_deliveries, [:status])
    create index(:webhook_deliveries, [:next_retry_at],
      where: "status = 'pending' AND next_retry_at IS NOT NULL")

    create table(:call_history, primary_key: false) do
      add :id, :binary_id, primary_key: true, autogenerate: true
      add :room_id, :string, null: false
      add :type, :string, null: false, default: "audio"
      add :creator_id, references(:users, type: :binary_id, on_delete: :nilify_all)
      add :group_id, references(:groups, type: :binary_id, on_delete: :nilify_all)
      add :state, :string, null: false, default: "ended"
      add :participant_ids, {:array, :binary_id}, default: []
      add :max_participants, :integer, default: 0
      add :started_at, :utc_datetime_usec
      add :ended_at, :utc_datetime_usec
      add :duration_seconds, :integer

      timestamps(type: :utc_datetime_usec)
    end

    create index(:call_history, [:creator_id])
    create index(:call_history, [:group_id])
    create index(:call_history, [:started_at])
  end
end
