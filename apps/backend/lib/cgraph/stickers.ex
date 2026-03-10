defmodule CGraph.Stickers do
  @moduledoc """
  Context for the sticker system.

  All sticker packs are official/shared — curated collections that every user
  can browse and add to their personal tray. No user-uploaded custom stickers.

  ## Features

  - Browse sticker store by category, type, price
  - Search packs by name/title/emoji shortcode
  - Add/remove packs to user's personal collection
  - Node-gated premium packs (uses Nodes debit)
  - Track download counts and trending packs
  - Recently used stickers per user
  """

  import Ecto.Query
  alias CGraph.Repo
  alias CGraph.Stickers.{StickerPack, Sticker, UserStickerPack}

  # ============================================================================
  # Store Browsing
  # ============================================================================

  @doc """
  Lists published sticker packs for the store.

  ## Options

    * `:category` — filter by category (e.g., "animals", "emotions")
    * `:sticker_type` — filter by type ("static", "animated", "video")
    * `:is_premium` — filter premium/free packs (boolean)
    * `:page` — page number (default: 1)
    * `:per_page` — items per page (default: 20, max: 50)

  Returns packs with a preview of the first 5 stickers each.
  """
  @spec list_store_packs(keyword()) :: %{packs: [StickerPack.t()], total: non_neg_integer()}
  def list_store_packs(opts \\ []) do
    page = max(Keyword.get(opts, :page, 1), 1)
    per_page = opts |> Keyword.get(:per_page, 20) |> min(50) |> max(1)
    offset = (page - 1) * per_page

    query =
      from(p in StickerPack,
        where: p.published == true,
        order_by: [asc: p.sort_order, desc: p.download_count]
      )
      |> maybe_filter_category(opts[:category])
      |> maybe_filter_type(opts[:sticker_type])
      |> maybe_filter_premium(opts[:is_premium])

    total = Repo.aggregate(query, :count)

    packs =
      query
      |> limit(^per_page)
      |> offset(^offset)
      |> Repo.all()
      |> Repo.preload(stickers: from(s in Sticker, order_by: s.sort_order, limit: 5))

    %{packs: packs, total: total}
  end

  @doc """
  Gets a single sticker pack with all its stickers.
  """
  @spec get_pack(String.t()) :: {:ok, StickerPack.t()} | {:error, :not_found}
  def get_pack(pack_id) do
    case Repo.get(StickerPack, pack_id) do
      nil -> {:error, :not_found}
      pack -> {:ok, Repo.preload(pack, stickers: from(s in Sticker, order_by: s.sort_order))}
    end
  end

  @doc """
  Gets a single sticker by ID with its pack info.
  """
  @spec get_sticker(String.t()) :: {:ok, Sticker.t()} | {:error, :not_found}
  def get_sticker(sticker_id) do
    case Repo.get(Sticker, sticker_id) do
      nil -> {:error, :not_found}
      sticker -> {:ok, Repo.preload(sticker, :sticker_pack)}
    end
  end

  @doc """
  Searches packs by name, title, or emoji shortcode.
  """
  @spec search_packs(String.t(), keyword()) :: [StickerPack.t()]
  def search_packs(query, opts \\ []) when is_binary(query) do
    limit = opts |> Keyword.get(:limit, 20) |> min(50) |> max(1)
    term = "%#{sanitize_like(query)}%"

    from(p in StickerPack,
      left_join: s in Sticker,
      on: s.sticker_pack_id == p.id,
      where: p.published == true,
      where:
        ilike(p.name, ^term) or
          ilike(p.title, ^term) or
          ilike(s.emoji_shortcode, ^term),
      distinct: p.id,
      order_by: [desc: p.download_count],
      limit: ^limit
    )
    |> Repo.all()
    |> Repo.preload(stickers: from(s in Sticker, order_by: s.sort_order, limit: 5))
  end

  @doc """
  Returns trending sticker packs (top by download count).
  """
  @spec trending_packs(pos_integer()) :: [StickerPack.t()]
  def trending_packs(limit \\ 20) do
    from(p in StickerPack,
      where: p.published == true,
      order_by: [desc: p.download_count],
      limit: ^limit
    )
    |> Repo.all()
    |> Repo.preload(stickers: from(s in Sticker, order_by: s.sort_order, limit: 5))
  end

  @doc """
  Lists available sticker categories.
  """
  @spec list_categories() :: [String.t()]
  def list_categories, do: StickerPack.categories()

  # ============================================================================
  # User Collection
  # ============================================================================

  @doc """
  Adds a sticker pack to a user's collection.

  If the pack has a coin price > 0, deducts nodes from the user's wallet.
  Returns `{:error, :insufficient_nodes}` if the user doesn't have enough.
  """
  @spec add_pack(map(), String.t()) :: {:ok, UserStickerPack.t()} | {:error, atom() | Ecto.Changeset.t()}
  def add_pack(user, pack_id) do
    with {:ok, pack} <- get_pack(pack_id),
         :ok <- check_not_already_added(user.id, pack_id),
         :ok <- maybe_charge_nodes(user, pack) do
      %UserStickerPack{}
      |> UserStickerPack.changeset(%{user_id: user.id, sticker_pack_id: pack_id})
      |> Repo.insert()
      |> case do
        {:ok, usp} ->
          increment_download_count(pack_id)
          {:ok, Repo.preload(usp, :sticker_pack)}

        {:error, changeset} ->
          {:error, changeset}
      end
    end
  end

  @doc """
  Removes a sticker pack from a user's collection.
  """
  @spec remove_pack(map(), String.t()) :: {:ok, UserStickerPack.t()} | {:error, :not_found}
  def remove_pack(user, pack_id) do
    case Repo.get_by(UserStickerPack, user_id: user.id, sticker_pack_id: pack_id) do
      nil -> {:error, :not_found}
      usp -> Repo.delete(usp)
    end
  end

  @doc """
  Lists all sticker packs in a user's collection, with stickers.
  """
  @spec list_user_packs(String.t()) :: [StickerPack.t()]
  def list_user_packs(user_id) do
    from(p in StickerPack,
      join: usp in UserStickerPack,
      on: usp.sticker_pack_id == p.id,
      where: usp.user_id == ^user_id,
      order_by: [asc: usp.sort_order, asc: usp.inserted_at]
    )
    |> Repo.all()
    |> Repo.preload(stickers: from(s in Sticker, order_by: s.sort_order))
  end

  @doc """
  Returns recently used stickers for a user.

  Queries the messages table for sticker-type messages sent by this user,
  extracts sticker IDs from the content field, and returns the sticker records.
  """
  @spec list_recently_used(String.t(), pos_integer()) :: [Sticker.t()]
  def list_recently_used(user_id, limit \\ 20) do
    sticker_ids =
      from(m in CGraph.Messaging.Message,
        where: m.sender_id == ^user_id and m.content_type == "sticker",
        where: is_nil(m.deleted_at),
        order_by: [desc: m.inserted_at],
        select: m.content,
        limit: ^(limit * 2)
      )
      |> Repo.all()
      |> Enum.uniq()
      |> Enum.take(limit)

    if sticker_ids == [] do
      []
    else
      from(s in Sticker,
        where: s.id in ^sticker_ids,
        preload: [:sticker_pack]
      )
      |> Repo.all()
    end
  end

  @doc """
  Checks whether a user has a specific pack in their collection.
  """
  @spec user_has_pack?(String.t(), String.t()) :: boolean()
  def user_has_pack?(user_id, pack_id) do
    from(usp in UserStickerPack,
      where: usp.user_id == ^user_id and usp.sticker_pack_id == ^pack_id
    )
    |> Repo.exists?()
  end

  # ============================================================================
  # Admin / Seed Helpers
  # ============================================================================

  @doc """
  Creates a new sticker pack (admin only).
  """
  @spec create_pack(map()) :: {:ok, StickerPack.t()} | {:error, Ecto.Changeset.t()}
  def create_pack(attrs) do
    %StickerPack{}
    |> StickerPack.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates an existing sticker pack (admin only).
  """
  @spec update_pack(StickerPack.t(), map()) :: {:ok, StickerPack.t()} | {:error, Ecto.Changeset.t()}
  def update_pack(%StickerPack{} = pack, attrs) do
    pack
    |> StickerPack.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Adds a sticker to a pack (admin only).
  """
  @spec add_sticker_to_pack(StickerPack.t(), map()) :: {:ok, Sticker.t()} | {:error, Ecto.Changeset.t()}
  def add_sticker_to_pack(%StickerPack{} = pack, attrs) do
    result =
      %Sticker{}
      |> Sticker.changeset(Map.put(attrs, :sticker_pack_id, pack.id))
      |> Repo.insert()

    case result do
      {:ok, sticker} ->
        update_sticker_count(pack.id)
        {:ok, sticker}

      error ->
        error
    end
  end

  # ============================================================================
  # Private Helpers
  # ============================================================================

  defp check_not_already_added(user_id, pack_id) do
    if user_has_pack?(user_id, pack_id) do
      {:error, :already_added}
    else
      :ok
    end
  end

  defp maybe_charge_nodes(_user, %StickerPack{coin_price: 0}), do: :ok
  defp maybe_charge_nodes(_user, %StickerPack{coin_price: nil}), do: :ok

  defp maybe_charge_nodes(user, %StickerPack{coin_price: price, id: pack_id}) when price > 0 do
    case CGraph.Nodes.debit_nodes(user.id, price, :cosmetic_purchase,
           description: "Sticker pack purchase",
           reference_type: "sticker_pack",
           reference_id: pack_id
         ) do
      {:ok, _transaction} -> :ok
      {:error, :insufficient_balance} -> {:error, :insufficient_nodes}
    end
  end

  defp increment_download_count(pack_id) do
    from(p in StickerPack, where: p.id == ^pack_id)
    |> Repo.update_all(inc: [download_count: 1])
  end

  defp update_sticker_count(pack_id) do
    count =
      from(s in Sticker, where: s.sticker_pack_id == ^pack_id)
      |> Repo.aggregate(:count)

    from(p in StickerPack, where: p.id == ^pack_id)
    |> Repo.update_all(set: [sticker_count: count])
  end

  defp maybe_filter_category(query, nil), do: query
  defp maybe_filter_category(query, category), do: where(query, [p], p.category == ^category)

  defp maybe_filter_type(query, nil), do: query
  defp maybe_filter_type(query, type), do: where(query, [p], p.sticker_type == ^type)

  defp maybe_filter_premium(query, nil), do: query
  defp maybe_filter_premium(query, premium), do: where(query, [p], p.is_premium == ^premium)

  defp sanitize_like(term) do
    term
    |> String.replace("\\", "\\\\")
    |> String.replace("%", "\\%")
    |> String.replace("_", "\\_")
  end
end
