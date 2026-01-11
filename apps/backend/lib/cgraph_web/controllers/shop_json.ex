defmodule CgraphWeb.ShopJSON do
  @moduledoc """
  JSON rendering for shop endpoints.
  """

  def index(%{items: items}) do
    %{data: Enum.map(items, &render_item/1)}
  end

  def show(%{item: item}) do
    %{data: render_item(item)}
  end

  def purchases(%{purchases: purchases}) do
    %{data: Enum.map(purchases, &render_purchase/1)}
  end

  # Private helpers

  defp render_item(item) do
    %{
      id: item.id,
      slug: item.slug,
      name: item.name,
      description: item.description,
      category: item.category,
      type: item.type,
      icon: item.icon,
      preview_url: item.preview_url,
      coin_cost: item.coin_cost,
      premium_only: item.premium_only,
      is_active: item.is_active,
      limited_quantity: item.limited_quantity,
      sold_count: item.sold_count,
      available: is_available?(item)
    }
  end

  defp render_purchase(purchase) do
    %{
      id: purchase.id,
      quantity: purchase.quantity,
      coin_spent: purchase.coin_spent,
      purchased_at: purchase.purchased_at,
      item: render_item(purchase.item)
    }
  end

  defp is_available?(%{is_active: false}), do: false
  defp is_available?(%{limited_quantity: nil}), do: true
  defp is_available?(%{limited_quantity: qty, sold_count: sold}), do: sold < qty
end
