defmodule CGraphWeb.API.V1.ProfileController do
  @moduledoc """
  Controller for User Profile management.
  Implements MyBB-style profile with signature, bio, reputation, and activity.

  ## Features
  - Profile viewing
  - Signature management
  - Bio updates
  - User posts and threads
  - Reputation system
  - Activity feed
  """
  use CGraphWeb, :controller

  alias CGraph.Accounts
  alias CGraph.Forums
  alias CGraph.Reputation

  action_fallback CGraphWeb.FallbackController

  @max_per_page 100

  @doc """
  Get current user's profile.
  """
  @spec me(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def me(conn, _params) do
    user = conn.assigns.current_user
    show(conn, %{"user_id" => user.id})
  end

  @doc """
  Update current user's profile.
  """
  @spec update_me(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def update_me(conn, params) do
    user = conn.assigns.current_user
    update(conn, Map.put(params, "user_id", user.id))
  end

  @doc """
  Get user profile.
  """
  @spec show(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def show(conn, %{"user_id" => user_id}) do
    current_user = conn.assigns[:current_user]

    with {:ok, profile} <- Accounts.get_profile(user_id, current_user) do
      render(conn, :profile, profile: profile)
    end
  end

  @doc """
  Update signature.
  """
  @spec update_signature(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def update_signature(conn, %{"user_id" => user_id} = params) do
    user = conn.assigns.current_user

    with :ok <- authorize_profile(user, user_id),
         {:ok, profile} <- Accounts.update_signature(user_id, params["signature"]) do
      render(conn, :profile, profile: profile)
    end
  end

  @doc """
  Update bio.
  """
  @spec update_bio(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def update_bio(conn, %{"user_id" => user_id} = params) do
    user = conn.assigns.current_user

    with :ok <- authorize_profile(user, user_id),
         {:ok, profile} <- Accounts.update_bio(user_id, params["bio"]) do
      render(conn, :profile, profile: profile)
    end
  end

  @doc """
  Get user's posts.
  """
  @spec posts(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def posts(conn, %{"user_id" => user_id} = params) do
    opts = [
      page: parse_int(params["page"], 1),
      per_page: min(parse_int(params["per_page"], 20), @max_per_page),
      sort_order: parse_sort_order(params["sort_order"])
    ]

    {posts, pagination} = Forums.list_user_posts(user_id, opts)
    render(conn, :posts, posts: posts, pagination: pagination)
  end

  @doc """
  Get user's threads.
  """
  @spec threads(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def threads(conn, %{"user_id" => user_id} = params) do
    opts = [
      page: parse_int(params["page"], 1),
      per_page: min(parse_int(params["per_page"], 20), @max_per_page),
      sort_order: parse_sort_order(params["sort_order"])
    ]

    {threads, pagination} = Forums.list_user_threads(user_id, opts)
    render(conn, :threads, threads: threads, pagination: pagination)
  end

  @doc """
  Get user's reputation.
  """
  @spec reputation(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def reputation(conn, %{"user_id" => user_id} = params) do
    opts = [
      page: parse_int(params["page"], 1),
      per_page: min(parse_int(params["per_page"], 20), @max_per_page),
      type: params["type"] # "positive", "negative", "all"
    ]

    {reputation_entries, pagination, summary} = Reputation.get_user_reputation(user_id, opts)
    render(conn, :reputation,
      entries: reputation_entries,
      pagination: pagination,
      summary: summary
    )
  end

  @doc """
  Give reputation to a user.
  """
  @spec give_reputation(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def give_reputation(conn, %{"user_id" => user_id} = params) do
    user = conn.assigns.current_user

    with :ok <- validate_not_self(user, user_id) do
      attrs = %{
        from_user_id: user.id,
        to_user_id: user_id,
        post_id: params["post_id"],
        forum_id: params["forum_id"],
        comment: params["comment"],
        value: parse_int(params["value"] || params["points"], 1)
      }

      with {:ok, rep} <- Reputation.give_reputation(attrs) do
        render(conn, :reputation_entry, entry: rep)
      end
    end
  end

  @doc """
  Get user's activity.
  """
  @spec activity(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def activity(conn, %{"user_id" => user_id} = params) do
    current_user = conn.assigns[:current_user]

    opts = [
      page: parse_int(params["page"], 1),
      per_page: min(parse_int(params["per_page"], 20), @max_per_page),
      types: parse_activity_types(params["types"])
    ]

    with {:ok, activity, pagination} <- Accounts.get_user_activity(user_id, current_user, opts) do
      render(conn, :activity, activity: activity, pagination: pagination)
    end
  end

  @doc """
  Update profile fields.
  """
  @spec update(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def update(conn, %{"user_id" => user_id} = params) do
    user = conn.assigns.current_user

    with :ok <- authorize_profile(user, user_id) do
      attrs = Map.take(params, [
        "display_name", "bio", "signature", "title", "location", "website", "birthday",
        "gender", "timezone", "custom_fields", "social_links",
        "notification_settings", "privacy_settings"
      ])

      with {:ok, profile} <- Accounts.update_profile(user_id, attrs) do
        render(conn, :profile, profile: profile)
      end
    end
  end

  @doc """
  Get profile visitors.
  """
  @spec visitors(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def visitors(conn, %{"user_id" => user_id} = params) do
    current_user = conn.assigns.current_user

    with :ok <- authorize_profile(current_user, user_id) do
      opts = [
        page: parse_int(params["page"], 1),
        per_page: min(parse_int(params["per_page"], 20), @max_per_page)
      ]

      {visitors, pagination} = Accounts.get_profile_visitors(user_id, opts)
      render(conn, :visitors, visitors: visitors, pagination: pagination)
    end
  end

  # ========================================
  # HELPERS
  # ========================================

  defp authorize_profile(%{id: user_id}, user_id), do: :ok
  defp authorize_profile(%{is_admin: true}, _), do: :ok
  defp authorize_profile(_, _), do: {:error, :forbidden}

  defp validate_not_self(%{id: user_id}, user_id) when is_binary(user_id) do
    {:error, :cannot_reputation_self}
  end
  defp validate_not_self(%{id: user_id}, target_id) do
    if to_string(user_id) == to_string(target_id) do
      {:error, :cannot_reputation_self}
    else
      :ok
    end
  end

  defp parse_int(nil, default), do: default
  defp parse_int(val, default) when is_binary(val) do
    case Integer.parse(val) do
      {int, _} -> int
      :error -> default
    end
  end
  defp parse_int(val, _default) when is_integer(val), do: val
  defp parse_int(_, default), do: default

  defp parse_sort_order(nil), do: :desc
  defp parse_sort_order("asc"), do: :asc
  defp parse_sort_order("desc"), do: :desc
  defp parse_sort_order(_), do: :desc

  defp parse_activity_types(nil), do: :all
  defp parse_activity_types(types) when is_binary(types) do
    types
    |> String.split(",")
    |> Enum.map(&String.trim/1)
  end
  defp parse_activity_types(types) when is_list(types), do: types
end
