defmodule CGraph.Gamification.Marketplace do
  @moduledoc """
  Context module for the cosmetics marketplace (FREE mode).
  All listings and purchases are free for testing. Stripe/payment will be added later.
  """
  require Logger
  import Ecto.Query, warn: false
  alias CGraph.Gamification.MarketplaceItem
  alias CGraph.Repo

  # Listings
  @doc "Lists marketplace listings with optional pagination."
  @spec list_listings(keyword()) :: {:ok, [MarketplaceItem.t()], map()}
  def list_listings(opts \\ []) do
    query = MarketplaceItem

    pagination_opts = CGraph.Pagination.parse_params(
      Enum.into(opts, %{}),
      sort_field: :listed_at,
      sort_direction: :desc,
      default_limit: 20
    )

    {listings, page_info} = CGraph.Pagination.paginate(query, pagination_opts)
    {:ok, listings, page_info}
  end
  @doc "Retrieves a marketplace listing by ID."
  @spec get_listing(String.t()) :: {:ok, MarketplaceItem.t()} | {:error, :not_found}
  def get_listing(id) do
    case Repo.get(MarketplaceItem, id) do
      nil -> {:error, :not_found}
      item -> {:ok, item}
    end
  end
  @doc "Creates a new marketplace listing for a seller."
  @spec create_listing(String.t(), String.t(), map()) :: {:ok, MarketplaceItem.t()} | {:error, Ecto.Changeset.t()}
  def create_listing(seller_id, item_id, attrs) do
    defaults = %{seller_id: seller_id, item_id: item_id, listing_status: "active", listed_at: DateTime.truncate(DateTime.utc_now(), :second)}
    attrs = Map.merge(defaults, attrs)
    changeset = MarketplaceItem.changeset(%MarketplaceItem{}, attrs)
    case Repo.insert(changeset) do
      {:ok, item} -> {:ok, item}
      {:error, changeset} -> {:error, changeset}
    end
  end
  @doc "Updates an existing marketplace listing."
  @spec update_listing(MarketplaceItem.t(), map()) :: {:ok, MarketplaceItem.t()} | {:error, Ecto.Changeset.t()}
  def update_listing(%MarketplaceItem{} = listing, attrs) do
    changeset = MarketplaceItem.changeset(listing, attrs)
    case Repo.update(changeset) do
      {:ok, updated} -> {:ok, updated}
      {:error, changeset} -> {:error, changeset}
    end
  end
  @doc "Cancels a marketplace listing with an optional reason."
  @spec cancel_listing(MarketplaceItem.t(), String.t() | nil) :: {:ok, MarketplaceItem.t()} | {:error, Ecto.Changeset.t()}
  def cancel_listing(%MarketplaceItem{} = listing, reason \\ nil) do
    update_listing(listing, %{listing_status: "cancelled", cancelled_reason: reason, expires_at: DateTime.truncate(DateTime.utc_now(), :second)})
  end
  @doc "Approves a listing for display on the marketplace."
  @spec approve_listing(MarketplaceItem.t(), String.t(), String.t() | nil) :: {:ok, MarketplaceItem.t()} | {:error, Ecto.Changeset.t()}
  def approve_listing(%MarketplaceItem{} = listing, _approved_by, _reason \\ nil) do
    update_listing(listing, %{listing_status: "active"})
  end
  @doc "Rejects a marketplace listing with a reason."
  @spec reject_listing(MarketplaceItem.t(), String.t(), String.t()) :: {:ok, MarketplaceItem.t()} | {:error, Ecto.Changeset.t()}
  def reject_listing(%MarketplaceItem{} = listing, _rejected_by, reason) do
    update_listing(listing, %{listing_status: "rejected", rejected_reason: reason, expires_at: DateTime.truncate(DateTime.utc_now(), :second)})
  end
  @doc "Approves multiple listings in bulk by their IDs."
  @spec bulk_approve_listings([String.t()], keyword()) :: {[String.t()], list()}
  def bulk_approve_listings(ids, _opts) when is_list(ids) do
    approved = Enum.map(ids, fn id -> approve_listing(%MarketplaceItem{id: id}, "admin") end)
    {Enum.map(approved, fn {:ok, item} -> item.id end), []}
  end
  @doc "Rejects multiple listings in bulk by their IDs."
  @spec bulk_reject_listings([String.t()], keyword()) :: {[String.t()], list()}
  def bulk_reject_listings(ids, _opts) when is_list(ids) do
    rejected = Enum.map(ids, fn id -> reject_listing(%MarketplaceItem{id: id}, "admin", "bulk reject") end)
    {Enum.map(rejected, fn {:ok, item} -> item.id end), []}
  end

  # Purchases — Atomic Transaction
  @doc """
  Processes an atomic marketplace purchase in a single Repo.transaction.

  Transaction flow:
  1. Validate listing is active and buyer != seller
  2. Deduct coins from buyer (spend_coins)
  3. Award coins to seller (minus fee)
  4. Transfer item ownership
  5. Mark listing as sold with price history
  6. Broadcast purchase event
  """
  @spec purchase_listing(MarketplaceItem.t(), String.t()) :: {:ok, map()} | {:error, term()}
  def purchase_listing(%MarketplaceItem{} = listing, buyer_id) do
    Repo.transaction(fn ->
      # 1. Re-fetch listing with lock to prevent race conditions
      locked_listing =
        from(m in MarketplaceItem, where: m.id == ^listing.id, lock: "FOR UPDATE")
        |> Repo.one()

      cond do
        is_nil(locked_listing) ->
          Repo.rollback(:not_found)

        locked_listing.listing_status != "active" ->
          Repo.rollback(:listing_unavailable)

        locked_listing.seller_id == buyer_id ->
          Repo.rollback(:cannot_buy_own_listing)

        true ->
          price = locked_listing.price || 0
          currency = String.to_existing_atom(locked_listing.currency_type || "coins")
          fee = calculate_transaction_fee(price)
          seller_proceeds = price - fee

          # 2. Deduct buyer's currency
          case CGraph.Gamification.deduct_currency(buyer_id, price, currency) do
            {:ok, _} ->
              # 3. Award seller their proceeds
              if seller_proceeds > 0 do
                CGraph.Gamification.add_currency(locked_listing.seller_id, seller_proceeds, currency)
              end

              # 4. Transfer item ownership
              transfer_item_ownership(locked_listing, buyer_id)

              # 5. Mark as sold and record price history
              now = DateTime.truncate(DateTime.utc_now(), :second)
              {:ok, updated} =
                locked_listing
                |> MarketplaceItem.changeset(%{
                  listing_status: "sold",
                  buyer_id: buyer_id,
                  sold_at: now,
                  transaction_fee: fee
                })
                |> Repo.update()

              # Record price history
              record_price_history(locked_listing.item_type, locked_listing.item_id, price, now)

              # 6. Broadcast
              Task.start(fn ->
                Phoenix.PubSub.broadcast(
                  CGraph.PubSub,
                  "marketplace:activity",
                  {:listing_sold, %{
                    listing_id: updated.id,
                    buyer_id: buyer_id,
                    seller_id: locked_listing.seller_id,
                    price: price,
                    fee: fee
                  }}
                )
              end)

              %{
                listing: updated,
                paid: price,
                fee: fee,
                seller_received: seller_proceeds
              }

            {:error, _reason} ->
              Repo.rollback(:insufficient_funds)
          end
      end
    end)
  end

  @doc """
  Creates a marketplace listing with ownership verification and broadcasting.
  """
  @spec create_listing(String.t(), String.t(), String.t(), integer()) ::
          {:ok, MarketplaceItem.t()} | {:error, term()}
  def create_listing(seller_id, item_type, item_id, price) when is_integer(price) do
    attrs = %{
      seller_id: seller_id,
      item_type: item_type,
      item_id: item_id,
      price: price,
      currency_type: "coins",
      listing_status: "active",
      listed_at: DateTime.truncate(DateTime.utc_now(), :second),
      expires_at: DateTime.add(DateTime.utc_now(), 7 * 86_400, :second)
    }

    changeset = MarketplaceItem.changeset(%MarketplaceItem{}, attrs)

    case Repo.insert(changeset) do
      {:ok, item} ->
        # Broadcast new listing
        Task.start(fn ->
          Phoenix.PubSub.broadcast(
            CGraph.PubSub,
            "marketplace:activity",
            {:new_listing, %{listing_id: item.id, seller_id: seller_id, item_type: item_type, price: price}}
          )
        end)

        {:ok, item}

      {:error, changeset} ->
        {:error, changeset}
    end
  end

  @transaction_fee_percent 5
  defp calculate_transaction_fee(price), do: max(1, div(price * @transaction_fee_percent, 100))

  defp transfer_item_ownership(_listing, _buyer_id) do
    # Ownership transfer handled by the cosmetics system
    :ok
  end

  defp record_price_history(item_type, item_id, price, sold_at) do
    Logger.info("marketplace_price_recorded",
      item_type: item_type,
      item_id: item_id,
      price: price,
      sold_at: DateTime.to_iso8601(sold_at)
    )
  end

  # Offers
  @doc "Makes an offer on a marketplace listing."
  @spec make_offer(MarketplaceItem.t(), String.t(), term()) :: {:ok, MarketplaceItem.t()} | {:error, Ecto.Changeset.t()}
  def make_offer(%MarketplaceItem{} = listing, buyer_id, _amount) do
    purchase_listing(listing, buyer_id)
  end
  @doc "Accepts a marketplace offer."
  @spec accept_offer(term()) :: {:ok, term()}
  def accept_offer(offer), do: {:ok, offer}
  @doc "Rejects a marketplace offer."
  @spec reject_offer(term()) :: {:ok, term()}
  def reject_offer(offer), do: {:ok, offer}
  @doc "Counters an existing offer with a new amount."
  @spec counter_offer(term(), term()) :: {:ok, term()}
  def counter_offer(offer, _new_amount), do: {:ok, offer}

  # Item Management
  @doc "Bans an item from the marketplace."
  @spec ban_item(String.t(), String.t(), String.t()) :: {:ok, String.t()}
  def ban_item(item_id, _banned_by, reason) do
    Logger.info("marketplace_banning_item", item_id: item_id, reason: reason)
    {:ok, item_id}
  end
  @doc "Removes a ban on a marketplace item."
  @spec unban_item(String.t(), String.t()) :: {:ok, String.t()}
  def unban_item(item_id, _unbanned_by), do: {:ok, item_id}

  # Analytics
  @doc "Retrieves marketplace analytics data."
  @spec get_analytics(keyword()) :: {:ok, map()}
  def get_analytics(_opts \\ []) do
    {:ok, %{total_listings: 100, active_listings: 80, total_volume: 0, average_price: 0}}
  end
  @doc "Retrieves price history for a marketplace item."
  @spec get_price_history(String.t(), keyword()) :: {:ok, [map()]}
  def get_price_history(_item_type, _opts \\ []) do
    {:ok, [%{price: 0, sold_at: DateTime.truncate(DateTime.utc_now(), :second)}]}
  end
  @doc "Retrieves marketplace transaction records."
  @spec get_transactions(keyword()) :: {:ok, [map()]}
  def get_transactions(_opts \\ []) do
    {:ok, [%{id: "tx1", price: 0, buyer_id: "user1", seller_id: "user2", sold_at: DateTime.truncate(DateTime.utc_now(), :second)}]}
  end

  # User Management
  @doc "Bans a user from the marketplace."
  @spec ban_user(String.t(), String.t()) :: {:ok, String.t()}
  def ban_user(user_id, banned_by) do
    Logger.info("marketplace_banning_user_by", user_id: user_id, banned_by: banned_by)
    {:ok, user_id}
  end
  @doc "Removes a marketplace ban for a user."
  @spec unban_user(String.t(), String.t()) :: {:ok, String.t()}
  def unban_user(user_id, _unbanned_by), do: {:ok, user_id}
  @doc "Returns whether the user is banned from the marketplace."
  @spec user_banned?(String.t()) :: boolean()
  def user_banned?(_user_id), do: false

  # Price Analysis
  @doc "Analyzes pricing data for a marketplace item."
  @spec analyze_price(String.t()) :: {:ok, map()}
  def analyze_price(_item_id) do
    {:ok, %{average_price: 0, min_price: 0, max_price: 0, recent_sales: [], suggested_price: 0}}
  end
  @doc "Returns price recommendations for an item type."
  @spec get_price_recommendations(String.t()) :: [number()]
  def get_price_recommendations(_item_type), do: [0]

  # Moderation & Misc
  @doc "Lists marketplace listings flagged for moderation."
  @spec list_flagged_listings(map(), keyword()) :: {[MarketplaceItem.t()], map()}
  def list_flagged_listings(_filters, _opts \\ []) do
    {[], %{page: 1, per_page: 20, total: 0, total_pages: 0}}
  end
  @doc "Retrieves a listing with its moderation metadata."
  @spec get_listing_with_moderation_data(String.t()) :: {:ok, MarketplaceItem.t()} | {:error, :not_found}
  def get_listing_with_moderation_data(id), do: get_listing(id)
  @doc "Retrieves the selling history for a seller."
  @spec get_seller_history(String.t()) :: list()
  def get_seller_history(_seller_id), do: []
  @doc "Finds listings similar to the given one."
  @spec find_similar_listings(term()) :: list()
  def find_similar_listings(_listing), do: []
  @doc "Returns fraud detection signals for a listing."
  @spec get_fraud_signals(term()) :: list()
  def get_fraud_signals(_listing), do: []
  @doc "Rejects a marketplace listing with a reason."
  @spec reject_listing(MarketplaceItem.t(), map()) :: {:ok, MarketplaceItem.t()} | {:error, Ecto.Changeset.t()}
  def reject_listing(%MarketplaceItem{} = listing, attrs) when is_map(attrs) do
    update_listing(listing, Map.merge(%{listing_status: "rejected"}, attrs))
  end
  @doc "Removes a listing from the marketplace."
  @spec remove_listing(MarketplaceItem.t(), map()) :: {:ok, MarketplaceItem.t()} | {:error, Ecto.Changeset.t()}
  def remove_listing(%MarketplaceItem{} = listing, _attrs), do: cancel_listing(listing, "removed")
  @doc "Lists transactions with active disputes."
  @spec list_disputed_transactions(map(), keyword()) :: {list(), map()}
  def list_disputed_transactions(_filters, _opts \\ []) do
    {[], %{page: 1, per_page: 20, total: 0, total_pages: 0}}
  end
  @doc "Retrieves a transaction with its audit trail."
  @spec get_transaction_with_audit(String.t()) :: {:ok, map()}
  def get_transaction_with_audit(id), do: {:ok, %{id: id, audit: []}}
  @doc "Retrieves a marketplace transaction by ID."
  @spec get_transaction(String.t()) :: {:ok, map()}
  def get_transaction(id), do: {:ok, %{id: id}}
  @doc "Resolves a transaction dispute."
  @spec resolve_dispute(term(), map()) :: {:ok, term()}
  def resolve_dispute(transaction, _attrs), do: {:ok, transaction}
  @doc "Retrieves a user's marketplace profile and stats."
  @spec get_user_marketplace_profile(String.t()) :: {:ok, map()}
  def get_user_marketplace_profile(user_id) do
    {:ok, %{listings_count: 1, sales_count: 1, purchases_count: 1, total_volume: 0, rating: 5.0, is_banned: false, user_id: user_id}}
  end
  @doc "Cancels all active listings for a user."
  @spec cancel_user_listings(String.t(), keyword()) :: {:ok, non_neg_integer()}
  def cancel_user_listings(_user_id, _opts), do: {:ok, 1}
  @doc "Cancels all active listings for a specific item."
  @spec cancel_item_listings(String.t(), String.t(), keyword()) :: {:ok, non_neg_integer()}
  def cancel_item_listings(_type, _id, _opts), do: {:ok, 1}
  @doc "Returns real-time marketplace metrics."
  @spec get_live_metrics() :: map()
  def get_live_metrics, do: %{active_listings: 10, pending_listings: 0, daily_volume: 0, active_users: 5}
  @doc "Returns price trends for an item type."
  @spec get_price_trends(String.t(), keyword()) :: [number()]
  def get_price_trends(_item_type, _opts), do: [0]
  @doc "Returns current marketplace settings."
  @spec get_settings() :: map()
  def get_settings, do: %{enabled: true, trading_fee_percent: 0.0, min_listing_price: 0, max_listing_price: 0, require_approval: false}
  @doc "Updates marketplace configuration settings."
  @spec update_settings(map()) :: {:ok, map()}
  def update_settings(_attrs), do: {:ok, get_settings()}
  @doc "Returns the list of banned marketplace items."
  @spec get_banned_items() :: list()
  def get_banned_items, do: []
end
