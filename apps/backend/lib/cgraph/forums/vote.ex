defmodule Cgraph.Forums.Vote do
  @moduledoc """
  Vote schema for posts and comments.
  
  Each user can have one vote per post/comment.
  Vote value is 1 (upvote) or -1 (downvote).
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  schema "votes" do
    field :value, :integer  # 1 or -1

    belongs_to :user, Cgraph.Accounts.User
    belongs_to :post, Cgraph.Forums.Post
    belongs_to :comment, Cgraph.Forums.Comment

    timestamps()
  end

  @doc """
  Create or update a vote.
  """
  def changeset(vote, attrs) do
    vote
    |> cast(attrs, [:value, :user_id, :post_id, :comment_id])
    |> validate_required([:value, :user_id])
    |> validate_inclusion(:value, [-1, 1])
    |> validate_vote_target()
    |> unique_constraint([:user_id, :post_id], name: :votes_user_post_unique)
    |> unique_constraint([:user_id, :comment_id], name: :votes_user_comment_unique)
    |> foreign_key_constraint(:user_id)
    |> foreign_key_constraint(:post_id)
    |> foreign_key_constraint(:comment_id)
  end

  # Either post_id OR comment_id must be present, not both
  defp validate_vote_target(changeset) do
    post_id = get_field(changeset, :post_id)
    comment_id = get_field(changeset, :comment_id)

    case {post_id, comment_id} do
      {nil, nil} ->
        add_error(changeset, :post_id, "vote must be on a post or comment")
      {_, nil} -> changeset
      {nil, _} -> changeset
      {_, _} ->
        add_error(changeset, :comment_id, "vote cannot be on both post and comment")
    end
  end
end
