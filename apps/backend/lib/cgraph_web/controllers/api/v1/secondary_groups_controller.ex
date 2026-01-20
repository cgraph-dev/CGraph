defmodule CGraphWeb.Api.V1.SecondaryGroupsController do
  @moduledoc """
  Controller for managing secondary groups and auto-assignment rules.

  Provides endpoints for:
  - Viewing member's groups (primary + secondary)
  - Adding/removing secondary groups
  - Managing auto-assignment rules
  - Setting display group preference
  """
  use CGraphWeb, :controller

  alias CGraph.Repo
  alias CGraph.Forums.{
    Forum, ForumMember, ForumUserGroup,
    MemberSecondaryGroup, GroupAutoRule
  }

  import Ecto.Query

  action_fallback CGraphWeb.FallbackController

  # =============================================================================
  # MEMBER GROUPS
  # =============================================================================

  @doc """
  GET /api/v1/forums/:forum_id/members/:member_id/groups
  Get all groups for a member (primary + secondary).
  """
  def member_groups(conn, %{"forum_id" => forum_id, "member_id" => member_id}) do
    with {:ok, forum_uuid} <- Ecto.UUID.cast(forum_id),
         {:ok, member_uuid} <- Ecto.UUID.cast(member_id),
         %ForumMember{} = member <- get_member(forum_uuid, member_uuid) do

      member = Repo.preload(member, [:user_group])

      secondary_groups =
        MemberSecondaryGroup.for_member_query(member.id)
        |> Repo.all()

      json(conn, %{
        data: %{
          primary_group: member.user_group,
          display_group_id: member.display_group_id,
          secondary_groups: Enum.map(secondary_groups, fn msg ->
            %{
              id: msg.id,
              group: msg.user_group,
              expires_at: msg.expires_at,
              reason: msg.reason,
              added_at: msg.inserted_at
            }
          end)
        }
      })
    else
      :error -> {:error, :bad_request}
      nil -> {:error, :not_found}
    end
  end

  @doc """
  GET /api/v1/forums/:forum_id/my-groups
  Get current user's groups in a forum.
  """
  def my_groups(conn, %{"forum_id" => forum_id}) do
    user = conn.assigns.current_user

    with {:ok, forum_uuid} <- Ecto.UUID.cast(forum_id),
         %ForumMember{} = member <- get_member_by_user(forum_uuid, user.id) do

      member = Repo.preload(member, [:user_group])

      secondary_groups =
        MemberSecondaryGroup.for_member_query(member.id)
        |> Repo.all()

      # Get stacked permissions
      permissions = MemberSecondaryGroup.stacked_permissions(member, Repo)

      json(conn, %{
        data: %{
          primary_group: member.user_group,
          display_group_id: member.display_group_id,
          secondary_groups: Enum.map(secondary_groups, & &1.user_group),
          effective_permissions: permissions
        }
      })
    else
      :error -> {:error, :bad_request}
      nil -> {:error, :not_found}
    end
  end

  @doc """
  POST /api/v1/forums/:forum_id/members/:member_id/secondary-groups
  Add a secondary group to a member.
  """
  def add_secondary_group(conn, %{"forum_id" => forum_id, "member_id" => member_id} = params) do
    user = conn.assigns.current_user
    group_id = params["user_group_id"]

    with {:ok, forum_uuid} <- Ecto.UUID.cast(forum_id),
         {:ok, member_uuid} <- Ecto.UUID.cast(member_id),
         {:ok, group_uuid} <- Ecto.UUID.cast(group_id),
         %Forum{} = forum <- Repo.get(Forum, forum_uuid),
         :ok <- authorize_group_management(user, forum),
         %ForumMember{} = member <- get_member(forum_uuid, member_uuid),
         %ForumUserGroup{} = group <- Repo.get(ForumUserGroup, group_uuid),
         true <- group.forum_id == forum_uuid do

      expires_at = parse_datetime(params["expires_at"])

      case MemberSecondaryGroup.add_group(member.id, group.id,
        expires_at: expires_at,
        reason: params["reason"],
        granted_by_id: user.id
      ) |> Repo.insert() do
        {:ok, msg} ->
          conn
          |> put_status(:created)
          |> json(%{
            data: %{
              id: msg.id,
              group: group,
              expires_at: msg.expires_at,
              reason: msg.reason
            }
          })

        {:error, changeset} ->
          {:error, changeset}
      end
    else
      :error -> {:error, :bad_request}
      nil -> {:error, :not_found}
      false -> {:error, :bad_request}
      {:error, reason} -> {:error, reason}
    end
  end

  @doc """
  DELETE /api/v1/forums/:forum_id/members/:member_id/secondary-groups/:group_id
  Remove a secondary group from a member.
  """
  def remove_secondary_group(conn, %{
    "forum_id" => forum_id,
    "member_id" => member_id,
    "group_id" => group_id
  }) do
    user = conn.assigns.current_user

    with {:ok, forum_uuid} <- Ecto.UUID.cast(forum_id),
         {:ok, member_uuid} <- Ecto.UUID.cast(member_id),
         {:ok, group_uuid} <- Ecto.UUID.cast(group_id),
         %Forum{} = forum <- Repo.get(Forum, forum_uuid),
         :ok <- authorize_group_management(user, forum),
         %ForumMember{} = member <- get_member(forum_uuid, member_uuid) do

      {deleted_count, _} =
        MemberSecondaryGroup.remove_group_query(member.id, group_uuid)
        |> Repo.delete_all()

      if deleted_count > 0 do
        json(conn, %{message: "Secondary group removed"})
      else
        {:error, :not_found}
      end
    else
      :error -> {:error, :bad_request}
      nil -> {:error, :not_found}
      {:error, reason} -> {:error, reason}
    end
  end

  @doc """
  PUT /api/v1/forums/:forum_id/members/:member_id/display-group
  Set the display group for a member.
  """
  def set_display_group(conn, %{"forum_id" => forum_id, "member_id" => member_id} = params) do
    user = conn.assigns.current_user
    display_group_id = params["display_group_id"]

    with {:ok, forum_uuid} <- Ecto.UUID.cast(forum_id),
         {:ok, member_uuid} <- Ecto.UUID.cast(member_id),
         {:ok, display_uuid} <- parse_optional_uuid(display_group_id),
         %ForumMember{} = member <- get_member(forum_uuid, member_uuid),
         :ok <- authorize_display_group_change(user, member),
         :ok <- validate_display_group(member, display_uuid) do

      member
      |> Ecto.Changeset.change(%{display_group_id: display_uuid})
      |> Repo.update()
      |> case do
        {:ok, updated} ->
          updated = Repo.preload(updated, [:user_group])
          json(conn, %{data: updated})

        {:error, changeset} ->
          {:error, changeset}
      end
    else
      :error -> {:error, :bad_request}
      nil -> {:error, :not_found}
      {:error, reason} -> {:error, reason}
    end
  end

  # =============================================================================
  # AUTO-ASSIGNMENT RULES
  # =============================================================================

  @doc """
  GET /api/v1/forums/:forum_id/group-rules
  List all auto-assignment rules for a forum.
  """
  def list_rules(conn, %{"forum_id" => forum_id}) do
    user = conn.assigns.current_user

    with {:ok, uuid} <- Ecto.UUID.cast(forum_id),
         %Forum{} = forum <- Repo.get(Forum, uuid),
         :ok <- authorize_group_management(user, forum) do

      rules =
        GroupAutoRule.for_forum_query(forum.id)
        |> Repo.all()

      json(conn, %{data: rules})
    else
      :error -> {:error, :bad_request}
      nil -> {:error, :not_found}
      {:error, reason} -> {:error, reason}
    end
  end

  @doc """
  POST /api/v1/forums/:forum_id/groups/:group_id/rules
  Create an auto-assignment rule for a group.
  """
  def create_rule(conn, %{"forum_id" => forum_id, "group_id" => group_id} = params) do
    user = conn.assigns.current_user

    with {:ok, forum_uuid} <- Ecto.UUID.cast(forum_id),
         {:ok, group_uuid} <- Ecto.UUID.cast(group_id),
         %Forum{} = forum <- Repo.get(Forum, forum_uuid),
         :ok <- authorize_group_management(user, forum),
         %ForumUserGroup{} = group <- Repo.get(ForumUserGroup, group_uuid),
         true <- group.forum_id == forum_uuid do

      attrs = Map.put(params, "user_group_id", group.id)

      %GroupAutoRule{}
      |> GroupAutoRule.changeset(attrs)
      |> Repo.insert()
      |> case do
        {:ok, rule} ->
          conn
          |> put_status(:created)
          |> json(%{data: rule})

        {:error, changeset} ->
          {:error, changeset}
      end
    else
      :error -> {:error, :bad_request}
      nil -> {:error, :not_found}
      false -> {:error, :bad_request}
      {:error, reason} -> {:error, reason}
    end
  end

  @doc """
  PUT /api/v1/group-rules/:id
  Update an auto-assignment rule.
  """
  def update_rule(conn, %{"id" => id} = params) do
    user = conn.assigns.current_user

    with {:ok, uuid} <- Ecto.UUID.cast(id),
         %GroupAutoRule{} = rule <- Repo.get(GroupAutoRule, uuid) |> Repo.preload(user_group: :forum),
         :ok <- authorize_group_management(user, rule.user_group.forum) do

      rule
      |> GroupAutoRule.changeset(params)
      |> Repo.update()
      |> case do
        {:ok, updated} ->
          json(conn, %{data: updated})

        {:error, changeset} ->
          {:error, changeset}
      end
    else
      :error -> {:error, :bad_request}
      nil -> {:error, :not_found}
      {:error, reason} -> {:error, reason}
    end
  end

  @doc """
  DELETE /api/v1/group-rules/:id
  Delete an auto-assignment rule.
  """
  def delete_rule(conn, %{"id" => id}) do
    user = conn.assigns.current_user

    with {:ok, uuid} <- Ecto.UUID.cast(id),
         %GroupAutoRule{} = rule <- Repo.get(GroupAutoRule, uuid) |> Repo.preload(user_group: :forum),
         :ok <- authorize_group_management(user, rule.user_group.forum) do

      Repo.delete!(rule)
      json(conn, %{message: "Rule deleted"})
    else
      :error -> {:error, :bad_request}
      nil -> {:error, :not_found}
      {:error, reason} -> {:error, reason}
    end
  end

  @doc """
  POST /api/v1/forums/:forum_id/evaluate-rules
  Manually trigger rule evaluation for all members in a forum.
  """
  def evaluate_rules(conn, %{"forum_id" => forum_id}) do
    user = conn.assigns.current_user

    with {:ok, uuid} <- Ecto.UUID.cast(forum_id),
         %Forum{} = forum <- Repo.get(Forum, uuid),
         :ok <- authorize_group_management(user, forum) do

      # Get all members
      members =
        from(m in ForumMember, where: m.forum_id == ^forum.id)
        |> Repo.all()

      # Evaluate rules for each member
      results =
        Enum.map(members, fn member ->
          case GroupAutoRule.apply_auto_assignments(member, Repo) do
            {:ok, assignments} ->
              %{member_id: member.id, assignments: length(assignments)}
            {:error, _} ->
              %{member_id: member.id, assignments: 0, error: true}
          end
        end)

      total_assignments = Enum.sum(Enum.map(results, & &1.assignments))

      json(conn, %{
        data: %{
          members_processed: length(members),
          total_assignments: total_assignments
        }
      })
    else
      :error -> {:error, :bad_request}
      nil -> {:error, :not_found}
      {:error, reason} -> {:error, reason}
    end
  end

  @doc """
  GET /api/v1/group-rules/templates
  Get built-in rule templates.
  """
  def rule_templates(conn, _params) do
    templates = GroupAutoRule.rule_templates()
    json(conn, %{data: templates})
  end

  # =============================================================================
  # PRIVATE HELPERS
  # =============================================================================

  defp get_member(forum_id, member_id) do
    from(m in ForumMember,
      where: m.forum_id == ^forum_id and m.id == ^member_id
    )
    |> Repo.one()
  end

  defp get_member_by_user(forum_id, user_id) do
    from(m in ForumMember,
      where: m.forum_id == ^forum_id and m.user_id == ^user_id
    )
    |> Repo.one()
  end

  defp parse_optional_uuid(nil), do: {:ok, nil}
  defp parse_optional_uuid(""), do: {:ok, nil}
  defp parse_optional_uuid(id), do: Ecto.UUID.cast(id)

  defp parse_datetime(nil), do: nil
  defp parse_datetime(str) when is_binary(str) do
    case DateTime.from_iso8601(str) do
      {:ok, dt, _} -> dt
      _ -> nil
    end
  end
  defp parse_datetime(_), do: nil

  defp authorize_group_management(user, forum) do
    cond do
      user.role == "admin" -> :ok
      forum.owner_id == user.id -> :ok
      has_group_management_permission?(user, forum) -> :ok
      true -> {:error, :forbidden}
    end
  end

  defp has_group_management_permission?(user, forum) do
    from(m in ForumMember,
      join: g in ForumUserGroup, on: g.id == m.user_group_id,
      where: m.user_id == ^user.id and m.forum_id == ^forum.id,
      where: g.can_manage_groups == true or g.is_admin == true,
      select: count(m.id)
    )
    |> Repo.one()
    |> Kernel.>(0)
  end

  defp authorize_display_group_change(user, member) do
    # Users can change their own display group
    # Admins can change anyone's
    cond do
      user.role == "admin" -> :ok
      member.user_id == user.id -> :ok
      true -> {:error, :forbidden}
    end
  end

  defp validate_display_group(member, nil), do: :ok
  defp validate_display_group(member, display_group_id) do
    # Display group must be the primary group or one of the secondary groups
    all_group_ids = MemberSecondaryGroup.all_group_ids(member, Repo)

    if display_group_id in all_group_ids do
      # Also check if group allows being display group
      group = Repo.get(ForumUserGroup, display_group_id)
      if group && group.can_be_display_group do
        :ok
      else
        {:error, :invalid_display_group}
      end
    else
      {:error, :not_a_member_of_group}
    end
  end
end
