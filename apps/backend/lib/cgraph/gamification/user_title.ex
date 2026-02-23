defmodule CGraph.Gamification.UserTitle do
  @moduledoc """
  Schema for tracking which titles a user has unlocked.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "user_titles" do
    belongs_to :user, CGraph.Accounts.User
    belongs_to :title, CGraph.Gamification.Title

    field :unlocked_at, :utc_datetime

    timestamps(type: :utc_datetime)
  end

  @doc false
  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(user_title, attrs) do
    user_title
    |> cast(attrs, [:user_id, :title_id, :unlocked_at])
    |> validate_required([:user_id, :title_id, :unlocked_at])
    |> unique_constraint([:user_id, :title_id])
    |> foreign_key_constraint(:user_id)
    |> foreign_key_constraint(:title_id)
  end
end
