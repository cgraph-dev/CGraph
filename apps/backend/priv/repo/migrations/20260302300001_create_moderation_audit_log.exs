defmodule CGraph.Repo.Migrations.CreateModerationAuditLog do
  @moduledoc """
  Creates the moderation_audit_logs table for tracking AI decisions,
  human reviews, and appeal outcomes in the moderation pipeline.
  """

  use Ecto.Migration

  def change do
    create table(:moderation_audit_logs, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :target_type, :string, null: false
      add :target_id, :string, null: false
      add :action, :string, null: false
      add :ai_category, :string
      add :ai_confidence, :float
      add :ai_action, :string
      add :auto_actioned, :boolean, default: false
      add :human_reviewer_id, references(:users, type: :binary_id, on_delete: :nilify_all)
      add :human_decision, :string
      add :appeal_id, references(:appeals, type: :binary_id, on_delete: :nilify_all)
      add :appeal_outcome, :string
      add :notes, :text
      add :metadata, :map, default: %{}
      add :report_id, references(:reports, type: :binary_id, on_delete: :nilify_all)

      timestamps(type: :utc_datetime)
    end

    create index(:moderation_audit_logs, [:target_type, :target_id])
    create index(:moderation_audit_logs, [:action])
    create index(:moderation_audit_logs, [:ai_category])
    create index(:moderation_audit_logs, [:inserted_at])
    create index(:moderation_audit_logs, [:human_reviewer_id])
  end
end
