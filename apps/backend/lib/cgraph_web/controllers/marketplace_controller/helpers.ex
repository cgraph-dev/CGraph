defmodule CGraphWeb.MarketplaceController.Helpers do
  @moduledoc """
  Helper functions for the marketplace controller.

  Contains validation, item ownership, currency, transfer,
  statistics, and serialization logic.
  """
  import Ecto.Query, warn: false

  alias CGraph.Gamification
  alias CGraph.Gamification.MarketplaceItem
  alias CGraph.Repo

  @spec validate_item_type(String.t()) :: {:ok, String.t()} | {:error, String.t()}
  def validate_item_type(type) when type in ~w(avatar_border profile_theme chat_effect title badge) do
    {:ok, type}
  end
  def validate_item_type(_), do: {:error, "Invalid item type"}

  @spec get_owned_item(String.t(), String.t(), String.t()) :: {:ok, term()} | {:error, String.t()}
  def get_owned_item(user_id, item_type, item_id) do
    # Check ownership based on item type
    owned = case item_type do
      "avatar_border" ->
        Repo.get_by(Gamification.UserAvatarBorder, user_id: user_id, border_id: item_id)
      "profile_theme" ->
        Repo.get_by(Gamification.UserProfileTheme, user_id: user_id, theme_id: item_id)
      "chat_effect" ->
        Repo.get_by(Gamification.UserChatEffect, user_id: user_id, effect_id: item_id)
      _ -> nil
    end

    if owned do
      # Get the actual item details
      item = case item_type do
        "avatar_border" -> Repo.get(Gamification.AvatarBorder, item_id)
        "profile_theme" -> Repo.get(Gamification.ProfileTheme, item_id)
        "chat_effect" -> Repo.get(Gamification.ChatEffect, item_id)
        _ -> nil
      end

      if item, do: {:ok, item}, else: {:error, "Item not found"}
    else
      {:error, "You don't own this item"}
    end
  end

  @spec check_not_already_listed(String.t(), String.t()) :: {:ok, :not_listed} | {:error, String.t()}
  def check_not_already_listed(item_id, item_type) do
    existing = Repo.get_by(MarketplaceItem,
      item_id: item_id,
      item_type: item_type,
      listing_status: "active"
    )

    if existing, do: {:error, "Item is already listed"}, else: {:ok, :not_listed}
  end

  @spec validate_price(integer() | String.t(), String.t()) :: {:ok, integer()} | {:error, String.t()}
  def validate_price(price, rarity) when is_integer(price) do
    recommended = MarketplaceItem.recommended_price_for_rarity(rarity)

    cond do
      price < recommended.min -> {:error, "Price too low (minimum: #{recommended.min})"}
      price > recommended.max -> {:error, "Price too high (maximum: #{recommended.max})"}
      true -> {:ok, price}
    end
  end
  def validate_price(price, rarity) when is_binary(price) do
    validate_price(String.to_integer(price), rarity)
  end
  def validate_price(_, _), do: {:error, "Invalid price"}

  @spec calculate_listing_fee(integer()) :: integer()
  def calculate_listing_fee(suggested_price) do
    # 1% listing fee, minimum 10 coins
    max(round(suggested_price * 0.01), 10)
  end

  @spec transfer_item(MarketplaceItem.t(), String.t()) :: term()
  def transfer_item(listing, buyer_id) do
    case listing.item_type do
      "avatar_border" ->
        # Update ownership
        from(ub in Gamification.UserAvatarBorder,
          where: ub.user_id == ^listing.seller_id and ub.border_id == ^listing.item_id
        )
        |> Repo.update_all(set: [user_id: buyer_id, is_equipped: false])

      "profile_theme" ->
        from(ut in Gamification.UserProfileTheme,
          where: ut.user_id == ^listing.seller_id and ut.theme_id == ^listing.item_id
        )
        |> Repo.update_all(set: [user_id: buyer_id, is_active: false])

      "chat_effect" ->
        from(ue in Gamification.UserChatEffect,
          where: ue.user_id == ^listing.seller_id and ue.effect_id == ^listing.item_id
        )
        |> Repo.update_all(set: [user_id: buyer_id, is_active: false])

      _ -> :ok
    end
  end

  @spec get_market_stats() :: map()
  def get_market_stats do
    %{
      totalListings: Repo.aggregate(from(m in MarketplaceItem, where: m.listing_status == "active"), :count),
      totalSold: Repo.aggregate(from(m in MarketplaceItem, where: m.listing_status == "sold"), :count),
      averagePrice: Repo.aggregate(from(m in MarketplaceItem, where: m.listing_status == "sold"), :avg, :price) || 0
    }
  end

  @spec get_price_history(String.t(), String.t()) :: [map()]
  def get_price_history(item_type, item_id) do
    from(m in MarketplaceItem,
      where: m.item_type == ^item_type and m.item_id == ^item_id and m.listing_status == "sold",
      order_by: [desc: m.sold_at],
      limit: 10,
      select: %{price: m.price, sold_at: m.sold_at}
    )
    |> Repo.all()
  end

  @spec calculate_user_totals(String.t()) :: map()
  def calculate_user_totals(user_id) do
    sells = from(m in MarketplaceItem,
      where: m.seller_id == ^user_id and m.listing_status == "sold",
      select: %{
        count: count(m.id),
        total: sum(m.price),
        fees: sum(fragment("? * ?", m.price, m.transaction_fee_percent))
      }
    ) |> Repo.one()

    buys = from(m in MarketplaceItem,
      where: m.buyer_id == ^user_id and m.listing_status == "sold",
      select: %{count: count(m.id), total: sum(m.price)}
    ) |> Repo.one()

    %{
      sells: %{
        count: sells.count || 0,
        total: sells.total || 0,
        fees: sells.fees || 0,
        proceeds: (sells.total || 0) - (sells.fees || 0)
      },
      buys: %{
        count: buys.count || 0,
        total: buys.total || 0
      }
    }
  end

  @spec format_errors(Ecto.Changeset.t()) :: map()
  def format_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Enum.reduce(opts, msg, fn {key, value}, acc ->
        String.replace(acc, "%{#{key}}", to_string(value))
      end)
    end)
  end

  # ==================== SERIALIZERS ====================

  @spec serialize_listing(MarketplaceItem.t()) :: map()
  def serialize_listing(listing) do
    %{
      id: listing.id,
      itemType: listing.item_type,
      itemId: listing.item_id,
      status: listing.listing_status,
      price: listing.price,
      currency: listing.currency_type,
      itemName: listing.item_name,
      itemRarity: listing.item_rarity,
      itemPreviewUrl: listing.item_preview_url,
      acceptsTrades: listing.accepts_trades,
      listedAt: listing.listed_at,
      expiresAt: listing.expires_at,
      soldAt: listing.sold_at,
      seller: assoc_loaded?(listing, :seller) && %{
        id: listing.seller.id,
        username: listing.seller.username,
        displayName: listing.seller.display_name,
        avatarUrl: listing.seller.avatar_url
      },
      buyer: assoc_loaded?(listing, :buyer) && %{
        id: listing.buyer.id,
        username: listing.buyer.username
      }
    }
  end

  @spec assoc_loaded?(struct(), atom()) :: boolean()
  def assoc_loaded?(struct, field) do
    case Map.get(struct, field) do
      %Ecto.Association.NotLoaded{} -> false
      nil -> false
      _ -> true
    end
  end

  @spec serialize_listing_detailed(MarketplaceItem.t()) :: map()
  def serialize_listing_detailed(listing) do
    serialize_listing(listing)
    |> Map.merge(%{
      originalPrice: listing.original_price,
      listingFee: listing.listing_fee,
      transactionFee: MarketplaceItem.calculate_fee(listing),
      itemMetadata: listing.item_metadata,
      tradePreferences: listing.trade_preferences
    })
  end
end
