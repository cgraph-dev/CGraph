defmodule Cgraph.Forums.ForumVote do
  @moduledoc """
  Vote schema for forum-level voting.
  
  Each user can upvote or downvote a forum once.
  Used for Reddit-style forum popularity competition.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  schema "forum_votes" do
    field :value, :integer  # 1 (upvote) or -1 (downvote)

    belongs_to :user, Cgraph.Accounts.User
    belongs_to :forum, Cgraph.Forums.Forum

    timestamps()
  end

  @doc """
  Create or update a forum vote.
  """
  def changeset(vote, attrs) do
    vote
    |> cast(attrs, [:value, :user_id, :forum_id])
    |> validate_required([:value, :user_id, :forum_id])
    |> validate_inclusion(:value, [-1, 1], message: "must be 1 (upvote) or -1 (downvote)")
    |> unique_constraint([:user_id, :forum_id], name: :forum_votes_user_forum_unique)
    |> foreign_key_constraint(:user_id)
    |> foreign_key_constraint(:forum_id)
  end
end
