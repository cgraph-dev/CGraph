defmodule Cgraph.Forums.ThreadVote do
  @moduledoc """
  Vote schema for thread voting.
  
  Each user can have one vote per thread.
  Vote value is 1 (upvote) or -1 (downvote).
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  schema "thread_votes" do
    field :value, :integer

    belongs_to :thread, Cgraph.Forums.Thread
    belongs_to :user, Cgraph.Accounts.User

    timestamps()
  end

  def changeset(vote, attrs) do
    vote
    |> cast(attrs, [:value, :thread_id, :user_id])
    |> validate_required([:value, :thread_id, :user_id])
    |> validate_inclusion(:value, [-1, 1])
    |> unique_constraint([:thread_id, :user_id])
    |> foreign_key_constraint(:thread_id)
    |> foreign_key_constraint(:user_id)
  end
end
