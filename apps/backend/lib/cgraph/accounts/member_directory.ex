defmodule CGraph.Accounts.MemberDirectory do
  @moduledoc """
  Member directory functionality.

  Handles listing, searching, and profiling members.
  """

  import Ecto.Query, warn: false

  alias CGraph.Accounts.User
  alias CGraph.ReadRepo
  alias CGraph.Repo

  @doc """
  List members with filtering and pagination.
  """
  def list_members(opts \\ []) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 20)
    offset = (page - 1) * per_page
    sort_by = Keyword.get(opts, :sort_by, :username)
    sort_order = Keyword.get(opts, :sort_order, :asc)
    search = Keyword.get(opts, :search)
    letter = Keyword.get(opts, :letter)
    online_only = Keyword.get(opts, :online_only, false)

    base_query =
      from u in User,
        where: u.role != "bot",
        where: is_nil(u.banned_at)

    base_query = apply_member_search(base_query, search)
    base_query = apply_letter_filter(base_query, letter)
    base_query = apply_online_filter(base_query, online_only)
    base_query = apply_member_sort(base_query, sort_by, sort_order)

    total_count = ReadRepo.aggregate(base_query, :count, :id)

    members =
      base_query
      |> limit(^per_page)
      |> offset(^offset)
      |> ReadRepo.all()
      |> Enum.map(&enrich_member/1)

    pagination = %{
      page: page,
      per_page: per_page,
      total_count: total_count,
      total_pages: ceil(total_count / per_page)
    }

    {members, pagination}
  end

  @doc """
  Search members.
  """
  def search_members(opts \\ []) do
    query = Keyword.get(opts, :query)

    if query && String.length(query) >= 2 do
      list_members(Keyword.put(opts, :search, query))
    else
      {[], %{page: 1, per_page: 20, total_count: 0, total_pages: 0}}
    end
  end

  @doc """
  Get a member's public profile.
  """
  def get_member_profile(user_id, current_user) do
    case Repo.get(User, user_id) do
      nil -> {:error, :not_found}
      user -> {:ok, build_member_profile(user, current_user)}
    end
  end

  @doc """
  List user groups.
  """
  def list_user_groups(opts \\ []) do
    include_hidden = Keyword.get(opts, :include_hidden, false)
    with_count = Keyword.get(opts, :with_count, true)

    # For now, return a default set of groups
    # This should query a user_groups table when implemented
    base_groups = [
      %{id: "admin", name: "Administrators", description: "Site administrators", color: "#dc2626", is_staff: true, is_hidden: false, display_order: 0},
      %{id: "mod", name: "Moderators", description: "Forum moderators", color: "#f59e0b", is_staff: true, is_hidden: false, display_order: 1},
      %{id: "member", name: "Members", description: "Registered members", color: "#6366f1", is_staff: false, is_hidden: false, display_order: 2},
      %{id: "vip", name: "VIP Members", description: "VIP members with special privileges", color: "#8b5cf6", is_staff: false, is_hidden: false, display_order: 3}
    ]

    groups = if include_hidden do
      base_groups
    else
      Enum.reject(base_groups, & &1.is_hidden)
    end

    if with_count do
      Enum.map(groups, fn group ->
        count = from(u in User, where: u.role == ^group.id) |> ReadRepo.aggregate(:count, :id)
        Map.put(group, :member_count, count)
      end)
    else
      groups
    end
  end

  @doc """
  Get member statistics.
  """
  def get_member_stats do
    total_members = from(u in User, where: u.role != "bot") |> ReadRepo.aggregate(:count, :id)

    today = Date.utc_today()
    start_of_day = DateTime.new!(today, ~T[00:00:00], "Etc/UTC")
    start_of_week = Date.add(today, -7) |> then(&DateTime.new!(&1, ~T[00:00:00], "Etc/UTC"))
    start_of_month = Date.add(today, -30) |> then(&DateTime.new!(&1, ~T[00:00:00], "Etc/UTC"))

    members_today = from(u in User, where: u.inserted_at >= ^start_of_day) |> ReadRepo.aggregate(:count, :id)
    members_this_week = from(u in User, where: u.inserted_at >= ^start_of_week) |> ReadRepo.aggregate(:count, :id)
    members_this_month = from(u in User, where: u.inserted_at >= ^start_of_month) |> ReadRepo.aggregate(:count, :id)

    newest_member = from(u in User, order_by: [desc: u.inserted_at], limit: 1) |> ReadRepo.one()

    online_threshold = DateTime.add(DateTime.utc_now(), -15, :minute)
    online_now = from(u in User, where: u.last_online_at >= ^online_threshold) |> ReadRepo.aggregate(:count, :id)

    %{
      total_members: total_members,
      members_today: members_today,
      members_this_week: members_this_week,
      members_this_month: members_this_month,
      newest_member: newest_member,
      online_now: online_now,
      most_online: 0,
      most_online_date: nil
    }
  end

  # Private functions

  defp apply_member_search(query, nil), do: query
  defp apply_member_search(query, ""), do: query
  defp apply_member_search(query, search) do
    search_pattern = "%#{search}%"
    from u in query,
      where: ilike(u.username, ^search_pattern) or ilike(u.display_name, ^search_pattern)
  end

  defp apply_letter_filter(query, nil), do: query
  defp apply_letter_filter(query, ""), do: query
  defp apply_letter_filter(query, letter) do
    letter_pattern = "#{String.upcase(letter)}%"
    from u in query,
      where: ilike(u.username, ^letter_pattern)
  end

  defp apply_online_filter(query, false), do: query
  defp apply_online_filter(query, true) do
    # Consider users online if they were active in the last 15 minutes
    threshold = DateTime.add(DateTime.utc_now(), -15, :minute)
    from u in query,
      where: u.last_online_at >= ^threshold
  end

  defp apply_member_sort(query, :username, :asc), do: from(u in query, order_by: [asc: u.username])
  defp apply_member_sort(query, :username, :desc), do: from(u in query, order_by: [desc: u.username])
  defp apply_member_sort(query, :inserted_at, :asc), do: from(u in query, order_by: [asc: u.inserted_at])
  defp apply_member_sort(query, :inserted_at, :desc), do: from(u in query, order_by: [desc: u.inserted_at])
  defp apply_member_sort(query, :last_online_at, :asc), do: from(u in query, order_by: [asc: u.last_online_at])
  defp apply_member_sort(query, :last_online_at, :desc), do: from(u in query, order_by: [desc: u.last_online_at])
  defp apply_member_sort(query, :post_count, order) do
    from u in query, order_by: [{^order, u.post_count}]
  end
  defp apply_member_sort(query, :reputation, order) do
    from u in query, order_by: [{^order, u.reputation}]
  end
  defp apply_member_sort(query, _, _), do: from(u in query, order_by: [asc: u.username])

  defp enrich_member(user) do
    # Add is_online based on last_online_at
    threshold = DateTime.add(DateTime.utc_now(), -15, :minute)
    last_seen = Map.get(user, :last_seen_at) || Map.get(user, :last_online_at)
    is_online = last_seen && DateTime.compare(last_seen, threshold) != :lt

    Map.put(user, :is_online, is_online)
  end

  defp build_member_profile(user, current_user) do
    user = enrich_member(user)

    # Calculate additional fields
    days_registered = Date.diff(Date.utc_today(), DateTime.to_date(user.inserted_at))
    post_count = Map.get(user, :post_count) || Map.get(user, :total_posts_created) || 0
    posts_per_day = if days_registered > 0, do: post_count / days_registered, else: 0.0

    is_friend = if current_user do
      case CGraph.Accounts.get_friendship_status(current_user, user) do
        :friends -> true
        _ -> false
      end
    else
      false
    end

    user
    |> Map.put(:days_registered, days_registered)
    |> Map.put(:posts_per_day, Float.round(posts_per_day, 2))
    |> Map.put(:is_friend, is_friend)
    |> Map.put(:can_pm, true)
  end
end
