defmodule CGraph.Repo.Migrations.CreateWebhookEvents do
  use Ecto.Migration

  def change do
    create table(:webhook_events, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :stripe_event_id, :string, null: false
      add :event_type, :string, null: false
      add :processed_at, :utc_datetime, null: false
      add :payload, :map
      add :status, :string, default: "processed", null: false
      add :error_message, :text

      timestamps(type: :utc_datetime_usec)
    end

    create unique_index(:webhook_events, [:stripe_event_id])
    create index(:webhook_events, [:event_type])
    create index(:webhook_events, [:status])
  end
end
