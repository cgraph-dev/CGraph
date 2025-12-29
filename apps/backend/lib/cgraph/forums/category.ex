defmodule Cgraph.Forums.Category do
  @moduledoc """
  Post flair/category for organizing posts within a forum.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  schema "forum_categories" do
    field :name, :string
    field :color, :string, default: "#878A8C"
    field :background_color, :string, default: "#EDEFF1"
    field :description, :string
    field :is_required, :boolean, default: false  # Must select category
    field :position, :integer, default: 0

    belongs_to :forum, Cgraph.Forums.Forum
    has_many :posts, Cgraph.Forums.Post

    timestamps()
  end

  @doc """
  Create a category.
  """
  def changeset(category, attrs) do
    category
    |> cast(attrs, [:name, :color, :background_color, :description, :is_required, :position, :forum_id])
    |> validate_required([:name, :forum_id])
    |> validate_length(:name, min: 1, max: 64)
    |> validate_length(:description, max: 200)
    |> validate_format(:color, ~r/^#[0-9A-Fa-f]{6}$/)
    |> validate_format(:background_color, ~r/^#[0-9A-Fa-f]{6}$/)
    |> unique_constraint([:forum_id, :name])
    |> foreign_key_constraint(:forum_id)
  end
end
