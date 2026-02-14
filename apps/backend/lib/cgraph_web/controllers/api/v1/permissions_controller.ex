defmodule CGraphWeb.API.V1.PermissionsController do
  @moduledoc """
  Controller for managing forum and board permissions.

  Provides endpoints for:
  - Viewing and updating forum permissions
  - Viewing and updating board permissions
  - Managing permission templates
  - Checking user permissions
  """
  use CGraphWeb, :controller

  alias CGraph.Forums.{Board, BoardPermission, Forum, ForumPermission, ForumUserGroup, PermissionTemplate}
  alias CGraph.Repo

  import Ecto.Query

  action_fallback CGraphWeb.FallbackController

  # =============================================================================
  # FORUM PERMISSIONS
  # =============================================================================

  @doc """
  GET /api/v1/forums/:forum_id/permissions
  List all permission overrides for a forum.
  """
  def forum_permissions(conn, %{"forum_id" => forum_id}) do
    user = conn.assigns.current_user

    with {:ok, uuid} <- Ecto.UUID.cast(forum_id),
         %Forum{} = forum <- Repo.get(Forum, uuid),
         :ok <- authorize_admin(user, forum) do

      permissions =
        ForumPermission.for_forum_query(forum.id)
        |> Repo.all()

      json(conn, %{data: permissions})
    else
      :error -> {:error, :bad_request}
      nil -> {:error, :not_found}
      {:error, reason} -> {:error, reason}
    end
  end

  @doc """
  PUT /api/v1/forums/:forum_id/permissions
  Update forum permissions for a user group.
  """
  def update_forum_permissions(conn, %{"forum_id" => forum_id} = params) do
    user = conn.assigns.current_user
    group_id = params["user_group_id"]

    with {:ok, forum_uuid} <- Ecto.UUID.cast(forum_id),
         {:ok, group_uuid} <- parse_optional_uuid(group_id),
         %Forum{} = forum <- Repo.get(Forum, forum_uuid),
         :ok <- authorize_admin(user, forum),
         {:ok, permission} <- upsert_forum_permission(forum.id, group_uuid, params) do

      json(conn, %{data: permission})
    else
      :error -> {:error, :bad_request}
      nil -> {:error, :not_found}
      {:error, reason} -> {:error, reason}
    end
  end

  @doc """
  DELETE /api/v1/forums/:forum_id/permissions/:group_id
  Remove forum permission override for a group.
  """
  def delete_forum_permission(conn, %{"forum_id" => forum_id, "group_id" => group_id}) do
    user = conn.assigns.current_user

    with {:ok, forum_uuid} <- Ecto.UUID.cast(forum_id),
         {:ok, group_uuid} <- Ecto.UUID.cast(group_id),
         %Forum{} = forum <- Repo.get(Forum, forum_uuid),
         :ok <- authorize_admin(user, forum) do

      from(fp in ForumPermission,
        where: fp.forum_id == ^forum_uuid and fp.user_group_id == ^group_uuid
      )
      |> Repo.delete_all()

      json(conn, %{message: "Permission override removed"})
    else
      :error -> {:error, :bad_request}
      nil -> {:error, :not_found}
      {:error, reason} -> {:error, reason}
    end
  end

  # =============================================================================
  # BOARD PERMISSIONS
  # =============================================================================

  @doc """
  GET /api/v1/boards/:board_id/permissions
  List all permission overrides for a board.
  """
  def board_permissions(conn, %{"board_id" => board_id}) do
    user = conn.assigns.current_user

    with {:ok, uuid} <- Ecto.UUID.cast(board_id),
         %Board{} = board <- Repo.get(Board, uuid) |> Repo.preload(:forum),
         :ok <- authorize_admin(user, board.forum) do

      permissions =
        BoardPermission.for_board_query(board.id)
        |> Repo.all()

      json(conn, %{data: permissions})
    else
      :error -> {:error, :bad_request}
      nil -> {:error, :not_found}
      {:error, reason} -> {:error, reason}
    end
  end

  @doc """
  PUT /api/v1/boards/:board_id/permissions
  Update board permissions for a user group.
  """
  def update_board_permissions(conn, %{"board_id" => board_id} = params) do
    user = conn.assigns.current_user
    group_id = params["user_group_id"]

    with {:ok, board_uuid} <- Ecto.UUID.cast(board_id),
         {:ok, group_uuid} <- parse_optional_uuid(group_id),
         %Board{} = board <- Repo.get(Board, board_uuid) |> Repo.preload(:forum),
         :ok <- authorize_admin(user, board.forum),
         {:ok, permission} <- upsert_board_permission(board.id, group_uuid, params) do

      json(conn, %{data: permission})
    else
      :error -> {:error, :bad_request}
      nil -> {:error, :not_found}
      {:error, reason} -> {:error, reason}
    end
  end

  @doc """
  DELETE /api/v1/boards/:board_id/permissions/:group_id
  Remove board permission override for a group.
  """
  def delete_board_permission(conn, %{"board_id" => board_id, "group_id" => group_id}) do
    user = conn.assigns.current_user

    with {:ok, board_uuid} <- Ecto.UUID.cast(board_id),
         {:ok, group_uuid} <- Ecto.UUID.cast(group_id),
         %Board{} = board <- Repo.get(Board, board_uuid) |> Repo.preload(:forum),
         :ok <- authorize_admin(user, board.forum) do

      from(bp in BoardPermission,
        where: bp.board_id == ^board_uuid and bp.user_group_id == ^group_uuid
      )
      |> Repo.delete_all()

      json(conn, %{message: "Permission override removed"})
    else
      :error -> {:error, :bad_request}
      nil -> {:error, :not_found}
      {:error, reason} -> {:error, reason}
    end
  end

  # =============================================================================
  # PERMISSION TEMPLATES
  # =============================================================================

  @doc """
  GET /api/v1/forums/:forum_id/permission-templates
  List permission templates available for a forum.
  """
  def list_templates(conn, %{"forum_id" => forum_id}) do
    with {:ok, uuid} <- Ecto.UUID.cast(forum_id) do
      templates =
        PermissionTemplate.available_for_forum_query(uuid)
        |> Repo.all()

      json(conn, %{data: templates})
    else
      :error -> {:error, :bad_request}
    end
  end

  @doc """
  GET /api/v1/permission-templates
  List all system permission templates.
  """
  def list_system_templates(conn, _params) do
    templates =
      PermissionTemplate.system_templates_query()
      |> Repo.all()

    json(conn, %{data: templates})
  end

  @doc """
  POST /api/v1/forums/:forum_id/permission-templates
  Create a custom permission template for a forum.
  """
  def create_template(conn, %{"forum_id" => forum_id} = params) do
    user = conn.assigns.current_user

    with {:ok, uuid} <- Ecto.UUID.cast(forum_id),
         %Forum{} = forum <- Repo.get(Forum, uuid),
         :ok <- authorize_admin(user, forum) do

      attrs = Map.put(params, "forum_id", forum.id)

      %PermissionTemplate{}
      |> PermissionTemplate.changeset(attrs)
      |> Repo.insert()
      |> case do
        {:ok, template} ->
          conn
          |> put_status(:created)
          |> json(%{data: template})

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
  DELETE /api/v1/permission-templates/:id
  Delete a custom permission template.
  """
  def delete_template(conn, %{"id" => id}) do
    user = conn.assigns.current_user

    with {:ok, uuid} <- Ecto.UUID.cast(id),
         %PermissionTemplate{} = template <- Repo.get(PermissionTemplate, uuid),
         false <- template.is_system,
         :ok <- authorize_template_deletion(user, template) do

      Repo.delete!(template)
      json(conn, %{message: "Template deleted"})
    else
      true -> {:error, :forbidden}  # Can't delete system template
      :error -> {:error, :bad_request}
      nil -> {:error, :not_found}
      {:error, reason} -> {:error, reason}
    end
  end

  @doc """
  POST /api/v1/boards/:board_id/apply-template
  Apply a permission template to a board for a specific group.
  """
  def apply_template_to_board(conn, %{"board_id" => board_id} = params) do
    user = conn.assigns.current_user
    template_id = params["template_id"]
    group_id = params["user_group_id"]

    with {:ok, board_uuid} <- Ecto.UUID.cast(board_id),
         {:ok, template_uuid} <- Ecto.UUID.cast(template_id),
         {:ok, group_uuid} <- parse_optional_uuid(group_id),
         %Board{} = board <- Repo.get(Board, board_uuid) |> Repo.preload(:forum),
         %PermissionTemplate{} = template <- Repo.get(PermissionTemplate, template_uuid),
         :ok <- authorize_admin(user, board.forum) do

      # Apply template permissions to board
      applies_to = if group_uuid, do: "group", else: params["applies_to"] || "guest"

      attrs =
        template.permissions
        |> Map.put("board_id", board.id)
        |> Map.put("user_group_id", group_uuid)
        |> Map.put("applies_to", applies_to)

      {:ok, permission} = upsert_board_permission(board.id, group_uuid, attrs)

      json(conn, %{data: permission, template_applied: template.name})
    else
      :error -> {:error, :bad_request}
      nil -> {:error, :not_found}
      {:error, reason} -> {:error, reason}
    end
  end

  # =============================================================================
  # PERMISSION CHECKING
  # =============================================================================

  @doc """
  GET /api/v1/boards/:board_id/check-permission
  Check if current user has a specific permission on a board.
  """
  def check_board_permission(conn, %{"board_id" => board_id, "permission" => permission}) do
    user = conn.assigns[:current_user]

    with {:ok, uuid} <- Ecto.UUID.cast(board_id),
         %Board{} = board <- Repo.get(Board, uuid) |> Repo.preload(:forum),
         perm_atom <- String.to_existing_atom(permission),
         true <- perm_atom in BoardPermission.permission_fields() do

      has_permission = BoardPermission.can?(perm_atom, user, board, Repo)

      json(conn, %{
        permission: permission,
        allowed: has_permission,
        board_id: board_id
      })
    else
      false -> {:error, :bad_request}
      :error -> {:error, :bad_request}
      nil -> {:error, :not_found}
    end
  rescue
    ArgumentError -> {:error, :bad_request}
  end

  # Fallback: accept action param instead of permission
  def check_board_permission(conn, %{"board_id" => board_id} = params) do
    permission = Map.get(params, "action") || "can_post"
    check_board_permission(conn, %{"board_id" => board_id, "permission" => permission})
  end

  @doc """
  GET /api/v1/boards/:board_id/my-permissions
  Get all effective permissions for current user on a board.
  """
  def my_board_permissions(conn, %{"board_id" => board_id}) do
    user = conn.assigns[:current_user]

    with {:ok, uuid} <- Ecto.UUID.cast(board_id),
         %Board{} = board <- Repo.get(Board, uuid) |> Repo.preload(:forum) do

      permissions = BoardPermission.effective_permissions(user, board, Repo)

      json(conn, %{
        board_id: board_id,
        permissions: permissions,
        is_authenticated: not is_nil(user)
      })
    else
      :error -> {:error, :bad_request}
      nil -> {:error, :not_found}
    end
  end

  # =============================================================================
  # PRIVATE HELPERS
  # =============================================================================

  defp parse_optional_uuid(nil), do: {:ok, nil}
  defp parse_optional_uuid(""), do: {:ok, nil}
  defp parse_optional_uuid(id), do: Ecto.UUID.cast(id)

  defp authorize_admin(user, forum) do
    cond do
      user.role == "admin" -> :ok
      forum.owner_id == user.id -> :ok
      has_forum_admin_permission?(user, forum) -> :ok
      true -> {:error, :forbidden}
    end
  end

  defp has_forum_admin_permission?(user, forum) do
    from(m in CGraph.Forums.ForumMember,
      join: g in ForumUserGroup, on: g.id == m.user_group_id,
      where: m.user_id == ^user.id and m.forum_id == ^forum.id,
      where: g.is_admin == true or g.can_manage_settings == true,
      select: count(m.id)
    )
    |> Repo.one()
    |> Kernel.>(0)
  end

  defp authorize_template_deletion(user, template) do
    cond do
      user.role == "admin" -> :ok
      is_nil(template.forum_id) -> {:error, :forbidden}  # Global template
      true ->
        forum = Repo.get(Forum, template.forum_id)
        if forum && forum.owner_id == user.id, do: :ok, else: {:error, :forbidden}
    end
  end

  defp upsert_forum_permission(forum_id, group_id, params) do
    existing =
      from(fp in ForumPermission,
        where: fp.forum_id == ^forum_id and fp.user_group_id == ^group_id
      )
      |> Repo.one()

    attrs = build_permission_attrs(params, forum_id, group_id)

    case existing do
      nil ->
        %ForumPermission{}
        |> ForumPermission.changeset(attrs)
        |> Repo.insert()

      perm ->
        perm
        |> ForumPermission.changeset(attrs)
        |> Repo.update()
    end
  end

  defp upsert_board_permission(board_id, group_id, params) do
    existing =
      from(bp in BoardPermission,
        where: bp.board_id == ^board_id and bp.user_group_id == ^group_id
      )
      |> Repo.one()

    attrs = build_permission_attrs(params, board_id, group_id, :board)

    case existing do
      nil ->
        %BoardPermission{}
        |> BoardPermission.changeset(attrs)
        |> Repo.insert()

      perm ->
        perm
        |> BoardPermission.changeset(attrs)
        |> Repo.update()
    end
  end

  defp build_permission_attrs(params, id, group_id, type \\ :forum) do
    id_field = if type == :board, do: "board_id", else: "forum_id"

    base = %{
      id_field => id,
      "user_group_id" => group_id,
      "applies_to" => params["applies_to"] || "group"
    }

    permission_keys = if type == :board do
      BoardPermission.permission_fields() |> Enum.map(&to_string/1)
    else
      ForumPermission.permission_fields() |> Enum.map(&to_string/1)
    end

    Enum.reduce(permission_keys, base, fn key, acc ->
      case Map.get(params, key) do
        nil -> acc
        value when value in ["inherit", "allow", "deny"] -> Map.put(acc, key, value)
        _ -> acc
      end
    end)
  end
end
