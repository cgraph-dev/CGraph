defmodule CGraphWeb.API.V1.StickerController do
  @moduledoc """
  API controller for the sticker system.

  All sticker packs are official/shared — users browse and add pre-made packs
  to their personal collection. No user-uploaded custom stickers.

  ## Endpoints

  - `GET  /api/v1/stickers/store`          — Browse sticker store
  - `GET  /api/v1/stickers/search`         — Search packs
  - `GET  /api/v1/stickers/categories`     — List available categories
  - `GET  /api/v1/stickers/trending`       — Top packs by downloads
  - `GET  /api/v1/stickers/my-packs`       — User's installed packs
  - `GET  /api/v1/stickers/recent`         — Recently used stickers
  - `GET  /api/v1/stickers/packs/:id`      — Single pack with all stickers
  - `POST /api/v1/stickers/packs/:id/add`  — Add pack to collection
  - `DELETE /api/v1/stickers/packs/:id/remove` — Remove pack from collection
  """
  use CGraphWeb, :controller

  alias CGraph.Stickers

  action_fallback CGraphWeb.FallbackController

  # ============================================================================
  # Store Browsing
  # ============================================================================

  @doc """
  Browse the sticker store.

  GET /api/v1/stickers/store

  Query params:
  - category: filter by category (animals, emotions, memes, etc.)
  - type: filter by sticker_type (static, animated, video)
  - premium: filter by premium status ("true"/"false")
  - page: page number (default 1)
  - per_page: items per page (default 20, max 50)
  """
  def store(conn, params) do
    opts =
      []
      |> maybe_add(:category, params["category"])
      |> maybe_add(:sticker_type, params["type"])
      |> maybe_add_bool(:is_premium, params["premium"])
      |> Keyword.put(:page, parse_int(params["page"], 1))
      |> Keyword.put(:per_page, parse_int(params["per_page"], 20))

    result = Stickers.list_store_packs(opts)

    conn
    |> put_status(:ok)
    |> render(:store,
      packs: result.packs,
      total: result.total,
      page: Keyword.get(opts, :page),
      per_page: Keyword.get(opts, :per_page)
    )
  end

  @doc """
  Search sticker packs by name, title, or emoji shortcode.

  GET /api/v1/stickers/search?q=...
  """
  def search(conn, %{"q" => query}) when byte_size(query) > 0 do
    packs = Stickers.search_packs(query, limit: parse_int(conn.params["limit"], 20))

    conn
    |> put_status(:ok)
    |> render(:search, packs: packs)
  end

  def search(conn, _params) do
    conn
    |> put_status(:bad_request)
    |> json(%{error: "Query parameter 'q' is required"})
  end

  @doc """
  List available sticker categories.

  GET /api/v1/stickers/categories
  """
  def categories(conn, _params) do
    conn
    |> put_status(:ok)
    |> render(:categories, categories: Stickers.list_categories())
  end

  @doc """
  Get trending sticker packs.

  GET /api/v1/stickers/trending
  """
  def trending(conn, params) do
    limit = parse_int(params["limit"], 20)
    packs = Stickers.trending_packs(limit)

    conn
    |> put_status(:ok)
    |> render(:trending, packs: packs)
  end

  # ============================================================================
  # User Collection
  # ============================================================================

  @doc """
  List the current user's installed sticker packs with all stickers.

  GET /api/v1/stickers/my-packs
  """
  def my_packs(conn, _params) do
    user = conn.assigns.current_user
    packs = Stickers.list_user_packs(user.id)

    conn
    |> put_status(:ok)
    |> render(:my_packs, packs: packs)
  end

  @doc """
  Get recently used stickers for the current user.

  GET /api/v1/stickers/recent
  """
  def recently_used(conn, params) do
    user = conn.assigns.current_user
    limit = parse_int(params["limit"], 20)
    stickers = Stickers.list_recently_used(user.id, limit)

    conn
    |> put_status(:ok)
    |> render(:recently_used, stickers: stickers)
  end

  @doc """
  Get a single sticker pack with all its stickers.

  GET /api/v1/stickers/packs/:id
  """
  def show_pack(conn, %{"id" => pack_id}) do
    case Stickers.get_pack(pack_id) do
      {:ok, pack} ->
        conn
        |> put_status(:ok)
        |> render(:show_pack, pack: pack)

      {:error, :not_found} ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "Sticker pack not found"})
    end
  end

  @doc """
  Add a sticker pack to the current user's collection.

  POST /api/v1/stickers/packs/:id/add

  For packs with a coin_price > 0, coins are deducted from the user's balance.
  """
  def add_pack(conn, %{"id" => pack_id}) do
    user = conn.assigns.current_user

    case Stickers.add_pack(user, pack_id) do
      {:ok, user_sticker_pack} ->
        conn
        |> put_status(:created)
        |> render(:add_pack, user_sticker_pack: user_sticker_pack)

      {:error, :not_found} ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "Sticker pack not found"})

      {:error, :already_added} ->
        conn
        |> put_status(:conflict)
        |> json(%{error: "Pack already in your collection"})

      {:error, :insufficient_nodes} ->
        conn
        |> put_status(:payment_required)
        |> json(%{error: "Not enough nodes to purchase this pack"})

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: "Failed to add pack", details: format_errors(changeset)})
    end
  end

  @doc """
  Remove a sticker pack from the current user's collection.

  DELETE /api/v1/stickers/packs/:id/remove
  """
  def remove_pack(conn, %{"id" => pack_id}) do
    user = conn.assigns.current_user

    case Stickers.remove_pack(user, pack_id) do
      {:ok, _deleted} ->
        conn
        |> put_status(:ok)
        |> json(%{message: "Pack removed from your collection"})

      {:error, :not_found} ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "Pack not in your collection"})
    end
  end

  # ============================================================================
  # Private Helpers
  # ============================================================================

  defp parse_int(nil, default), do: default
  defp parse_int(val, default) when is_binary(val) do
    case Integer.parse(val) do
      {n, _} -> n
      :error -> default
    end
  end
  defp parse_int(val, _default) when is_integer(val), do: val
  defp parse_int(_, default), do: default

  defp maybe_add(opts, _key, nil), do: opts
  defp maybe_add(opts, _key, ""), do: opts
  defp maybe_add(opts, key, value), do: Keyword.put(opts, key, value)

  defp maybe_add_bool(opts, _key, nil), do: opts
  defp maybe_add_bool(opts, key, "true"), do: Keyword.put(opts, key, true)
  defp maybe_add_bool(opts, key, "false"), do: Keyword.put(opts, key, false)
  defp maybe_add_bool(opts, _key, _), do: opts

  defp format_errors(%Ecto.Changeset{} = changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Regex.replace(~r"%{(\w+)}", msg, fn _, key ->
        opts |> Keyword.get(String.to_existing_atom(key), key) |> to_string()
      end)
    end)
  end

  defp format_errors(_), do: %{}
end
