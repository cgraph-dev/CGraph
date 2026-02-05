defmodule CGraph.Forums.UserGroups do
  @moduledoc """
  User group management for forums.
  
  Handles permission groups like Administrators, Moderators,
  Members, and custom groups.
  """

  import Ecto.Query, warn: false
  alias CGraph.Repo
  alias CGraph.Forums.ForumUserGroup

  @doc """
  List user groups for a forum.
  """
  def list_user_groups(forum_id) do
    from(g in ForumUserGroup,
      where: g.forum_id == ^forum_id,
      order_by: [asc: g.position, asc: g.name])
    |> Repo.all()
  end

  @doc """
  Get a user group by ID.
  """
  def get_user_group(id) do
    case Repo.get(ForumUserGroup, id) do
      nil -> {:error, :not_found}
      group -> {:ok, group}
    end
  end

  @doc """
  Create a user group.
  """
  def create_user_group(attrs) do
    %ForumUserGroup{}
    |> ForumUserGroup.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Update a user group.
  """
  def update_user_group(%ForumUserGroup{} = group, attrs) do
    group
    |> ForumUserGroup.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Delete a user group.
  """
  def delete_user_group(%ForumUserGroup{is_default: true}), do: {:error, :cannot_delete_default_group}
  def delete_user_group(%ForumUserGroup{} = group), do: Repo.delete(group)

  @doc """
  Get default user groups for a new forum.
  Creates the standard group hierarchy.
  """
  def create_default_user_groups(forum_id) do
    groups = [
      %{
        name: "Administrators",
        forum_id: forum_id,
        is_staff: true,
        is_admin: true,
        color: "#FF0000",
        position: 1,
        can_moderate: true,
        can_manage_users: true,
        can_manage_settings: true
      },
      %{
        name: "Moderators",
        forum_id: forum_id,
        is_staff: true,
        color: "#00AA00",
        position: 2,
        can_moderate: true,
        can_edit_posts: true,
        can_delete_posts: true,
        can_lock_threads: true,
        can_pin_threads: true
      },
      %{
        name: "Members",
        forum_id: forum_id,
        is_default: true,
        position: 3
      },
      %{
        name: "Guests",
        forum_id: forum_id,
        position: 4,
        can_create_threads: false,
        can_reply: false,
        can_give_reputation: false
      }
    ]

    Enum.map(groups, &create_user_group/1)
  end

  @doc """
  Reorder user groups.
  """
  def reorder_user_groups(forum_id, group_ids) do
    Enum.with_index(group_ids)
    |> Enum.each(fn {group_id, index} ->
      from(g in ForumUserGroup, where: g.id == ^group_id and g.forum_id == ^forum_id)
      |> Repo.update_all(set: [position: index])
    end)

    {:ok, list_user_groups(forum_id)}
  end
end
