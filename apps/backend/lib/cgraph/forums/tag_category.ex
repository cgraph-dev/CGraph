defmodule CGraph.Forums.TagCategory do
  @moduledoc """
  Schema for tag categories within a forum.

  Each forum can define categories of tags (e.g., "Status", "Priority", "Topic").
  Categories control how many tags of that type can be applied to a thread
  and whether at least one tag from the category is required.
  """

  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime]

  @derive {Jason.Encoder,
           only: [:id, :name, :color, :icon, :max_per_thread, :required, :inserted_at]}

  schema "forum_tag_categories" do
    field :name, :string
    field :color, :string
    field :icon, :string
    field :max_per_thread, :integer, default: 3
    field :required, :boolean, default: false

    belongs_to :forum, CGraph.Forums.Forum

    has_many :thread_tags, CGraph.Forums.ThreadTag

    timestamps()
  end

  @required_fields ~w(name forum_id)a
  @optional_fields ~w(color icon max_per_thread required)a

  @doc "Changeset for creating or updating a tag category."
  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(category, attrs) do
    category
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_length(:name, min: 1, max: 50)
    |> validate_length(:color, max: 7)
    |> validate_length(:icon, max: 50)
    |> validate_number(:max_per_thread, greater_than: 0, less_than_or_equal_to: 20)
    |> unique_constraint([:forum_id, :name])
  end
end
