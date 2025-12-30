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
    user = Map.get(conn.assigns, :current_user)
    page = Map.get(params, "page", "1") |> String.to_integer()
    per_page = Map.get(params, "per_page", "20") |> String.to_integer() |> min(50)
    
    {forums, meta} = Forums.list_forums_for_user(user, page: page, per_page: per_page)
    render(conn, :index, forums: forums, meta: meta)
  end

  @doc """
  Get a specific forum by ID or slug.
  GET /api/v1/forums/:id
  
  The :id parameter can be either a UUID or a slug.
  """
  def show(conn, %{"id" => forum_id_or_slug}) do
    user = Map.get(conn.assigns, :current_user)
    
    # Try to get forum by ID first, then by slug
    with {:ok, forum} <- get_forum_by_id_or_slug(forum_id_or_slug),
         :ok <- Forums.authorize_action(user, forum, :view) do
      render(conn, :show, forum: forum)
    end
  end
  
  # Helper to get forum by ID or slug
  defp get_forum_by_id_or_slug(id_or_slug) do
    # Check if it looks like a UUID (36 chars with hyphens or 32 chars alphanumeric)
    if is_uuid?(id_or_slug) do
      Forums.get_forum(id_or_slug)
    else
      Forums.get_forum_by_slug(id_or_slug)
    end
  end
  
  defp is_uuid?(string) do
    case Ecto.UUID.cast(string) do
      {:ok, _} -> true
      :error -> false
    end
  end

  @doc """
  Create a new forum.
  POST /api/v1/forums
  
  Any authenticated user can create forums, subject to their subscription tier limits:
  - Free: 1 forum
  - Starter ($5/mo): 3 forums
  - Pro ($15/mo): 10 forums  
  - Business ($50/mo): Unlimited
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
    # Check user's subscription tier and forum count limits
    # Tier limits:
    # - free: 1 forum
    # - starter: 3 forums
    # - pro: 10 forums
    # - business: unlimited
    user_tier = Map.get(user, :subscription_tier) || "free"
    owned_forums_count = Forums.count_user_forums(user.id)
    
    max_forums = case user_tier do
      "business" -> :infinity
      "pro" -> 10
      "starter" -> 3
      _ -> 1  # free tier
    end
    
    cond do
      max_forums == :infinity -> :ok
      owned_forums_count < max_forums -> :ok
      true -> 
        {:error, %{
          code: :forum_limit_reached,
          message: "You've reached your forum limit (#{max_forums}). Upgrade your subscription to create more forums.",
          current_count: owned_forums_count,
          max_allowed: max_forums,
          tier: user_tier
        }}
    end
  end
end
