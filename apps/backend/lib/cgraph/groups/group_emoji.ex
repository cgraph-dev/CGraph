defmodule CGraph.Groups.GroupEmoji do
  @moduledoc """
  Schema for custom group emojis.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  schema "group_emojis" do
    field :name, :string
    field :image_url, :string
    field :animated, :boolean, default: false

    belongs_to :group, CGraph.Groups.Group
    belongs_to :uploaded_by, CGraph.Accounts.User

    timestamps()
  end

  @doc "Builds a changeset for validating and casting attributes."
  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(emoji, attrs) do
    emoji
    |> cast(attrs, [:name, :image_url, :animated, :group_id, :uploaded_by_id])
    |> validate_required([:name, :image_url, :group_id, :uploaded_by_id])
    |> validate_length(:name, min: 2, max: 32)
    |> validate_format(:name, ~r/^[a-zA-Z0-9_]+$/, message: "must contain only letters, numbers, and underscores")
    |> unique_constraint([:group_id, :name])
    |> foreign_key_constraint(:group_id)
    |> foreign_key_constraint(:uploaded_by_id)
  end
end
