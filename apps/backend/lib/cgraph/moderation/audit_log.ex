defmodule CGraph.Moderation.AuditLog do
  @moduledoc """
  Schema for moderation audit log entries.

  Records AI decisions, human reviews, and appeal outcomes for the
  moderation pipeline. Provides a full audit trail for every moderation
  action taken on content.

  ## Fields

  - `target_type` - Type of content: "message", "post", "user", "thread"
  - `target_id` - ID of the target content
  - `action` - Action taken (ai_flag, ai_block, ai_allow, human_review, etc.)
  - `ai_category` - AI-detected category (spam, harassment, hate_speech, etc.)
  - `ai_confidence` - AI confidence score (0.0-1.0)
  - `ai_action` - AI recommended action (allow, flag, block)
  - `auto_actioned` - Whether enforcement was applied automatically
  - `human_reviewer_id` - ID of human reviewer (if reviewed)
  - `human_decision` - Human decision (approved, dismissed, escalated)
  - `appeal_id` - Associated appeal ID
  - `appeal_outcome` - Appeal result (approved, denied)
  - `notes` - Free-text notes
  - `metadata` - Additional structured data
  - `report_id` - Associated report ID
  """

  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @valid_actions ~w(
    ai_flag ai_block ai_allow
    human_review human_dismiss human_warn human_ban
    appeal_submitted appeal_approved appeal_denied
  )

  schema "moderation_audit_logs" do
    field :target_type, :string
    field :target_id, :string
    field :action, :string
    field :ai_category, :string
    field :ai_confidence, :float
    field :ai_action, :string
    field :auto_actioned, :boolean, default: false
    field :human_reviewer_id, :binary_id
    field :human_decision, :string
    field :appeal_id, :binary_id
    field :appeal_outcome, :string
    field :notes, :string
    field :metadata, :map, default: %{}

    belongs_to :report, CGraph.Moderation.Report

    timestamps(type: :utc_datetime)
  end

  @required_fields ~w(target_type target_id action)a
  @optional_fields ~w(ai_category ai_confidence ai_action auto_actioned
                       human_reviewer_id human_decision appeal_id appeal_outcome
                       notes metadata report_id)a

  @doc false
  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(log, attrs) do
    log
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_inclusion(:action, @valid_actions)
  end
end
