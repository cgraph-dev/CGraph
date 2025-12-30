defmodule CgraphWeb.API.V1.ForumController do
  @moduledoc """
  Handles forum management.
  Forums contain categories and posts for discussion.
  """
  use CgraphWeb, :controller

  alias Cgraph.Forums

  action_fallback CgraphWeb.FallbackController

  @doc """
  List all forums visible to the user.
  GET /api/v1/forums
  """
  def index(conn, params) do
    user = conn.assigns.current_user
    page = Map.get(params, "page", "1") |> String.to_integer()
    per_page = Map.get(params, "per_page", "20") |> String.to_integer() |> min(50)
    
    {forums, meta} = Forums.list_forums_for_user(user, page: page, per_page: per_page)
    render(conn, :index, forums: forums, meta: meta)
  end

  @doc """
  Get a specific forum.
  GET /api/v1/forums/:id
  """
  def show(conn, %{"id" => forum_id}) do
    user = conn.assigns.current_user
    
    with {:ok, forum} <- Forums.get_forum(forum_id),
         :ok <- Forums.authorize_action(user, forum, :view) do
      render(conn, :show, forum: forum)
    end
  end

  @doc """
  Create a new forum.
  POST /api/v1/forums
  Requires admin privileges.
  """
  def create(conn, params) do
    user = conn.assigns.current_user
    # Accept params either nested under "forum" key or directly
    forum_params = Map.get(params, "forum") || extract_forum_params(params)
    
    with :ok <- authorize_forum_creation(user),
         {:ok, forum} <- Forums.create_forum(user, forum_params) do
      conn
      |> put_status(:created)
      |> render(:show, forum: forum)
    end
  end

  # Extract forum params when not nested under "forum" key
  defp extract_forum_params(params) do
    params
    |> Map.take(["name", "slug", "description", "title", "is_public", "is_nsfw"])
    |> Enum.reject(fn {_k, v} -> is_nil(v) end)
    |> Map.new()
  end

  @doc """
  Update a forum.
  PUT /api/v1/forums/:id
  """
  def update(conn, %{"id" => forum_id} = params) do
    user = conn.assigns.current_user
    forum_params = Map.get(params, "forum", %{})
    
    with {:ok, forum} <- Forums.get_forum(forum_id),
         :ok <- Forums.authorize_action(user, forum, :manage),
         {:ok, updated_forum} <- Forums.update_forum(forum, forum_params) do
      render(conn, :show, forum: updated_forum)
    end
  end

  @doc """
  Delete a forum.
  DELETE /api/v1/forums/:id
  """
  def delete(conn, %{"id" => forum_id}) do
    user = conn.assigns.current_user
    
    with {:ok, forum} <- Forums.get_forum(forum_id),
         :ok <- Forums.authorize_action(user, forum, :delete),
         {:ok, _} <- Forums.delete_forum(forum) do
      send_resp(conn, :no_content, "")
    end
  end

  @doc """
  Get moderation queue for a forum.
  GET /api/v1/forums/:id/mod_queue
  """
  def mod_queue(conn, %{"id" => forum_id} = params) do
    user = conn.assigns.current_user
    page = Map.get(params, "page", "1") |> String.to_integer()
    per_page = Map.get(params, "per_page", "20") |> String.to_integer() |> min(50)
    filter = Map.get(params, "filter", "all") # all, reported, pending_approval
    
    with {:ok, forum} <- Forums.get_forum(forum_id),
         :ok <- Forums.authorize_action(user, forum, :moderate) do
      {items, meta} = Forums.get_mod_queue(forum,
        page: page,
        per_page: per_page,
        filter: filter
      )
      render(conn, :mod_queue, items: items, meta: meta)
    end
  end

  @doc """
  Get forum statistics.
  GET /api/v1/forums/:id/stats
  """
  def stats(conn, %{"id" => forum_id}) do
    user = conn.assigns.current_user
    
    with {:ok, forum} <- Forums.get_forum(forum_id),
         :ok <- Forums.authorize_action(user, forum, :view) do
      stats = Forums.get_forum_stats(forum)
      render(conn, :stats, stats: stats)
    end
  end

  @doc """
  Subscribe to forum notifications.
  POST /api/v1/forums/:id/subscribe
  """
  def subscribe(conn, %{"id" => forum_id}) do
    user = conn.assigns.current_user
    
    with {:ok, forum} <- Forums.get_forum(forum_id),
         :ok <- Forums.authorize_action(user, forum, :view),
         {:ok, subscription} <- Forums.subscribe_to_forum(user, forum) do
      render(conn, :subscription, subscription: subscription)
    end
  end

  @doc """
  Unsubscribe from forum notifications.
  DELETE /api/v1/forums/:id/subscribe
  """
  def unsubscribe(conn, %{"id" => forum_id}) do
    user = conn.assigns.current_user
    
    with {:ok, forum} <- Forums.get_forum(forum_id),
         {:ok, _} <- Forums.unsubscribe_from_forum(user, forum) do
      send_resp(conn, :no_content, "")
    end
  end

  # ============================================================================
  # Forum Voting (Competition)
  # ============================================================================

  @doc """
  Vote on a forum.
  POST /api/v1/forums/:id/vote
  Body: { "value": 1 } for upvote, { "value": -1 } for downvote
  """
  def vote(conn, %{"id" => forum_id, "value" => value}) when value in [1, -1, "1", "-1"] do
    user = conn.assigns.current_user
    vote_value = if is_binary(value), do: String.to_integer(value), else: value
    
    with {:ok, forum} <- Forums.get_forum(forum_id),
         :ok <- Forums.authorize_action(user, forum, :vote),
         {:ok, result} <- Forums.vote_forum(user, forum_id, vote_value),
         {:ok, updated_forum} <- Forums.get_forum_with_vote(forum_id, user.id) do
      conn
      |> put_status(:ok)
      |> json(%{
        result: result,
        forum: %{
          id: updated_forum.id,
          score: updated_forum.score,
          upvotes: updated_forum.upvotes,
          downvotes: updated_forum.downvotes,
          user_vote: updated_forum.user_vote
        }
      })
    end
  end

  def vote(conn, %{"id" => _forum_id}) do
    conn
    |> put_status(:unprocessable_entity)
    |> json(%{error: "value must be 1 (upvote) or -1 (downvote)"})
  end

  @doc """
  Get user's vote on a forum.
  GET /api/v1/forums/:id/vote
  """
  def get_vote(conn, %{"id" => forum_id}) do
    user = conn.assigns.current_user
    
    vote = Forums.get_user_forum_vote(user.id, forum_id)
    user_vote = if vote, do: vote.value, else: 0
    
    conn
    |> put_status(:ok)
    |> json(%{user_vote: user_vote})
  end

  @doc """
  Remove vote on a forum.
  DELETE /api/v1/forums/:id/vote
  """
  def remove_vote(conn, %{"id" => forum_id}) do
    user = conn.assigns.current_user
    
    case Forums.get_user_forum_vote(user.id, forum_id) do
      nil ->
        conn
        |> put_status(:ok)
        |> json(%{result: :no_vote})
      
      vote ->
        with {:ok, _} <- Forums.vote_forum(user, forum_id, vote.value) do
          conn
          |> put_status(:ok)
          |> json(%{result: :removed})
        end
    end
  end

  # ============================================================================
  # Leaderboard
  # ============================================================================

  @doc """
  Get forum leaderboard.
  GET /api/v1/forums/leaderboard
  Query params: sort (hot, top, new, rising, weekly, members), page, per_page
  """
  def leaderboard(conn, params) do
    user = conn.assigns[:current_user]
    page = Map.get(params, "page", "1") |> String.to_integer()
    per_page = Map.get(params, "per_page", "25") |> String.to_integer() |> min(50)
    sort = Map.get(params, "sort", "hot")
    featured_only = Map.get(params, "featured", "false") == "true"

    {forums, meta} = Forums.list_forum_leaderboard(
      page: page,
      per_page: per_page,
      sort: sort,
      featured_only: featured_only
    )

    # Add user votes if authenticated
    forums_with_votes = if user do
      Enum.map(forums, fn forum ->
        vote = Forums.get_user_forum_vote(user.id, forum.id)
        Map.put(forum, :user_vote, if(vote, do: vote.value, else: 0))
      end)
    else
      Enum.map(forums, fn forum -> Map.put(forum, :user_vote, 0) end)
    end

    render(conn, :leaderboard, forums: forums_with_votes, meta: meta)
  end

  @doc """
  Get top forums (quick list).
  GET /api/v1/forums/top
  """
  def top(conn, params) do
    limit = Map.get(params, "limit", "10") |> String.to_integer() |> min(25)
    sort = Map.get(params, "sort", "hot")
    
    forums = Forums.get_top_forums(limit, sort)
    render(conn, :top, forums: forums)
  end

  # Private helpers

  defp authorize_forum_creation(user) do
    # Check if user has permission to create forums
    # Currently allows admins; could be extended to check account age/reputation
    if user.is_admin do
      :ok
    else
      {:error, :unauthorized}
    end
  end
end
