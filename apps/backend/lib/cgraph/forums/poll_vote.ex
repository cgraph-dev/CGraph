defmodule CGraph.Forums.PollVote do
  @moduledoc """
  Poll vote schema - tracks user votes on polls.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  schema "poll_votes" do
    belongs_to :poll, CGraph.Forums.ThreadPoll
    belongs_to :user, CGraph.Accounts.User

    timestamps(updated_at: false)
  end

  @doc "Builds a changeset for validating and casting attributes."
  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(vote, attrs) do
    vote
    |> cast(attrs, [:poll_id, :user_id])
    |> validate_required([:poll_id, :user_id])
    |> unique_constraint([:poll_id, :user_id])
    |> foreign_key_constraint(:poll_id)
    |> foreign_key_constraint(:user_id)
  end
end
