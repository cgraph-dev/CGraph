defmodule CGraphWeb.API.V1.TagController do
  @moduledoc """
  Controller for forum thread tag endpoints.

  Provides CRUD operations for thread tags with permission checks.
  """
  use CGraphWeb, :controller
  import CGraphWeb.ControllerHelpers, only: [render_data: 2, render_error: 3]
  import Ecto.Query, warn: false

  alias CGraph.Forums.{TagCategory, ThreadTag}
  alias CGraph.Repo

  action_fallback CGraphWeb.FallbackController

  @doc """
  GET /api/v1/forums/:forum_id/tags
  Lists tag categories and their tags for a forum.
  """
  def index(conn, %{"forum_id" => forum_id}) do
    categories =
      from(c in TagCategory, where: c.forum_id == ^forum_id, order_by: c.name)
      |> Repo.all()

    render_data(conn, %{tag_categories: categories})
  end

  @doc """
  POST /api/v1/forums/:forum_id/threads/:thread_id/tags
  Applies a tag to a thread. Requires authenticated user.
  """
  def create(conn, %{"thread_id" => thread_id} = params) do
    user = conn.assigns.current_user

    attrs = %{
      thread_id: thread_id,
      tag_category_id: params["tag_category_id"],
      tag_name: params["tag_name"],
      applied_by: user.id
    }

    case %ThreadTag{} |> ThreadTag.changeset(attrs) |> Repo.insert() do
      {:ok, tag} ->
        tag = Repo.preload(tag, :tag_category)

        conn
        |> put_status(:created)
        |> render_data(%{tag: tag})

      {:error, changeset} ->
        {:error, changeset}
    end
  end

  @doc """
  DELETE /api/v1/forums/:forum_id/threads/:thread_id/tags/:id
  Removes a tag from a thread. Requires the user who applied it or a moderator.
  """
  def delete(conn, %{"id" => id}) do
    user = conn.assigns.current_user

    case Repo.get(ThreadTag, id) do
      nil ->
        render_error(conn, :not_found, "Tag not found")

      tag ->
        if tag.applied_by == user.id or has_mod_permission?(conn) do
          Repo.delete!(tag)
          render_data(conn, %{deleted: true})
        else
          render_error(conn, :forbidden, "Not authorized to remove this tag")
        end
    end
  end

  defp has_mod_permission?(conn) do
    case conn.assigns do
      %{current_member: %{role: role}} when role in ["moderator", "admin", "owner"] -> true
      _ -> false
    end
  end
end
