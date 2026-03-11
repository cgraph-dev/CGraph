defmodule CGraphWeb.API.V1.BadgeController do
  @moduledoc """
  Controller for badge cosmetic endpoints.

  Provides listing, detail, and per-user badge retrieval under `/api/v1/`.
  """
  use CGraphWeb, :controller
  import CGraphWeb.ControllerHelpers, only: [render_data: 2, render_error: 3]

  alias CGraph.Cosmetics

  action_fallback CGraphWeb.FallbackController

  @doc """
  GET /api/v1/badges
  Lists all active badges, optionally filtered by category or rarity.
  """
  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, params) do
    opts =
      []
      |> maybe_add(:category, params["category"])
      |> maybe_add(:rarity, params["rarity"])

    badges = Cosmetics.list_badges(opts)

    render_data(conn, %{
      badges: Enum.map(badges, &serialize_badge/1),
      total: length(badges)
    })
  end

  @doc """
  GET /api/v1/badges/:id
  Returns a single badge by ID.
  """
  @spec show(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def show(conn, %{"id" => id}) do
    case Cosmetics.get_badge(id) do
      nil -> render_error(conn, :not_found, "Badge not found")
      badge -> render_data(conn, serialize_badge(badge))
    end
  end

  @doc """
  GET /api/v1/users/:id/badges
  Returns badges owned by a specific user.
  """
  @spec user_badges(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def user_badges(conn, %{"id" => user_id}) do
    badges = Cosmetics.list_user_badges(user_id)

    render_data(conn, %{
      badges: Enum.map(badges, &serialize_user_badge/1),
      total: length(badges)
    })
  end

  # ==================== PRIVATE ====================

  defp serialize_badge(badge) do
    %{
      id: badge.id,
      slug: badge.slug,
      name: badge.name,
      description: badge.description,
      iconUrl: badge.icon_url,
      rarity: badge.rarity,
      category: badge.category,
      track: badge.track,
      unlockType: badge.unlock_type,
      nodesCost: badge.nodes_cost,
      stackable: badge.stackable,
      sortOrder: badge.sort_order
    }
  end

  defp serialize_user_badge(%{badge: badge} = entry) do
    %{
      inventoryId: entry.inventory_id,
      badge: serialize_badge(badge),
      equippedAt: entry.equipped_at,
      obtainedAt: entry.obtained_at,
      obtainedVia: entry.obtained_via
    }
  end

  defp maybe_add(opts, _key, nil), do: opts
  defp maybe_add(opts, key, value), do: [{key, value} | opts]
end
