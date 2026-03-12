defmodule CGraph.Forums.ModerationLog do
  @moduledoc """
  ModerationLog schema — audit trail of moderation actions.

  Records who performed what moderation action, on which target,
  with reason and optional metadata. Distinct from `CGraph.Forums.Moderation`
  which handles the mod queue and content hiding.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime]

  @target_types ["thread", "post", "user"]

  @derive {Jason.Encoder, only: [
    :id, :moderator_id, :action, :target_type, :target_id,
    :reason, :metadata, :inserted_at
  ]}

  schema "moderation_logs" do
    field :action, :string
    field :target_type, :string
    field :target_id, :binary_id
    field :reason, :string
    field :metadata, :map, default: %{}

    belongs_to :moderator, CGraph.Accounts.User

    timestamps(updated_at: false)
  end

  @required_fields [:moderator_id, :action, :target_type, :target_id]
  @optional_fields [:reason, :metadata]

  @doc "Create a moderation log entry."
  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(log, attrs) do
    log
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_length(:action, min: 1, max: 100)
    |> validate_inclusion(:target_type, @target_types)
    |> validate_length(:reason, max: 2000)
    |> foreign_key_constraint(:moderator_id)
  end
end
