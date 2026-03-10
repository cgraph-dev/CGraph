defmodule CGraph.Discovery.Topic do
  @moduledoc "Schema for discovery topics (interest categories)."
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "topics" do
    field :name, :string
    field :icon, :string
    field :slug, :string

    timestamps(type: :utc_datetime)
  end

  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(topic, attrs) do
    topic
    |> cast(attrs, [:name, :icon, :slug])
    |> validate_required([:name, :icon, :slug])
    |> validate_length(:name, max: 100)
    |> validate_length(:slug, max: 100)
    |> unique_constraint(:name)
    |> unique_constraint(:slug)
  end
end
