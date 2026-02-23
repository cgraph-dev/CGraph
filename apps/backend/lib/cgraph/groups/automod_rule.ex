defmodule CGraph.Groups.AutomodRule do
  @moduledoc """
  Schema for automated moderation rules.
  Supports word filters, link filters, spam detection, and caps filters.
  """

  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "automod_rules" do
    field :rule_type, :string  # word_filter, link_filter, spam_detection, caps_filter
    field :pattern, :string    # regex pattern or comma-separated domains
    field :action, :string     # delete, warn, mute, flag_for_review
    field :is_enabled, :boolean, default: true
    field :name, :string

    belongs_to :group, CGraph.Groups.Group

    timestamps()
  end

  @valid_types ~w(word_filter link_filter spam_detection caps_filter)
  @valid_actions ~w(delete warn mute flag_for_review)

  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(rule, attrs) do
    rule
    |> cast(attrs, [:name, :rule_type, :pattern, :action, :is_enabled, :group_id])
    |> validate_required([:name, :rule_type, :pattern, :action, :group_id])
    |> validate_inclusion(:rule_type, @valid_types)
    |> validate_inclusion(:action, @valid_actions)
    |> validate_length(:name, min: 1, max: 100)
    |> validate_length(:pattern, min: 1, max: 2000)
    |> foreign_key_constraint(:group_id)
  end
end
