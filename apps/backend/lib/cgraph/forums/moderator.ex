defmodule CGraph.Forums.Moderator do
  @moduledoc """
  Schema for forum moderators.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  @type t :: %__MODULE__{}

  schema "forum_moderators" do
    belongs_to :forum, CGraph.Forums.Forum
    belongs_to :user, CGraph.Accounts.User

    field :permissions, {:array, :string}, default: []
    field :added_by_id, :binary_id
    field :notes, :string

    timestamps()
  end

  @doc "Builds a changeset for validating and casting attributes."
  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(moderator, attrs) do
    moderator
    |> cast(attrs, [:forum_id, :user_id, :permissions, :added_by_id, :notes])
    |> validate_required([:forum_id, :user_id])
    |> unique_constraint([:forum_id, :user_id])
    |> foreign_key_constraint(:forum_id)
    |> foreign_key_constraint(:user_id)
  end
end
