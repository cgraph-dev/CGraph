defmodule Cgraph.Forums.PollVote do
  @moduledoc """
  Poll vote schema - tracks user votes on polls.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  schema "poll_votes" do
    field :option_ids, {:array, :string}, default: []

    belongs_to :poll, Cgraph.Forums.ThreadPoll
    belongs_to :user, Cgraph.Accounts.User

    timestamps()
  end

  def changeset(vote, attrs) do
    vote
    |> cast(attrs, [:option_ids, :poll_id, :user_id])
    |> validate_required([:option_ids, :poll_id, :user_id])
    |> unique_constraint([:poll_id, :user_id])
    |> foreign_key_constraint(:poll_id)
    |> foreign_key_constraint(:user_id)
  end
end
