defmodule CgraphWeb.API.V1.CommentJSON do
  @moduledoc """
  JSON rendering for comment responses.
  """

  alias CgraphWeb.API.V1.UserJSON

  def index(%{comments: comments, meta: meta}) do
    %{
      data: Enum.map(comments, &comment_data/1),
      meta: meta
    }
  end

  def show(%{comment: comment}) do
    %{data: comment_data(comment)}
  end

  def vote(%{vote: vote, comment: comment}) do
    %{
      data: %{
        vote_type: vote.vote_type,
        score: comment.score,
        upvotes: comment.upvotes,
        downvotes: comment.downvotes
      }
    }
  end

  def report(%{report: report}) do
    %{
      data: %{
        id: report.id,
        status: "submitted",
        message: "Report submitted successfully"
      }
    }
  end

  @doc """
  Render comment data with author, votes, and replies.
  API uses `content` field (not `body`) for comment text.
  """
  def comment_data(comment) do
    %{
      id: comment.id,
      content: comment.content,
      post_id: comment.post_id,
      parent_id: comment.parent_id,
      depth: Map.get(comment, :depth, 0),
      # Voting
      score: Map.get(comment, :score, 0),
      upvotes: Map.get(comment, :upvotes, 0),
      downvotes: Map.get(comment, :downvotes, 0),
      user_vote: Map.get(comment, :user_vote), # :up, :down, or nil
      # Status
      is_deleted: not is_nil(Map.get(comment, :deleted_at)),
      is_collapsed: Map.get(comment, :is_collapsed, false),
      # Replies
      reply_count: Map.get(comment, :reply_count, 0),
      replies: render_replies(comment.replies),
      # Author
      author: render_author(comment),
      # Timestamps
      created_at: comment.inserted_at,
      updated_at: comment.updated_at,
      edited_at: Map.get(comment, :edited_at)
    }
  end

  defp render_replies(nil), do: []
  defp render_replies(%Ecto.Association.NotLoaded{}), do: []
  defp render_replies(replies) when is_list(replies) do
    Enum.map(replies, &comment_data/1)
  end

  # Render author - handles `author` association (not `user`)
  # Also guards against deleted comments and unloaded associations
  defp render_author(%{deleted_at: deleted_at}) when not is_nil(deleted_at), do: nil
  defp render_author(%{author: nil}), do: nil
  defp render_author(%{author: %Ecto.Association.NotLoaded{}}), do: nil
  defp render_author(%{author: author}) do
    UserJSON.user_data(author)
  end
  # Fallback for legacy `user` field if present
  defp render_author(%{user: user}) when not is_nil(user), do: UserJSON.user_data(user)
  defp render_author(_), do: nil
end
