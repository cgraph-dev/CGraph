defmodule CgraphWeb.API.V1.CommentController do
  @moduledoc """
  Handles comments on forum posts.
  Supports nested/threaded comments with voting.
  """
  use CgraphWeb, :controller

  alias Cgraph.Forums

  action_fallback CgraphWeb.FallbackController

  @doc """
  List comments on a post.
  GET /api/v1/forums/:forum_id/posts/:post_id/comments
  """
  def index(conn, %{"forum_id" => forum_id, "post_id" => post_id} = params) do
    user = conn.assigns.current_user
    page = Map.get(params, "page", "1") |> String.to_integer()
    per_page = Map.get(params, "per_page", "50") |> String.to_integer() |> min(100)
    sort = Map.get(params, "sort", "best") # best, new, old, controversial
    parent_id = Map.get(params, "parent_id") # For loading replies to a specific comment
    
    with {:ok, forum} <- Forums.get_forum(forum_id),
         :ok <- Forums.authorize_action(user, forum, :view),
         {:ok, post} <- Forums.get_post(forum, post_id) do
      {comments, meta} = Forums.list_comments(post,
        page: page,
        per_page: per_page,
        sort: sort,
        parent_id: parent_id,
        user_id: user.id
      )
      render(conn, :index, comments: comments, meta: meta)
    end
  end

  @doc """
  Get a specific comment with its replies.
  GET /api/v1/forums/:forum_id/posts/:post_id/comments/:id
  """
  def show(conn, %{"forum_id" => forum_id, "post_id" => post_id, "id" => comment_id}) do
    user = conn.assigns.current_user
    
    with {:ok, forum} <- Forums.get_forum(forum_id),
         :ok <- Forums.authorize_action(user, forum, :view),
         {:ok, post} <- Forums.get_post(forum, post_id),
         {:ok, comment} <- Forums.get_comment(post, comment_id, user_id: user.id) do
      render(conn, :show, comment: comment)
    end
  end

  @doc """
  Create a new comment.
  POST /api/v1/forums/:forum_id/posts/:post_id/comments
  
  Params:
  - content: Comment text (required)
  - parent_id: ID of parent comment for replies (optional)
  """
  def create(conn, %{"forum_id" => forum_id, "post_id" => post_id} = params) do
    user = conn.assigns.current_user
    # Accept params either nested under "comment" key or directly
    comment_params = Map.get(params, "comment") || extract_comment_params(params)
    
    with {:ok, forum} <- Forums.get_forum(forum_id),
         :ok <- Forums.authorize_action(user, forum, :comment),
         {:ok, post} <- Forums.get_post(forum, post_id),
         :ok <- validate_post_not_locked(post),
         :ok <- validate_comment_rate_limit(user),
         {:ok, comment} <- Forums.create_comment(post, user, comment_params) do
      # Notify post author and parent comment author
      Forums.notify_comment(comment)
      
      conn
      |> put_status(:created)
      |> render(:show, comment: comment)
    end
  end

  # Extract comment params when not nested
  defp extract_comment_params(params) do
    params
    |> Map.take(["content", "parent_id", "body"])
    |> normalize_content_field()
  end
  
  # Support both "body" and "content" field names
  defp normalize_content_field(params) do
    if Map.has_key?(params, "body") && !Map.has_key?(params, "content") do
      Map.put(params, "content", Map.get(params, "body"))
    else
      params
    end
  end

  @doc """
  Update a comment.
  PUT /api/v1/forums/:forum_id/posts/:post_id/comments/:id
  """
  def update(conn, %{"forum_id" => forum_id, "post_id" => post_id, "id" => comment_id} = params) do
    user = conn.assigns.current_user
    comment_params = Map.get(params, "comment", %{})
    
    with {:ok, forum} <- Forums.get_forum(forum_id),
         {:ok, post} <- Forums.get_post(forum, post_id),
         {:ok, comment} <- Forums.get_comment(post, comment_id),
         :ok <- authorize_comment_edit(user, comment, forum),
         {:ok, updated_comment} <- Forums.update_comment(comment, comment_params) do
      render(conn, :show, comment: updated_comment)
    end
  end

  @doc """
  Delete a comment.
  DELETE /api/v1/forums/:forum_id/posts/:post_id/comments/:id
  """
  def delete(conn, %{"forum_id" => forum_id, "post_id" => post_id, "id" => comment_id}) do
    user = conn.assigns.current_user
    
    with {:ok, forum} <- Forums.get_forum(forum_id),
         {:ok, post} <- Forums.get_post(forum, post_id),
         {:ok, comment} <- Forums.get_comment(post, comment_id),
         :ok <- authorize_comment_delete(user, comment, forum),
         {:ok, _} <- Forums.delete_comment(comment) do
      send_resp(conn, :no_content, "")
    end
  end

  @doc """
  Upvote a comment.
  POST /api/v1/forums/:forum_id/posts/:post_id/comments/:id/upvote
  """
  def upvote(conn, %{"forum_id" => forum_id, "post_id" => post_id, "id" => comment_id}) do
    user = conn.assigns.current_user
    
    with {:ok, forum} <- Forums.get_forum(forum_id),
         :ok <- Forums.authorize_action(user, forum, :vote),
         {:ok, post} <- Forums.get_post(forum, post_id),
         {:ok, comment} <- Forums.get_comment(post, comment_id),
         {:ok, vote} <- Forums.vote_on_comment(user, comment, :up) do
      render(conn, :vote, vote: vote, comment: comment)
    end
  end

  @doc """
  Downvote a comment.
  POST /api/v1/forums/:forum_id/posts/:post_id/comments/:id/downvote
  """
  def downvote(conn, %{"forum_id" => forum_id, "post_id" => post_id, "id" => comment_id}) do
    user = conn.assigns.current_user
    
    with {:ok, forum} <- Forums.get_forum(forum_id),
         :ok <- Forums.authorize_action(user, forum, :vote),
         {:ok, post} <- Forums.get_post(forum, post_id),
         {:ok, comment} <- Forums.get_comment(post, comment_id),
         {:ok, vote} <- Forums.vote_on_comment(user, comment, :down) do
      render(conn, :vote, vote: vote, comment: comment)
    end
  end

  @doc """
  Remove vote from a comment.
  DELETE /api/v1/forums/:forum_id/posts/:post_id/comments/:id/vote
  """
  def unvote(conn, %{"forum_id" => forum_id, "post_id" => post_id, "id" => comment_id}) do
    user = conn.assigns.current_user
    
    with {:ok, forum} <- Forums.get_forum(forum_id),
         {:ok, post} <- Forums.get_post(forum, post_id),
         {:ok, comment} <- Forums.get_comment(post, comment_id),
         {:ok, _} <- Forums.remove_comment_vote(user, comment) do
      send_resp(conn, :no_content, "")
    end
  end

  @doc """
  Report a comment.
  POST /api/v1/forums/:forum_id/posts/:post_id/comments/:id/report
  """
  def report(conn, %{"forum_id" => forum_id, "post_id" => post_id, "id" => comment_id} = params) do
    user = conn.assigns.current_user
    reason = Map.get(params, "reason", "")
    
    with {:ok, forum} <- Forums.get_forum(forum_id),
         {:ok, post} <- Forums.get_post(forum, post_id),
         {:ok, comment} <- Forums.get_comment(post, comment_id),
         {:ok, report} <- Forums.report_comment(user, comment, reason) do
      conn
      |> put_status(:created)
      |> render(:report, report: report)
    end
  end

  # Private helpers

  defp validate_post_not_locked(post) do
    if post.is_locked do
      {:error, :post_locked}
    else
      :ok
    end
  end

  defp validate_comment_rate_limit(user) do
    case Forums.check_comment_rate_limit(user) do
      :ok -> :ok
      {:error, seconds_remaining} -> {:error, {:rate_limited, seconds_remaining}}
    end
  end

  defp authorize_comment_edit(user, comment, forum) do
    cond do
      comment.user_id == user.id -> :ok
      Forums.is_moderator?(user, forum) -> :ok
      true -> {:error, :unauthorized}
    end
  end

  defp authorize_comment_delete(user, comment, forum) do
    cond do
      comment.user_id == user.id -> :ok
      Forums.is_moderator?(user, forum) -> :ok
      true -> {:error, :unauthorized}
    end
  end
end
