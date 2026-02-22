defmodule CGraphWeb.API.V1.MemberController do
  @moduledoc """
  Controller for Member directory and groups.
  Implements MyBB-style member listing with advanced filtering.

  ## Features
  - Member directory with pagination
  - Advanced search/filtering
  - User groups
  - Member profiles
  - Online status
  """
  use CGraphWeb, :controller

  alias CGraph.Accounts

  action_fallback CGraphWeb.FallbackController

  @max_per_page 100

  @doc """
  List all members with filtering and pagination.
  """
  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, params) do
    opts = [
      page: parse_int(params["page"], 1),
      per_page: min(parse_int(params["per_page"], 20), @max_per_page),
      sort_by: parse_sort_by(params["sort_by"]),
      sort_order: parse_sort_order(params["sort_order"]),
      search: params["search"],
      letter: params["letter"],
      group_id: params["group_id"],
      online_only: parse_bool(params["online_only"], false),
      with_stats: parse_bool(params["with_stats"], true)
    ]

    {members, pagination} = Accounts.list_members(opts)
    render(conn, :members, members: members, pagination: pagination)
  end

  @doc """
  Get a specific member's public profile.
  """
  @spec show(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def show(conn, %{"id" => id}) do
    current_user = conn.assigns[:current_user]

    with {:ok, member} <- Accounts.get_member_profile(id, current_user) do
      render(conn, :member, member: member)
    end
  end

  @doc """
  List all user groups.
  """
  @spec list_groups(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def list_groups(conn, params) do
    opts = [
      include_hidden: parse_bool(params["include_hidden"], false),
      with_count: parse_bool(params["with_count"], true)
    ]

    # Only admins can see hidden groups
    current_user = conn.assigns[:current_user]
    opts = if current_user && current_user.is_admin do
      opts
    else
      Keyword.put(opts, :include_hidden, false)
    end

    groups = Accounts.list_user_groups(opts)
    render(conn, :groups, groups: groups)
  end

  @doc """
  Search members.
  """
  @spec search(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def search(conn, params) do
    opts = [
      query: params["q"] || params["query"],
      page: parse_int(params["page"], 1),
      per_page: min(parse_int(params["per_page"], 20), @max_per_page),
      fields: parse_search_fields(params["fields"])
    ]

    {members, pagination} = Accounts.search_members(opts)
    render(conn, :members, members: members, pagination: pagination)
  end

  @doc """
  Get member statistics.
  """
  @spec stats(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def stats(conn, _params) do
    stats = Accounts.get_member_stats()
    render(conn, :member_stats, stats: stats)
  end

  # ========================================
  # HELPERS
  # ========================================

  defp parse_int(nil, default), do: default
  defp parse_int(val, default) when is_binary(val) do
    case Integer.parse(val) do
      {int, _} -> int
      :error -> default
    end
  end
  defp parse_int(val, _default) when is_integer(val), do: val
  defp parse_int(_, default), do: default

  defp parse_bool(nil, default), do: default
  defp parse_bool("true", _), do: true
  defp parse_bool("false", _), do: false
  defp parse_bool(val, _) when is_boolean(val), do: val
  defp parse_bool(_, default), do: default

  defp parse_sort_by(nil), do: :username
  defp parse_sort_by("username"), do: :username
  defp parse_sort_by("posts"), do: :post_count
  defp parse_sort_by("post_count"), do: :post_count
  defp parse_sort_by("reputation"), do: :reputation
  defp parse_sort_by("joined"), do: :inserted_at
  defp parse_sort_by("last_online"), do: :last_online_at
  defp parse_sort_by(_), do: :username

  defp parse_sort_order(nil), do: :asc
  defp parse_sort_order("asc"), do: :asc
  defp parse_sort_order("desc"), do: :desc
  defp parse_sort_order(_), do: :asc

  defp parse_search_fields(nil), do: [:username, :display_name, :email]
  defp parse_search_fields(fields) when is_binary(fields) do
    fields
    |> String.split(",")
    |> Enum.map(&String.trim/1)
    |> Enum.map(&String.to_existing_atom/1)
  rescue
    _ -> [:username, :display_name]
  end
  defp parse_search_fields(fields) when is_list(fields) do
    Enum.map(fields, fn
      field when is_atom(field) -> field
      field when is_binary(field) -> String.to_existing_atom(field)
    end)
  rescue
    _ -> [:username, :display_name]
  end
end
