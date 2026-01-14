defmodule CGraph.Calendar.EventCategory do
  @moduledoc """
  Schema for event categories.
  """
  use Ecto.Schema
  import Ecto.Changeset

  alias CGraph.Calendar.Event

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "calendar_event_categories" do
    field :name, :string
    field :description, :string
    field :color, :string, default: "#6366f1"
    field :icon, :string
    field :order, :integer, default: 0

    has_many :events, Event, foreign_key: :category_id

    timestamps(type: :utc_datetime)
  end

  @required_fields ~w(name)a
  @optional_fields ~w(description color icon order)a

  def changeset(category, attrs) do
    category
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_length(:name, min: 1, max: 100)
    |> validate_length(:description, max: 500)
    |> validate_format(:color, ~r/^#[0-9A-Fa-f]{6}$/, message: "must be a valid hex color")
    |> unique_constraint(:name)
  end
end
