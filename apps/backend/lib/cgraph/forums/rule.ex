defmodule Cgraph.Forums.Rule do
  @moduledoc """
  Schema for forum rules.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  schema "forum_rules" do
    belongs_to :forum, Cgraph.Forums.Forum

    field :position, :integer
    field :title, :string
    field :description, :string
    
    timestamps()
  end

  def changeset(rule, attrs) do
    rule
    |> cast(attrs, [:forum_id, :position, :title, :description])
    |> validate_required([:forum_id, :title])
    |> validate_length(:title, max: 200)
    |> validate_length(:description, max: 2000)
    |> foreign_key_constraint(:forum_id)
  end
end
