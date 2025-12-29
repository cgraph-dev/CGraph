defmodule Cgraph.Groups.ChannelCategory do
  @moduledoc """
  Channel categories to organize channels within a group.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  schema "channel_categories" do
    field :name, :string
    field :position, :integer, default: 0
    field :is_collapsed, :boolean, default: false

    belongs_to :group, Cgraph.Groups.Group
    has_many :channels, Cgraph.Groups.Channel, foreign_key: :category_id

    timestamps()
  end

  @doc """
  Create a category.
  """
  def changeset(category, attrs) do
    category
    |> cast(attrs, [:name, :position, :group_id])
    |> validate_required([:name, :group_id])
    |> validate_length(:name, min: 1, max: 50)
    |> foreign_key_constraint(:group_id)
  end
end
