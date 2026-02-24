defmodule CGraphWeb.TitleJSON do
  @moduledoc """
  JSON rendering for title endpoints.
  """

  @doc "Renders a list of resources as JSON."
  @spec index(map()) :: map()
  def index(%{titles: titles}) do
    %{data: Enum.map(titles, &render_title_with_ownership/1), meta: %{total: length(titles)}}
  end

  @doc "Renders owned titles as JSON."
  @spec owned(map()) :: map()
  def owned(%{user_titles: user_titles, equipped_id: equipped_id}) do
    %{
      data: %{
        titles: Enum.map(user_titles, &render_user_title/1),
        equipped_id: equipped_id
      },
      meta: %{total: length(user_titles)}
    }
  end

  # Private helpers

  defp render_title_with_ownership(item) do
    %{
      id: item.title.id,
      slug: item.title.slug,
      name: item.title.name,
      description: item.title.description,
      color: item.title.color,
      rarity: item.title.rarity,
      unlock_type: item.title.unlock_type,
      unlock_requirement: item.title.unlock_requirement,
      is_purchasable: item.title.is_purchasable,
      coin_cost: item.title.coin_cost,
      owned: item.owned,
      equipped: item.equipped
    }
  end

  defp render_user_title(user_title) do
    %{
      id: user_title.title.id,
      slug: user_title.title.slug,
      name: user_title.title.name,
      description: user_title.title.description,
      color: user_title.title.color,
      rarity: user_title.title.rarity,
      unlocked_at: user_title.unlocked_at
    }
  end
end
