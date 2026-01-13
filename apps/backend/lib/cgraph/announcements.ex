defmodule Cgraph.Announcements do
  @moduledoc """
  Context for Announcements system.
  Handles announcement retrieval, read tracking, and dismissal.
  """

  import Ecto.Query, warn: false
  alias Cgraph.Repo
  alias Cgraph.Forums.ForumAnnouncement
  alias Cgraph.Announcements.AnnouncementDismissal

  # ========================================
  # QUERIES
  # ========================================

  @doc """
  List announcements for a user.
  """
  def list_for_user(user, opts \\ []) do
    forum_id = Keyword.get(opts, :forum_id)
    include_global = Keyword.get(opts, :include_global, true)
    include_dismissed = Keyword.get(opts, :include_dismissed, false)

    now = DateTime.utc_now()

    base_query =
      from a in ForumAnnouncement,
        where: a.is_active == true,
        where: is_nil(a.start_date) or a.start_date <= ^now,
        where: is_nil(a.end_date) or a.end_date >= ^now,
        order_by: [desc: a.priority, desc: a.inserted_at],
        preload: [:author, :forum, :board]

    base_query = apply_forum_filter(base_query, forum_id, include_global)
    base_query = apply_group_filter(base_query, user)
    base_query = apply_dismissed_filter(base_query, user, include_dismissed)

    Repo.all(base_query)
  end

  defp apply_forum_filter(query, nil, true) do
    # Only global announcements when no forum specified
    from a in query, where: a.is_global == true
  end

  defp apply_forum_filter(query, nil, false) do
    # No announcements when no forum and no global
    from a in query, where: false
  end

  defp apply_forum_filter(query, forum_id, true) do
    # Forum-specific + global
    from a in query, where: a.forum_id == ^forum_id or a.is_global == true
  end

  defp apply_forum_filter(query, forum_id, false) do
    # Forum-specific only
    from a in query, where: a.forum_id == ^forum_id and a.is_global == false
  end

  defp apply_group_filter(query, nil), do: query
  defp apply_group_filter(query, user) do
    user_groups = get_user_groups(user)

    from a in query,
      where: fragment("? = '{}' OR ? && ?", a.target_groups, a.target_groups, ^user_groups)
  end

  defp get_user_groups(%{groups: groups}) when is_list(groups) do
    Enum.map(groups, fn
      %{id: id} -> id
      id when is_binary(id) -> id
      _ -> nil
    end)
    |> Enum.reject(&is_nil/1)
  end
  defp get_user_groups(_), do: []

  defp apply_dismissed_filter(query, _user, true), do: query
  defp apply_dismissed_filter(query, nil, false), do: query
  defp apply_dismissed_filter(query, user, false) do
    dismissed_ids = get_dismissed_ids(user.id)

    if Enum.empty?(dismissed_ids) do
      query
    else
      from a in query, where: a.id not in ^dismissed_ids
    end
  end

  defp get_dismissed_ids(user_id) do
    from(d in AnnouncementDismissal,
      where: d.user_id == ^user_id,
      select: d.announcement_id
    )
    |> Repo.all()
  end

  @doc """
  Get an announcement by ID.
  """
  def get(id) do
    query =
      from a in ForumAnnouncement,
        where: a.id == ^id,
        preload: [:author, :forum, :board]

    case Repo.one(query) do
      nil -> {:error, :not_found}
      announcement -> {:ok, announcement}
    end
  end

  @doc """
  Check if announcement is visible to user.
  """
  def visible_to_user?(%ForumAnnouncement{is_active: false}, _user), do: false
  def visible_to_user?(%ForumAnnouncement{target_groups: []}, _user), do: true
  def visible_to_user?(%ForumAnnouncement{target_groups: target_groups}, user) do
    user_groups = get_user_groups(user)
    Enum.any?(target_groups, &(&1 in user_groups))
  end

  # ========================================
  # READ TRACKING
  # ========================================

  @doc """
  Mark an announcement as read.
  """
  def mark_read(%ForumAnnouncement{} = announcement, _user) do
    # Increment view count
    from(a in ForumAnnouncement, where: a.id == ^announcement.id)
    |> Repo.update_all(inc: [view_count: 1])

    {:ok, :marked}
  end

  @doc """
  Dismiss an announcement (won't show again for this user).
  """
  def dismiss(%ForumAnnouncement{dismissible: false}, _user) do
    {:error, :not_dismissible}
  end

  def dismiss(%ForumAnnouncement{} = announcement, user) do
    attrs = %{
      user_id: user.id,
      announcement_id: announcement.id
    }

    case Repo.get_by(AnnouncementDismissal, attrs) do
      nil ->
        %AnnouncementDismissal{}
        |> AnnouncementDismissal.changeset(attrs)
        |> Repo.insert()

      existing ->
        {:ok, existing}
    end
  end
end
