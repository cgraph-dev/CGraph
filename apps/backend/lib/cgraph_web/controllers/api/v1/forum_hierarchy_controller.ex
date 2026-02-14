defmodule CGraphWeb.API.V1.ForumHierarchyController do
  @moduledoc """
  Controller for forum hierarchy operations.

  Provides endpoints for:
  - Getting forum tree structure
  - Moving forums (reparenting)
  - Reordering forums within a parent
  - Getting breadcrumbs
  - Getting ancestors/descendants
  """
  use CGraphWeb, :controller

  alias CGraph.Forums.Forum
  alias CGraph.Repo

  import Ecto.Query

  action_fallback CGraphWeb.FallbackController

  @doc """
  GET /api/v1/forums/tree
  Get the complete forum tree structure.
  """
  def tree(conn, params) do
    max_depth = Map.get(params, "max_depth", "10") |> String.to_integer()
    include_hidden = Map.get(params, "include_hidden", "false") == "true"

    query =
      from f in Forum,
        where: is_nil(f.deleted_at),
        where: f.depth <= ^max_depth,
        order_by: [asc: f.depth, asc: f.display_order, asc: f.name]

    query =
      if include_hidden do
        query
      else
        from f in query, where: f.show_in_navigation == true
      end

    forums = Repo.all(query)
    tree = Forum.build_tree(forums)

    json(conn, %{
      data: tree,
      meta: %{
        total_count: length(forums),
        max_depth: max_depth
      }
    })
  end

  @doc """
  GET /api/v1/forums/:id/subtree
  Get the subtree for a specific forum.
  """
  def subtree(conn, %{"id" => id} = params) do
    max_depth = Map.get(params, "max_depth", "10") |> String.to_integer()

    with {:ok, uuid} <- Ecto.UUID.cast(id),
         %Forum{} = forum <- Repo.get(Forum, uuid) do

      # Calculate absolute max depth based on forum's depth
      abs_max_depth = forum.depth + max_depth

      query =
        from f in Forum,
          where: like(f.path, ^(forum.path <> "%")),
          where: is_nil(f.deleted_at),
          where: f.depth <= ^abs_max_depth,
          order_by: [asc: f.depth, asc: f.display_order, asc: f.name]

      forums = Repo.all(query)
      tree = Forum.build_tree(forums)

      json(conn, %{
        data: tree,
        meta: %{
          root_forum_id: forum.id,
          total_count: length(forums)
        }
      })
    else
      :error -> {:error, :bad_request}
      nil -> {:error, :not_found}
    end
  end

  @doc """
  GET /api/v1/forums/:id/children
  Get direct children of a forum.
  """
  def children(conn, %{"id" => id}) do
    with {:ok, uuid} <- Ecto.UUID.cast(id),
         %Forum{} = _forum <- Repo.get(Forum, uuid) do

      children =
        Forum.sub_forums_query(uuid)
        |> Repo.all()

      json(conn, %{data: children})
    else
      :error -> {:error, :bad_request}
      nil -> {:error, :not_found}
    end
  end

  @doc """
  GET /api/v1/forums/:id/ancestors
  Get all ancestors of a forum (for breadcrumbs).
  """
  def ancestors(conn, %{"id" => id}) do
    with {:ok, uuid} <- Ecto.UUID.cast(id),
         %Forum{} = forum <- Repo.get(Forum, uuid) do

      ancestors = Forum.get_ancestors(forum, Repo)

      json(conn, %{data: ancestors})
    else
      :error -> {:error, :bad_request}
      nil -> {:error, :not_found}
    end
  end

  @doc """
  GET /api/v1/forums/:id/breadcrumbs
  Get breadcrumb trail for a forum.
  """
  def breadcrumbs(conn, %{"id" => id}) do
    with {:ok, uuid} <- Ecto.UUID.cast(id),
         %Forum{} = forum <- Repo.get(Forum, uuid) do

      breadcrumbs = Forum.get_breadcrumbs(forum, Repo)

      json(conn, %{data: breadcrumbs})
    else
      :error -> {:error, :bad_request}
      nil -> {:error, :not_found}
    end
  end

  @doc """
  GET /api/v1/forums/roots
  Get all root-level forums.
  """
  def roots(conn, _params) do
    forums =
      Forum.root_forums_query()
      |> Repo.all()

    json(conn, %{data: forums})
  end

  @doc """
  PUT /api/v1/forums/:id/move
  Move a forum to a new parent.
  """
  def move(conn, %{"id" => id, "parent_forum_id" => parent_id}) do
    user = conn.assigns.current_user

    with {:ok, uuid} <- Ecto.UUID.cast(id),
         {:ok, parent_uuid} <- parse_optional_uuid(parent_id),
         %Forum{} = forum <- Repo.get(Forum, uuid),
         :ok <- authorize_hierarchy_change(user, forum),
         :ok <- validate_move(forum, parent_uuid),
         {:ok, updated} <- do_move_forum(forum, parent_uuid) do

      json(conn, %{data: updated})
    else
      :error -> {:error, :bad_request}
      nil -> {:error, :not_found}
      {:error, reason} -> {:error, reason}
    end
  end

  # Fallback: accept params with alternative key names
  def move(conn, %{"id" => id} = params) do
    parent_id = Map.get(params, "parent_id") || Map.get(params, "new_parent_id")
    move(conn, %{"id" => id, "parent_forum_id" => parent_id})
  end

  @doc """
  PUT /api/v1/forums/:id/reorder
  Reorder a forum within its current parent.
  """
  def reorder(conn, %{"id" => id, "position" => position}) do
    user = conn.assigns.current_user
    new_position = String.to_integer(position)

    with {:ok, uuid} <- Ecto.UUID.cast(id),
         %Forum{} = forum <- Repo.get(Forum, uuid),
         :ok <- authorize_hierarchy_change(user, forum),
         {:ok, updated} <- do_reorder_forum(forum, new_position) do

      json(conn, %{data: updated})
    else
      :error -> {:error, :bad_request}
      nil -> {:error, :not_found}
      {:error, reason} -> {:error, reason}
    end
  end

  @doc """
  PUT /api/v1/forums/:id/hierarchy
  Update hierarchy settings for a forum.
  """
  def update_hierarchy(conn, %{"id" => id} = params) do
    user = conn.assigns.current_user

    with {:ok, uuid} <- Ecto.UUID.cast(id),
         %Forum{} = forum <- Repo.get(Forum, uuid),
         :ok <- authorize_hierarchy_change(user, forum),
         {:ok, updated} <- do_update_hierarchy(forum, params) do

      json(conn, %{data: updated})
    else
      :error -> {:error, :bad_request}
      nil -> {:error, :not_found}
      {:error, reason} -> {:error, reason}
    end
  end

  @doc """
  POST /api/v1/forums/:id/create_subforum
  Create a new sub-forum under the given parent.
  """
  def create_subforum(conn, %{"id" => parent_id} = params) do
    user = conn.assigns.current_user

    with {:ok, parent_uuid} <- Ecto.UUID.cast(parent_id),
         %Forum{} = parent_forum <- Repo.get(Forum, parent_uuid),
         :ok <- authorize_hierarchy_change(user, parent_forum),
         {:ok, new_forum} <- do_create_subforum(parent_forum, params, user) do

      conn
      |> put_status(:created)
      |> json(%{data: new_forum})
    else
      :error -> {:error, :bad_request}
      nil -> {:error, :not_found}
      {:error, reason} -> {:error, reason}
    end
  end

  # =============================================================================
  # PRIVATE FUNCTIONS
  # =============================================================================

  defp parse_optional_uuid(nil), do: {:ok, nil}
  defp parse_optional_uuid("null"), do: {:ok, nil}
  defp parse_optional_uuid(""), do: {:ok, nil}
  defp parse_optional_uuid(id), do: Ecto.UUID.cast(id)

  defp authorize_hierarchy_change(user, forum) do
    cond do
      user.role == "admin" -> :ok
      forum.owner_id == user.id -> :ok
      true -> {:error, :forbidden}
    end
  end

  defp validate_move(forum, new_parent_id) do
    cond do
      # Cannot move to itself
      forum.id == new_parent_id ->
        {:error, :cannot_move_to_self}

      # Cannot move to a descendant (would create cycle)
      new_parent_id != nil ->
        case Repo.get(Forum, new_parent_id) do
          nil ->
            {:error, :parent_not_found}

          new_parent ->
            if Forum.descendant?(new_parent, forum) do
              {:error, :cannot_move_to_descendant}
            else
              :ok
            end
        end

      # Moving to root is always valid
      true ->
        :ok
    end
  end

  defp do_move_forum(forum, new_parent_id) do
    # Get the next display order for the new parent
    new_order = get_next_display_order(new_parent_id)

    forum
    |> Forum.hierarchy_changeset(%{
      parent_forum_id: new_parent_id,
      display_order: new_order
    })
    |> Repo.update()
  end

  defp do_reorder_forum(forum, new_position) do
    parent_id = forum.parent_forum_id

    # Get all siblings ordered
    siblings =
      from(f in Forum,
        where: f.parent_forum_id == ^parent_id or (is_nil(f.parent_forum_id) and is_nil(^parent_id)),
        where: is_nil(f.deleted_at),
        where: f.id != ^forum.id,
        order_by: [asc: f.display_order, asc: f.name]
      )
      |> Repo.all()

    # Insert forum at new position
    {before, after_list} = Enum.split(siblings, new_position)
    reordered = before ++ [forum] ++ after_list

    # Update all positions
    _updates =
      Enum.with_index(reordered, fn f, idx ->
        if f.display_order != idx do
          from(fo in Forum, where: fo.id == ^f.id)
          |> Repo.update_all(set: [display_order: idx])
        end
      end)

    {:ok, %{forum | display_order: new_position}}
  end

  defp do_update_hierarchy(forum, params) do
    attrs = Map.take(params, [
      "show_in_navigation", "collapsed_by_default",
      "forum_type", "redirect_url", "inherit_permissions"
    ])

    forum
    |> Forum.hierarchy_changeset(attrs)
    |> Repo.update()
  end

  defp do_create_subforum(parent_forum, params, user) do
    next_order = get_next_display_order(parent_forum.id)

    attrs =
      params
      |> Map.take(["name", "title", "description", "is_public", "category"])
      |> Map.put("parent_forum_id", parent_forum.id)
      |> Map.put("display_order", next_order)
      |> Map.put("owner_id", user.id)

    %Forum{}
    |> Forum.changeset(attrs)
    |> Repo.insert()
  end

  defp get_next_display_order(nil) do
    from(f in Forum,
      where: is_nil(f.parent_forum_id) and is_nil(f.deleted_at),
      select: max(f.display_order)
    )
    |> Repo.one()
    |> Kernel.||(0)
    |> Kernel.+(1)
  end

  defp get_next_display_order(parent_id) do
    from(f in Forum,
      where: f.parent_forum_id == ^parent_id and is_nil(f.deleted_at),
      select: max(f.display_order)
    )
    |> Repo.one()
    |> Kernel.||(0)
    |> Kernel.+(1)
  end
end
