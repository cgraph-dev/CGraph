defmodule CGraph.Gamification.TitleShopSystem do
  @moduledoc """
  Title management (list, unlock, equip, purchase) and shop item operations.
  """

  import Ecto.Query, warn: false
  alias CGraph.Accounts.User
  alias CGraph.Gamification.{ShopItem, Title, UserPurchase, UserTitle}
  alias CGraph.Repo

  # ==================== TITLES ====================

  @doc "List all available titles."
  @spec list_titles() :: [Title.t()]
  def list_titles do
    Title
    |> order_by([t], [t.sort_order, t.name])
    |> Repo.all()
  end

  @doc "Get a user's unlocked titles."
  @spec list_user_titles(binary()) :: [UserTitle.t()]
  def list_user_titles(user_id) do
    from(ut in UserTitle,
      where: ut.user_id == ^user_id,
      join: t in Title, on: ut.title_id == t.id,
      preload: [title: t],
      order_by: [desc: ut.unlocked_at])
    |> Repo.all()
  end

  @doc "Unlock a title for a user by slug."
  @spec unlock_title_by_slug(User.t(), String.t()) :: {:ok, UserTitle.t()} | {:error, atom()}
  def unlock_title_by_slug(%User{} = user, title_slug) do
    case Repo.get_by(Title, slug: title_slug) do
      nil -> {:error, :title_not_found}
      title ->
        case Repo.get_by(UserTitle, user_id: user.id, title_id: title.id) do
          nil ->
            %UserTitle{}
            |> UserTitle.changeset(%{user_id: user.id, title_id: title.id, unlocked_at: DateTime.utc_now()})
            |> Repo.insert()
          existing -> {:ok, existing}
        end
    end
  end

  @doc "Unlock a title by ID."
  @spec unlock_title(binary(), binary()) :: {:ok, UserTitle.t()} | {:error, atom()}
  def unlock_title(user_id, title_id) do
    case Repo.get(Title, title_id) do
      nil -> {:error, :title_not_found}
      _title ->
        %UserTitle{}
        |> UserTitle.changeset(%{user_id: user_id, title_id: title_id})
        |> Repo.insert(on_conflict: :nothing)
    end
  end

  @doc "Check and unlock titles earned at a given level."
  @spec check_level_titles(User.t(), non_neg_integer()) :: list()
  def check_level_titles(user, new_level) do
    level_titles = from(t in Title, where: t.unlock_type == "level") |> Repo.all()

    for title <- level_titles do
      required_level = String.to_integer(title.unlock_requirement || "1")
      if new_level >= required_level, do: unlock_title_by_slug(user, title.slug)
    end
  end

  @doc "Equip a title for a user."
  @spec equip_title(binary(), binary()) :: {:ok, User.t()} | {:error, atom()}
  def equip_title(user_id, title_id) do
    # get! safe: user_id from authenticated session via controller
    user = Repo.get!(User, user_id)

    case Repo.get_by(UserTitle, user_id: user_id, title_id: title_id) do
      nil -> {:error, :not_owned}
      _ ->
        user
        |> Ecto.Changeset.change(%{equipped_title_id: title_id})
        |> Repo.update()
    end
  end

  @doc "Purchase a title with coins."
  @spec purchase_title(User.t(), binary()) :: {:ok, User.t()} | {:error, atom()}
  def purchase_title(%User{} = user, title_id) do
    case Repo.get(Title, title_id) do
      nil -> {:error, :not_found}
      title ->
        cond do
          not title.is_purchasable -> {:error, :not_purchasable}
          user.coins < title.coin_cost -> {:error, :insufficient_funds}
          Repo.get_by(UserTitle, user_id: user.id, title_id: title.id) != nil -> {:error, :already_owned}
          true ->
            Repo.transaction(fn ->
              {:ok, updated_user} = CGraph.Gamification.spend_coins(user, title.coin_cost, "purchase",
                description: "Purchased title: #{title.name}", reference_type: "title", reference_id: title.id)
              {:ok, _} = unlock_title_by_slug(updated_user, title.slug)
              updated_user
            end)
        end
    end
  end

  # ==================== SHOP ====================

  @doc "List all available shop items, optionally filtered by category."
  @spec list_shop_items(keyword()) :: [ShopItem.t()]
  def list_shop_items(opts \\ []) do
    category = Keyword.get(opts, :category)

    query = from s in ShopItem,
      where: s.is_active == true,
      order_by: [s.category, s.sort_order]

    query = if category, do: where(query, [s], s.category == ^category), else: query
    Repo.all(query)
  end

  @doc "Get a shop item by ID."
  @spec get_shop_item(binary()) :: ShopItem.t() | nil
  def get_shop_item(id), do: Repo.get(ShopItem, id)

  @doc "Purchase a shop item."
  @spec purchase_shop_item(User.t(), binary(), pos_integer()) :: {:ok, User.t()} | {:error, atom()}
  def purchase_shop_item(%User{} = user, item_id, quantity \\ 1) do
    case Repo.get(ShopItem, item_id) do
      nil -> {:error, :not_found}
      item ->
        total_cost = item.coin_cost * quantity

        cond do
          not ShopItem.available?(item) -> {:error, :not_available}
          item.premium_only and user.subscription_tier == "free" -> {:error, :premium_required}
          user.coins < total_cost -> {:error, :insufficient_funds}
          item.type == "permanent" and user_owns_item?(user.id, item_id) -> {:error, :already_owned}
          true ->
            Repo.transaction(fn ->
              {:ok, updated_user} = CGraph.Gamification.spend_coins(user, total_cost, "purchase",
                description: "Purchased: #{item.name} x#{quantity}", reference_type: "shop_item", reference_id: item_id)

              {:ok, _purchase} = %UserPurchase{}
                |> UserPurchase.changeset(%{
                  user_id: user.id, item_id: item_id, quantity: quantity,
                  coin_spent: total_cost, purchased_at: DateTime.utc_now()
                })
                |> Repo.insert()

              {:ok, _} = item
                |> Ecto.Changeset.change(%{sold_count: item.sold_count + quantity})
                |> Repo.update()

              updated_user
            end)
        end
    end
  end

  @doc "Get a user's purchased items."
  @spec list_user_purchases(binary(), keyword()) :: [UserPurchase.t()]
  def list_user_purchases(user_id, opts \\ []) do
    category = Keyword.get(opts, :category)

    query = from p in UserPurchase,
      where: p.user_id == ^user_id,
      join: i in ShopItem, on: p.item_id == i.id,
      preload: [item: i],
      order_by: [desc: p.purchased_at]

    query = if category, do: where(query, [p, i], i.category == ^category), else: query
    Repo.all(query)
  end

  # Private helpers

  defp user_owns_item?(user_id, item_id) do
    from(p in UserPurchase, where: p.user_id == ^user_id and p.item_id == ^item_id)
    |> Repo.exists?()
  end
end
