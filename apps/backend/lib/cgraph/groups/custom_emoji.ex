defmodule Cgraph.Groups.CustomEmoji do
  @moduledoc """
  Schema for custom group emojis.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  schema "group_custom_emojis" do
    belongs_to :group, Cgraph.Groups.Group
    belongs_to :uploaded_by, Cgraph.Accounts.User

    field :name, :string
    field :image_url, :string
    field :is_animated, :boolean, default: false
    field :is_available, :boolean, default: true
    
    timestamps()
  end

  def changeset(emoji, attrs) do
    emoji
    |> cast(attrs, [:group_id, :uploaded_by_id, :name, :image_url, :is_animated])
    |> validate_required([:group_id, :uploaded_by_id, :name, :image_url])
    |> validate_format(:name, ~r/^[a-zA-Z0-9_]+$/, message: "can only contain letters, numbers, and underscores")
    |> validate_length(:name, min: 2, max: 32)
    |> unique_constraint([:group_id, :name])
    |> foreign_key_constraint(:group_id)
    |> foreign_key_constraint(:uploaded_by_id)
  end
end
