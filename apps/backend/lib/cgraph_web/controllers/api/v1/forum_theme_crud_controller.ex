defmodule CGraphWeb.API.V1.ForumThemeCrudController do
  @moduledoc """
  CRUD controller for forum themes (`ForumTheme` records).

  This is separate from the existing `ThemeController` which handles
  user profile themes via `CGraph.Themes`. This controller manages
  forum-level themes that can be applied to customize the forum appearance.
  """
  use CGraphWeb, :controller

  alias CGraph.Forums
  alias CGraph.Forums.ForumTheme
  alias CGraph.Repo

  import Ecto.Query

  action_fallback CGraphWeb.FallbackController

  @doc """
  GET /api/v1/forums/:forum_id/themes
  Lists all themes for a forum.
  """
  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, %{"forum_id" => forum_id}) do
    themes =
      ForumTheme
      |> where(forum_id: ^forum_id)
      |> where([t], t.is_active == true)
      |> order_by(asc: :name)
      |> Repo.all()

    json(conn, %{data: Enum.map(themes, &theme_json/1)})
  end

  @doc """
  GET /api/v1/forums/:forum_id/themes/:id
  Shows a specific forum theme.
  """
  @spec show(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def show(conn, %{"forum_id" => forum_id, "id" => id}) do
    case get_theme(forum_id, id) do
      nil -> {:error, :not_found}
      theme -> json(conn, %{data: theme_json(theme)})
    end
  end

  @doc """
  POST /api/v1/forums/:forum_id/themes
  Creates a new forum theme.
  """
  @spec create(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def create(conn, %{"forum_id" => forum_id} = params) do
    user = conn.assigns.current_user

    with {:ok, forum} <- get_forum(forum_id),
         :ok <- authorize_admin(forum, user) do
      attrs =
        params
        |> Map.drop(["forum_id"])
        |> Map.put("forum_id", forum_id)
        |> Map.put("created_by_id", user.id)

      case %ForumTheme{} |> ForumTheme.changeset(attrs) |> Repo.insert() do
        {:ok, theme} ->
          conn
          |> put_status(:created)
          |> json(%{data: theme_json(theme)})

        {:error, changeset} ->
          {:error, changeset}
      end
    end
  end

  @doc """
  PUT /api/v1/forums/:forum_id/themes/:id
  Updates an existing forum theme.
  """
  @spec update(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def update(conn, %{"forum_id" => forum_id, "id" => id} = params) do
    user = conn.assigns.current_user

    with {:ok, forum} <- get_forum(forum_id),
         :ok <- authorize_admin(forum, user),
         %ForumTheme{} = theme <- get_theme(forum_id, id) do
      attrs = Map.drop(params, ["forum_id", "id"])

      case theme |> ForumTheme.changeset(attrs) |> Repo.update() do
        {:ok, updated} -> json(conn, %{data: theme_json(updated)})
        {:error, changeset} -> {:error, changeset}
      end
    else
      nil -> {:error, :not_found}
      error -> error
    end
  end

  @doc """
  DELETE /api/v1/forums/:forum_id/themes/:id
  Soft-deletes a theme by setting is_active to false.
  """
  @spec delete(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def delete(conn, %{"forum_id" => forum_id, "id" => id}) do
    user = conn.assigns.current_user

    with {:ok, forum} <- get_forum(forum_id),
         :ok <- authorize_admin(forum, user),
         %ForumTheme{} = theme <- get_theme(forum_id, id) do
      case theme |> Ecto.Changeset.change(is_active: false) |> Repo.update() do
        {:ok, _} -> send_resp(conn, :no_content, "")
        {:error, changeset} -> {:error, changeset}
      end
    else
      nil -> {:error, :not_found}
      error -> error
    end
  end

  @doc """
  POST /api/v1/forums/:forum_id/themes/:id/activate
  Sets a theme as the default for the forum.
  """
  @spec activate(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def activate(conn, %{"forum_id" => forum_id, "id" => id}) do
    user = conn.assigns.current_user

    with {:ok, forum} <- get_forum(forum_id),
         :ok <- authorize_admin(forum, user),
         %ForumTheme{} = theme <- get_theme(forum_id, id) do
      # Deactivate all other defaults
      ForumTheme
      |> where(forum_id: ^forum_id, is_default: true)
      |> Repo.update_all(set: [is_default: false])

      case theme |> Ecto.Changeset.change(is_default: true) |> Repo.update() do
        {:ok, updated} -> json(conn, %{data: theme_json(updated)})
        {:error, changeset} -> {:error, changeset}
      end
    else
      nil -> {:error, :not_found}
      error -> error
    end
  end

  # ===========================================================================
  # PRIVATE
  # ===========================================================================

  defp get_forum(forum_id) do
    case Forums.get_forum(forum_id) do
      nil -> {:error, :not_found}
      forum -> {:ok, forum}
    end
  end

  defp authorize_admin(forum, user) do
    if forum.owner_id == user.id || Forums.is_moderator?(forum.id, user.id) do
      :ok
    else
      {:error, :forbidden}
    end
  end

  defp get_theme(forum_id, id) do
    ForumTheme
    |> where(forum_id: ^forum_id)
    |> Repo.get(id)
  end

  defp theme_json(%ForumTheme{} = t) do
    %{
      id: t.id,
      name: t.name,
      slug: t.slug,
      description: t.description,
      is_default: t.is_default,
      is_active: t.is_active,
      primary_color: t.primary_color,
      secondary_color: t.secondary_color,
      accent_color: t.accent_color,
      background_color: t.background_color,
      text_color: t.text_color,
      link_color: t.link_color,
      custom_css: t.custom_css,
      header_logo_url: t.header_logo_url,
      header_background_url: t.header_background_url,
      header_height: t.header_height,
      template_overrides: t.template_overrides,
      font_family: t.font_family,
      font_size_base: t.font_size_base,
      sidebar_position: t.sidebar_position,
      content_width: t.content_width,
      show_breadcrumbs: t.show_breadcrumbs,
      show_forum_stats: t.show_forum_stats,
      forum_id: t.forum_id,
      created_by_id: t.created_by_id,
      inserted_at: t.inserted_at,
      updated_at: t.updated_at
    }
  end
end
