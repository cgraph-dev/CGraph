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
