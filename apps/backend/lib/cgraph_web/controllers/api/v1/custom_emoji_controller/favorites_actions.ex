defmodule CGraphWeb.API.V1.CustomEmojiController.FavoritesActions do
  @moduledoc """
  Helper module for custom emoji favorites and recent-usage actions.

  Handles:
  - Listing user's favorite emojis
  - Adding/removing emojis from favorites
  - Listing recently used emojis
  """
  import Ecto.Query
  import Plug.Conn
  import Phoenix.Controller
  import CGraphWeb.ControllerHelpers, only: [render_data: 2]

  alias CGraph.Forums.CustomEmoji
  alias CGraph.Repo

  @doc """
  Get user's favorite emojis.

  GET /api/v1/emojis/favorites
  """
  @spec favorites(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def favorites(conn, _params) do
    case conn.assigns[:current_user] do
      nil ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: %{code: "unauthorized", message: "Authentication required"}})
      user ->
        favorites = from(f in "user_emoji_favorites",
          where: f.user_id == type(^user.id, Ecto.UUID),
          join: e in CustomEmoji, on: e.id == f.emoji_id,
          where: e.is_active == true,
          order_by: [asc: f.order],
          select: e
        )
        |> Repo.all()
        |> Repo.preload([:category])

        render(conn, :index, emojis: favorites)
    end
  end

  @doc """
  Add emoji to favorites.

  POST /api/v1/emojis/:id/favorite
  """
  @spec add_favorite(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def add_favorite(conn, %{"id" => emoji_id}) do
    user = conn.assigns.current_user

    # Check emoji exists
    emoji_exists = from(e in CustomEmoji, where: e.id == ^emoji_id, select: true) |> Repo.one()

    if emoji_exists do
      # Get current max order
      max_order = from(f in "user_emoji_favorites",
        where: f.user_id == type(^user.id, Ecto.UUID),
        select: max(f.order)
      )
      |> Repo.one() || 0

      Repo.insert_all("user_emoji_favorites", [
        %{
          id: Ecto.UUID.dump!(Ecto.UUID.generate()),
          user_id: Ecto.UUID.dump!(user.id),
          emoji_id: Ecto.UUID.dump!(emoji_id),
          order: max_order + 1,
          inserted_at: DateTime.utc_now()
        }
      ], on_conflict: :nothing)

      render_data(conn, %{favorited: true})
    else
      conn
      |> put_status(:not_found)
      |> json(%{error: %{code: "not_found", message: "Emoji not found"}})
    end
  end

  @doc """
  Remove emoji from favorites.

  DELETE /api/v1/emojis/:id/favorite
  """
  @spec remove_favorite(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def remove_favorite(conn, %{"id" => emoji_id}) do
    user = conn.assigns.current_user

    # Check emoji exists
    emoji_exists = from(e in CustomEmoji, where: e.id == ^emoji_id, select: true) |> Repo.one()

    if emoji_exists do
      from(f in "user_emoji_favorites",
        where: f.user_id == type(^user.id, Ecto.UUID) and f.emoji_id == type(^emoji_id, Ecto.UUID)
      )
      |> Repo.delete_all()

      render_data(conn, %{favorited: false})
    else
      conn
      |> put_status(:not_found)
      |> json(%{error: %{code: "not_found", message: "Emoji not found"}})
    end
  end

  @doc """
  Get user's recently used emojis.

  GET /api/v1/emojis/recent
  """
  @spec recent(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def recent(conn, params) do
    case conn.assigns[:current_user] do
      nil ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: %{code: "unauthorized", message: "Authentication required"}})
      user ->
        limit = params |> Map.get("limit", "20") |> String.to_integer() |> min(50)

        recent = from(h in "emoji_usage_history",
          where: h.user_id == type(^user.id, Ecto.UUID),
          distinct: h.emoji_id,
          order_by: [desc: h.inserted_at],
          limit: ^limit,
          join: e in CustomEmoji, on: e.id == h.emoji_id,
          where: e.is_active == true,
          select: e
        )
        |> Repo.all()
        |> Repo.preload([:category])

        render(conn, :index, emojis: recent)
    end
  end
end
