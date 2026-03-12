defmodule CGraph.Forums.CustomForum do
  @moduledoc """
  CustomForum schema for user-created/owned forums.

  Supports theming, rules, privacy settings, and invite-only access.
  Owner manages the forum independently from global admin.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime]

  @derive {Jason.Encoder, only: [
    :id, :owner_id, :name, :slug, :description, :theme, :rules,
    :icon_url, :banner_url, :is_private, :invite_only,
    :inserted_at, :updated_at
  ]}

  schema "custom_forums" do
    field :name, :string
    field :slug, :string
    field :description, :string
    field :theme, :map, default: %{}
    field :rules, :string
    field :icon_url, :string
    field :banner_url, :string
    field :is_private, :boolean, default: false
    field :invite_only, :boolean, default: false

    belongs_to :owner, CGraph.Accounts.User

    timestamps()
  end

  @required_fields [:owner_id, :name, :slug]
  @optional_fields [:description, :theme, :rules, :icon_url, :banner_url, :is_private, :invite_only]

  @doc "Create or update a custom forum."
  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(custom_forum, attrs) do
    custom_forum
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_length(:name, min: 2, max: 100)
    |> validate_length(:slug, min: 2, max: 100)
    |> validate_format(:slug, ~r/^[a-z0-9]+(?:-[a-z0-9]+)*$/, message: "must be lowercase alphanumeric with hyphens")
    |> validate_length(:description, max: 2000)
    |> validate_length(:rules, max: 10_000)
    |> unique_constraint(:slug)
    |> foreign_key_constraint(:owner_id)
  end
end
