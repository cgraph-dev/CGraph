defmodule CgraphWeb.API.V1.PostController do
  @moduledoc """
  Handles forum posts.
  Posts are the main content units in forums with voting and comments.
  """
  use CgraphWeb, :controller

  alias Cgraph.Forums

  action_fallback CgraphWeb.FallbackController

  @doc """
  List posts in a forum.
  GET /api/v1/forums/:forum_id/posts
  """
  def index(conn, %{"forum_id" => forum_id} = params) do
    user = Map.get(conn.assigns, :current_user)
    page = Map.get(params, "page", "1") |> String.to_integer()
    per_page = Map.get(params, "per_page", "20") |> String.to_integer() |> min(50)
    sort = Map.get(params, "sort", "hot") # hot, new, top, controversial
    category_id = Map.get(params, "category_id")
    
    with {:ok, forum} <- Forums.get_forum(forum_id),
         :ok <- Forums.authorize_action(user, forum, :view) do
      user_id = if user, do: user.id, else: nil
      {posts, meta} = Forums.list_posts(forum,
        page: page,
        per_page: per_page,
        sort: sort,
        category_id: category_id,
        user_id: user_id # For vote status
      )
      render(conn, :index, posts: posts, meta: meta)
    end
  end

  @doc """
  Get a specific post.
  GET /api/v1/forums/:forum_id/posts/:id
  """
  def show(conn, %{"forum_id" => forum_id, "id" => post_id}) do
    user = Map.get(conn.assigns, :current_user)
    
    with {:ok, forum} <- Forums.get_forum(forum_id),
         :ok <- Forums.authorize_action(user, forum, :view) do
      user_id = if user, do: user.id, else: nil
      with {:ok, post} <- Forums.get_post(forum, post_id, user_id: user_id) do
        # Increment view count
        Forums.increment_post_views(post)
        render(conn, :show, post: post)
      end
    end
  end

  @doc """
  Create a new post.
  POST /api/v1/forums/:forum_id/posts
  
  Params:
  - title: Post title (required)
  - content: Post content (required for text posts)
  - type: Post type - text, link, image, poll (default: text)
  """
  def create(conn, %{"forum_id" => forum_id} = params) do
    user = conn.assigns.current_user
    # Accept params either nested under "post" key or directly
    post_params = Map.get(params, "post") || extract_post_params(params)
    
    with {:ok, forum} <- Forums.get_forum(forum_id),
         :ok <- Forums.authorize_action(user, forum, :create_post),
         :ok <- validate_post_rate_limit(user),
         {:ok, post} <- Forums.create_post(forum, user, post_params) do
      conn
      |> put_status(:created)
      |> render(:show, post: post)
    end
  end

  # Extract post params when not nested
  defp extract_post_params(params) do
    params
    |> Map.take(["title", "content", "body", "type", "link", "url", "flair", "is_nsfw", "tags"])
    |> normalize_post_fields()
  end
  
  # Normalize field names for compatibility
  defp normalize_post_fields(params) do
    params
    |> maybe_rename_field("body", "content")
    |> maybe_rename_field("url", "link")
  end
  
  defp maybe_rename_field(params, from, to) do
    if Map.has_key?(params, from) && !Map.has_key?(params, to) do
      params
      |> Map.put(to, Map.get(params, from))
      |> Map.delete(from)
    else
      params
    end
  end

  @doc """
  Update a post.
  PUT /api/v1/forums/:forum_id/posts/:id
  """
  def update(conn, %{"forum_id" => forum_id, "id" => post_id} = params) do
    user = conn.assigns.current_user
    post_params = Map.get(params, "post") || extract_post_params(params)
    
    with {:ok, forum} <- Forums.get_forum(forum_id),
         {:ok, post} <- Forums.get_post(forum, post_id),
         :ok <- authorize_post_edit(user, post, forum),
         {:ok, updated_post} <- Forums.update_post(post, post_params) do
      render(conn, :show, post: updated_post)
    end
  end

  @doc """
  Delete a post.
  DELETE /api/v1/forums/:forum_id/posts/:id
  """
  def delete(conn, %{"forum_id" => forum_id, "id" => post_id}) do
    user = conn.assigns.current_user
    
    with {:ok, forum} <- Forums.get_forum(forum_id),
         {:ok, post} <- Forums.get_post(forum, post_id),
         :ok <- authorize_post_delete(user, post, forum),
         {:ok, _} <- Forums.delete_post(post) do
      send_resp(conn, :no_content, "")
    end
  end

  @doc """
  Vote on a post.
  POST /api/v1/forums/:forum_id/posts/:id/vote
  
  Accepts `direction` param: "up" or "down"
  """
  def vote(conn, %{"forum_id" => forum_id, "post_id" => post_id, "direction" => direction}) do
    user = conn.assigns.current_user
    vote_direction = if direction == "up", do: :up, else: :down
    
    with {:ok, forum} <- Forums.get_forum(forum_id),
         :ok <- Forums.authorize_action(user, forum, :vote),
         {:ok, post} <- Forums.get_post(forum, post_id),
         {:ok, vote} <- Forums.vote_on_post(user, post, vote_direction) do
      render(conn, :vote, vote: vote, post: post)
    end
  end

  @doc """
  Upvote a post.
  POST /api/v1/forums/:forum_id/posts/:id/upvote
  """
  def upvote(conn, %{"forum_id" => forum_id, "id" => post_id}) do
    user = conn.assigns.current_user
    
    with {:ok, forum} <- Forums.get_forum(forum_id),
         :ok <- Forums.authorize_action(user, forum, :vote),
         {:ok, post} <- Forums.get_post(forum, post_id),
         {:ok, vote} <- Forums.vote_on_post(user, post, :up) do
      render(conn, :vote, vote: vote, post: post)
    end
  end

  @doc """
  Downvote a post.
  POST /api/v1/forums/:forum_id/posts/:id/downvote
  """
  def downvote(conn, %{"forum_id" => forum_id, "id" => post_id}) do
    user = conn.assigns.current_user
    
    with {:ok, forum} <- Forums.get_forum(forum_id),
         :ok <- Forums.authorize_action(user, forum, :vote),
         {:ok, post} <- Forums.get_post(forum, post_id),
         {:ok, vote} <- Forums.vote_on_post(user, post, :down) do
      render(conn, :vote, vote: vote, post: post)
    end
  end

  @doc """
  Remove vote from a post.
  DELETE /api/v1/forums/:forum_id/posts/:id/vote
  """
  def unvote(conn, %{"forum_id" => forum_id, "id" => post_id}) do
    user = conn.assigns.current_user
    
    with {:ok, forum} <- Forums.get_forum(forum_id),
         {:ok, post} <- Forums.get_post(forum, post_id),
         {:ok, _} <- Forums.remove_vote(user, post) do
      send_resp(conn, :no_content, "")
    end
  end

  @doc """
  Pin a post.
  POST /api/v1/forums/:forum_id/posts/:id/pin
  """
  def pin(conn, %{"forum_id" => forum_id, "id" => post_id}) do
    user = conn.assigns.current_user
    
    with {:ok, forum} <- Forums.get_forum(forum_id),
         :ok <- Forums.authorize_action(user, forum, :moderate),
         {:ok, post} <- Forums.get_post(forum, post_id),
         {:ok, updated_post} <- Forums.pin_post(post) do
      render(conn, :show, post: updated_post)
    end
  end

  @doc """
  Unpin a post.
  DELETE /api/v1/forums/:forum_id/posts/:id/pin
  """
  def unpin(conn, %{"forum_id" => forum_id, "id" => post_id}) do
    user = conn.assigns.current_user
    
    with {:ok, forum} <- Forums.get_forum(forum_id),
         :ok <- Forums.authorize_action(user, forum, :moderate),
         {:ok, post} <- Forums.get_post(forum, post_id),
         {:ok, updated_post} <- Forums.unpin_post(post) do
      render(conn, :show, post: updated_post)
    end
  end

  @doc """
  Lock a post (prevent new comments).
  POST /api/v1/forums/:forum_id/posts/:id/lock
  """
  def lock(conn, %{"forum_id" => forum_id, "id" => post_id}) do
    user = conn.assigns.current_user
    
    with {:ok, forum} <- Forums.get_forum(forum_id),
         :ok <- Forums.authorize_action(user, forum, :moderate),
         {:ok, post} <- Forums.get_post(forum, post_id),
         {:ok, updated_post} <- Forums.lock_post(post) do
      render(conn, :show, post: updated_post)
    end
  end

  @doc """
  Unlock a post.
  DELETE /api/v1/forums/:forum_id/posts/:id/lock
  """
  def unlock(conn, %{"forum_id" => forum_id, "id" => post_id}) do
    user = conn.assigns.current_user
    
    with {:ok, forum} <- Forums.get_forum(forum_id),
         :ok <- Forums.authorize_action(user, forum, :moderate),
         {:ok, post} <- Forums.get_post(forum, post_id),
         {:ok, updated_post} <- Forums.unlock_post(post) do
      render(conn, :show, post: updated_post)
    end
  end

  @doc """
  Report a post.
  POST /api/v1/forums/:forum_id/posts/:id/report
  """
  def report(conn, %{"forum_id" => forum_id, "id" => post_id} = params) do
    user = conn.assigns.current_user
    reason = Map.get(params, "reason", "")
    
    with {:ok, forum} <- Forums.get_forum(forum_id),
         {:ok, post} <- Forums.get_post(forum, post_id),
         {:ok, report} <- Forums.report_post(user, post, reason) do
      conn
      |> put_status(:created)
      |> render(:report, report: report)
    end
  end

  @doc """
  Get aggregated post feed from all public forums.
  GET /api/v1/posts/feed
  """
  def feed(conn, params) do
    user = Map.get(conn.assigns, :current_user)
    page = Map.get(params, "page", "1") |> String.to_integer()
    per_page = Map.get(params, "per_page", "25") |> String.to_integer() |> min(50)
    sort = Map.get(params, "sort", "hot")
    time = Map.get(params, "time", "day")
    
    user_id = if user, do: user.id, else: nil
    {posts, meta} = Forums.list_public_feed(
      page: page,
      per_page: per_page,
      sort: sort,
      time_range: time,
      user_id: user_id
    )
    render(conn, :index, posts: posts, meta: meta)
  end

  # Private helpers

  defp validate_post_rate_limit(user) do
    case Forums.check_post_rate_limit(user) do
      :ok -> :ok
      {:error, seconds_remaining} -> {:error, {:rate_limited, seconds_remaining}}
    end
  end

  defp authorize_post_edit(user, post, forum) do
    cond do
      post.user_id == user.id -> :ok
      Forums.is_moderator?(user, forum) -> :ok
      true -> {:error, :unauthorized}
    end
  end

  defp authorize_post_delete(user, post, forum) do
    cond do
      post.user_id == user.id -> :ok
      Forums.is_moderator?(user, forum) -> :ok
      true -> {:error, :unauthorized}
    end
  end
end
