defmodule CGraphWeb.API.V1.CustomEmojiController do
  @moduledoc """
  Controller for custom emoji management.

  Provides endpoints for:
  - Listing available emojis
  - Creating new custom emojis
  - Managing emoji categories
  - Emoji search and favorites
  - Admin moderation
  """
  use CGraphWeb, :controller

  import Ecto.Query

  alias CGraph.Forums.{CustomEmoji, EmojiCategory, EmojiPack}
  alias CGraph.Repo
  alias CGraph.Storage

  action_fallback CGraphWeb.FallbackController

  alias CGraphWeb.API.V1.CustomEmojiController.FavoritesActions

  # Delegated favorites & recent actions
  defdelegate favorites(conn, params), to: FavoritesActions
  defdelegate add_favorite(conn, params), to: FavoritesActions
  defdelegate remove_favorite(conn, params), to: FavoritesActions
  defdelegate recent(conn, params), to: FavoritesActions

  # Maximum file size for emoji upload (512KB)
  @max_file_size 512_000

  # ============================================================================
  # Public Endpoints
  # ============================================================================

  @doc """
  List all available emojis.

  GET /api/v1/emojis
  Optional params:
  - forum_id: Include forum-specific emojis
  - category_id: Filter by category
  - search: Search by shortcode/name
  - limit: Max results (default 100)
  """
  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, params) do
    forum_id = Map.get(params, "forum_id")
    category_id = Map.get(params, "category_id")
    search = Map.get(params, "search")
    limit = params |> Map.get("limit", "100") |> String.to_integer() |> min(500)

    query = build_emoji_query(forum_id, category_id, search)

    emojis = query
    |> limit(^limit)
    |> Repo.all()
    |> Repo.preload([:category])

    render(conn, :index, emojis: emojis)
  end

  @doc """
  Get a single emoji by ID or shortcode.

  GET /api/v1/emojis/:id
  """
  @spec show(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def show(conn, %{"id" => id}) do
    with {:ok, emoji} <- get_emoji(id) do
      render(conn, :show, emoji: emoji)
    end
  end

  @doc """
  List emoji categories.

  GET /api/v1/emojis/categories
  """
  @spec categories(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def categories(conn, params) do
    forum_id = Map.get(params, "forum_id")

    categories =
      if forum_id do
        EmojiCategory.available_for_forum_query(forum_id)
      else
        EmojiCategory.global_query()
      end
      |> Repo.all()
      |> Repo.preload([emojis: from(e in CustomEmoji, where: e.is_active == true, limit: 5)])

    render(conn, :categories, categories: categories)
  end

  @doc """
  Search emojis by shortcode or name.

  GET /api/v1/emojis/search?q=:query
  """
  @spec search(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def search(conn, %{"q" => query}) when byte_size(query) >= 2 do
    forum_id = Map.get(conn.params, "forum_id")

    emojis =
      CustomEmoji.search_query(query)
      |> maybe_filter_by_forum(forum_id)
      |> Repo.all()
      |> Repo.preload([:category])

    render(conn, :index, emojis: emojis)
  end

  @spec search(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def search(conn, _params) do
    render(conn, :index, emojis: [])
  end

  @doc """
  Get popular emojis.

  GET /api/v1/emojis/popular
  """
  @spec popular(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def popular(conn, params) do
    limit = params |> Map.get("limit", "20") |> String.to_integer() |> min(50)
    forum_id = Map.get(params, "forum_id")

    emojis =
      CustomEmoji.popular_query(limit)
      |> maybe_filter_by_forum(forum_id)
      |> Repo.all()
      |> Repo.preload([:category])

    render(conn, :index, emojis: emojis)
  end

  # ============================================================================
  # Authenticated Endpoints
  # ============================================================================

  @doc """
  Create a new custom emoji (upload).

  POST /api/v1/emojis
  """
  @spec create(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def create(conn, %{"emoji" => emoji_params} = params) do
    user = conn.assigns.current_user

    with :ok <- validate_upload(params),
         {:ok, image_url} <- upload_emoji_image(params),
         attrs = build_emoji_attrs(emoji_params, image_url, user),
         {:ok, emoji} <- create_emoji(attrs) do
      conn
      |> put_status(:created)
      |> render(:show, emoji: emoji)
    end
  end

  @spec create(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def create(conn, _params) do
    conn
    |> put_status(:bad_request)
    |> json(%{error: %{message: "Missing emoji data"}})
  end

  @doc """
  Update an emoji.

  PUT /api/v1/emojis/:id
  """
  @spec update(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def update(conn, %{"id" => id, "emoji" => emoji_params}) do
    user = conn.assigns.current_user

    with {:ok, emoji} <- get_emoji(id),
         :ok <- authorize_edit(emoji, user),
         {:ok, updated} <- do_update_emoji(emoji, emoji_params) do
      render(conn, :show, emoji: updated)
    end
  end

  @doc """
  Delete an emoji.

  DELETE /api/v1/emojis/:id
  """
  @spec delete(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def delete(conn, %{"id" => id}) do
    user = conn.assigns.current_user

    with {:ok, emoji} <- get_emoji(id),
         :ok <- authorize_delete(emoji, user),
         {:ok, _} <- Repo.delete(emoji) do
      send_resp(conn, :no_content, "")
    end
  end

  @doc """
  Track emoji usage (increment counter).

  POST /api/v1/emojis/:id/use
  """
  @spec use(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def use(conn, %{"id" => id}) do
    CustomEmoji.increment_usage(id)
    send_resp(conn, :no_content, "")
  end

  # ============================================================================
  # Admin Endpoints
  # ============================================================================

  @doc """
  List emojis pending moderation.

  GET /api/v1/admin/emojis/pending
  """
  @spec pending(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def pending(conn, _params) do
    emojis = CustomEmoji.pending_query()
    |> Repo.all()
    |> Repo.preload([:category, :created_by])

    render(conn, :index, emojis: emojis)
  end

  @doc """
  Approve a pending emoji.

  POST /api/v1/admin/emojis/:id/approve
  """
  @spec approve(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def approve(conn, %{"id" => id}) do
    user = conn.assigns.current_user

    with {:ok, emoji} <- get_emoji(id),
         changeset = CustomEmoji.approve_changeset(emoji, user.id),
         {:ok, approved} <- Repo.update(changeset) do
      render(conn, :show, emoji: approved)
    end
  end

  @doc """
  Reject a pending emoji.

  POST /api/v1/admin/emojis/:id/reject
  """
  @spec reject(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def reject(conn, %{"id" => id, "reason" => reason}) do
    with {:ok, emoji} <- get_emoji(id),
         changeset = CustomEmoji.reject_changeset(emoji, reason),
         {:ok, rejected} <- Repo.update(changeset) do
      render(conn, :show, emoji: rejected)
    end
  end

  @spec reject(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def reject(conn, %{"id" => _id}) do
    conn
    |> put_status(:bad_request)
    |> json(%{error: %{message: "Rejection reason is required"}})
  end

  # ============================================================================
  # Category Management
  # ============================================================================

  @doc """
  Create a new emoji category.

  POST /api/v1/emojis/categories
  """
  @spec create_category(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def create_category(conn, %{"category" => category_params}) do
    attrs = Map.take(category_params, ["name", "description", "icon", "display_order", "forum_id"])

    case %EmojiCategory{} |> EmojiCategory.create_changeset(attrs) |> Repo.insert() do
      {:ok, category} ->
        conn
        |> put_status(:created)
        |> render(:category, category: category)

      {:error, changeset} ->
        {:error, changeset}
    end
  end

  @doc """
  Update an emoji category.

  PUT /api/v1/emojis/categories/:id
  """
  @spec update_category(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def update_category(conn, %{"id" => id, "category" => category_params}) do
    with {:ok, category} <- get_category(id),
         changeset = EmojiCategory.update_changeset(category, category_params),
         {:ok, updated} <- Repo.update(changeset) do
      render(conn, :category, category: updated)
    end
  end

  @doc """
  Delete an emoji category.

  DELETE /api/v1/emojis/categories/:id
  """
  @spec delete_category(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def delete_category(conn, %{"id" => id}) do
    with {:ok, category} <- get_category(id),
         false <- category.is_system,
         {:ok, _} <- Repo.delete(category) do
      send_resp(conn, :no_content, "")
    else
      true ->
        conn
        |> put_status(:forbidden)
        |> json(%{error: %{message: "Cannot delete system categories"}})

      error ->
        error
    end
  end

  # ============================================================================
  # Emoji Pack Endpoints
  # ============================================================================

  @doc """
  Export an emoji pack as JSON bundle.

  GET /api/v1/forums/:forum_id/emoji-packs/:id/export
  """
  @spec export_pack(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def export_pack(conn, %{"id" => pack_id}) do
    case EmojiPack.export_pack(pack_id) do
      {:ok, bundle} ->
        conn
        |> put_resp_content_type("application/json")
        |> put_resp_header("content-disposition", ~s(attachment; filename="emoji-pack-#{pack_id}.json"))
        |> json(bundle)

      {:error, :not_found} ->
        {:error, :not_found}
    end
  end

  @doc """
  Import an emoji pack from JSON bundle.

  POST /api/v1/forums/:forum_id/emoji-packs/import
  """
  @spec import_pack(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def import_pack(conn, %{"forum_id" => forum_id, "bundle" => bundle}) when is_map(bundle) do
    case EmojiPack.import_pack(forum_id, bundle) do
      {:ok, pack} ->
        conn
        |> put_status(:created)
        |> json(%{
          data: %{
            id: pack.id,
            name: pack.name,
            emoji_count: pack.emoji_count,
            version: pack.version
          }
        })

      {:error, :too_many_emojis} ->
        conn |> put_status(:bad_request) |> json(%{error: %{message: "Pack exceeds 500 emoji limit"}})

      {:error, :invalid_bundle} ->
        conn |> put_status(:bad_request) |> json(%{error: %{message: "Invalid pack bundle format"}})

      {:error, {:emoji_import_errors, count}} ->
        conn |> put_status(:unprocessable_entity) |> json(%{error: %{message: "#{count} emojis failed to import"}})

      {:error, _reason} ->
        conn |> put_status(:unprocessable_entity) |> json(%{error: %{message: "Failed to import pack"}})
    end
  end

  def import_pack(conn, _params) do
    conn |> put_status(:bad_request) |> json(%{error: %{message: "Missing bundle data"}})
  end

  @doc """
  Browse marketplace (public) packs.

  GET /api/v1/emoji-packs/marketplace
  """
  @spec marketplace(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def marketplace(conn, _params) do
    packs = EmojiPack.list_available_packs()

    json(conn, %{
      data: Enum.map(packs, fn p ->
        %{
          id: p.id,
          name: p.name,
          description: p.description,
          author: p.author,
          version: p.version,
          icon_url: p.icon_url,
          emoji_count: p.emoji_count,
          is_premium: p.is_premium
        }
      end)
    })
  end

  @doc """
  List emoji packs for a forum.

  GET /api/v1/forums/:forum_id/emoji-packs
  """
  @spec list_packs(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def list_packs(conn, %{"forum_id" => forum_id}) do
    packs = EmojiPack.list_forum_packs(forum_id)

    json(conn, %{
      data: Enum.map(packs, fn p ->
        %{
          id: p.id,
          name: p.name,
          description: p.description,
          author: p.author,
          version: p.version,
          icon_url: p.icon_url,
          emoji_count: p.emoji_count,
          is_premium: p.is_premium,
          is_active: p.is_active,
          emojis: Enum.map(p.emojis || [], fn e ->
            %{id: e.id, shortcode: e.shortcode, image_url: e.image_url, is_animated: e.is_animated}
          end)
        }
      end)
    })
  end

  # ============================================================================
  # Private Functions
  # ============================================================================

  defp build_emoji_query(forum_id, category_id, search) do
    base_query = from(e in CustomEmoji, where: e.is_active == true)

    base_query
    |> maybe_filter_by_forum(forum_id)
    |> maybe_filter_by_category(category_id)
    |> maybe_search(search)
    |> order_by([e], [asc: e.display_order, asc: e.name])
  end

  defp maybe_filter_by_forum(query, nil) do
    from e in query, where: is_nil(e.forum_id)
  end

  defp maybe_filter_by_forum(query, forum_id) do
    from e in query, where: is_nil(e.forum_id) or e.forum_id == ^forum_id
  end

  defp maybe_filter_by_category(query, nil), do: query

  defp maybe_filter_by_category(query, category_id) do
    from e in query, where: e.category_id == ^category_id
  end

  defp maybe_search(query, nil), do: query
  defp maybe_search(query, ""), do: query

  defp maybe_search(query, search) do
    pattern = "%#{search}%"
    from e in query,
      where: ilike(e.shortcode, ^pattern) or ilike(e.name, ^pattern)
  end

  defp get_emoji(id) do
    case Ecto.UUID.cast(id) do
      :error -> {:error, :not_found}
      {:ok, _uuid} ->
        case Repo.get(CustomEmoji, id) do
          nil -> {:error, :not_found}
          emoji -> {:ok, Repo.preload(emoji, [:category, :created_by])}
        end
    end
  end

  defp get_category(id) do
    case Ecto.UUID.cast(id) do
      :error -> {:error, :not_found}
      {:ok, _uuid} ->
        case Repo.get(EmojiCategory, id) do
          nil -> {:error, :not_found}
          category -> {:ok, category}
        end
    end
  end

  defp validate_upload(%{"image" => %Plug.Upload{} = upload}) do
    cond do
      upload.content_type not in ["image/png", "image/gif", "image/webp", "image/jpeg"] ->
        {:error, :invalid_file_type}

      File.stat!(upload.path).size > @max_file_size ->
        {:error, :file_too_large}

      true ->
        :ok
    end
  end

  defp validate_upload(_), do: {:error, :no_image}

  defp upload_emoji_image(%{"image" => %Plug.Upload{} = upload}) do
    # Use the storage service to upload
    case Storage.upload(upload.path, "emojis", upload.filename, upload.content_type) do
      {:ok, url} -> {:ok, url}
      {:error, reason} -> {:error, {:upload_failed, reason}}
    end
  end

  defp build_emoji_attrs(params, image_url, user) do
    %{
      "shortcode" => params["shortcode"],
      "name" => params["name"] || params["shortcode"],
      "description" => params["description"],
      "image_url" => image_url,
      "image_type" => params["image_type"] || "png",
      "is_animated" => params["is_animated"] || false,
      "category_id" => params["category_id"],
      "forum_id" => params["forum_id"],
      "created_by_id" => user.id,
      "aliases" => params["aliases"] || []
    }
  end

  defp create_emoji(attrs) do
    %CustomEmoji{}
    |> CustomEmoji.create_changeset(attrs)
    |> Repo.insert()
  end

  defp do_update_emoji(emoji, params) do
    emoji
    |> CustomEmoji.update_changeset(params)
    |> Repo.update()
  end

  defp authorize_edit(%{created_by_id: user_id}, %{id: user_id}), do: :ok
  defp authorize_edit(%{is_system: true}, _), do: {:error, :forbidden}
  defp authorize_edit(_, %{is_admin: true}), do: :ok
  defp authorize_edit(_, _), do: {:error, :forbidden}

  defp authorize_delete(%{is_system: true}, _), do: {:error, :forbidden}
  defp authorize_delete(%{created_by_id: user_id}, %{id: user_id}), do: :ok
  defp authorize_delete(_, %{is_admin: true}), do: :ok
  defp authorize_delete(_, _), do: {:error, :forbidden}
end
