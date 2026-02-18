defmodule CGraphWeb.CoinsController do
  @moduledoc """
  Controller for coin balance and transactions.

  ## Security

  - All endpoints require authentication
  - Pagination parameters are validated and safely parsed
  """
  use CGraphWeb, :controller

  import CGraphWeb.Helpers.ParamParser

  alias CGraph.Gamification

  action_fallback CGraphWeb.FallbackController

  @max_limit 100

  @doc """
  GET /api/v1/coins
  Get current coin balance.
  """
  def balance(conn, _params) do
    user = conn.assigns.current_user

    conn
    |> put_status(:ok)
    |> json(%{
      coins: user.coins,
      subscription_tier: user.subscription_tier,
      streak_days: user.streak_days
    })
  end

  @doc """
  GET /api/v1/coins/history
  Get coin transaction history using cursor-based pagination.

  ## Parameters

  - `limit` - Max results to return (1-100, default: 50)
  - `cursor` - Opaque cursor for pagination
  """
  def history(conn, params) do
    user = conn.assigns.current_user
    limit = parse_int(params["limit"], 50, min: 1, max: @max_limit)
    cursor = params["cursor"]

    transactions = Gamification.list_coin_transactions(user.id, limit: limit, cursor: cursor)

    conn
    |> put_status(:ok)
    |> render(:history, transactions: transactions)
  end

  @doc """
  GET /api/v1/coins/packages
  List available coin purchase packages (for real money).
  """
  def packages(conn, _params) do
    user = conn.assigns.current_user

    # Define coin packages with bonus for premium users
    base_packages = [
      %{id: "small", coins: 500, price: 4.99, currency: "USD"},
      %{id: "medium", coins: 1200, price: 9.99, currency: "USD", popular: true},
      %{id: "large", coins: 2500, price: 19.99, currency: "USD"},
      %{id: "huge", coins: 6500, price: 49.99, currency: "USD", best_value: true}
    ]

    # Premium users get 20% bonus coins
    bonus_multiplier = case user.subscription_tier do
      "premium" -> 1.2
      "enterprise" -> 1.3
      _ -> 1.0
    end

    packages = Enum.map(base_packages, fn pkg ->
      bonus = round(pkg.coins * (bonus_multiplier - 1))
      Map.merge(pkg, %{
        bonus_coins: bonus,
        total_coins: pkg.coins + bonus
      })
    end)

    conn
    |> put_status(:ok)
    |> json(%{packages: packages})
  end

  @doc """
  GET /api/v1/coins/earn
  Get ways to earn coins.
  """
  def earn_methods(conn, _params) do
    methods = [
      %{
        id: "daily_login",
        name: "Daily Login",
        description: "Log in every day to earn coins",
        coins: "10-100",
        frequency: "daily"
      },
      %{
        id: "quests",
        name: "Complete Quests",
        description: "Finish daily and weekly quests",
        coins: "10-100",
        frequency: "varies"
      },
      %{
        id: "achievements",
        name: "Unlock Achievements",
        description: "Earn coins when you unlock achievements",
        coins: "10-5000",
        frequency: "one-time"
      },
      %{
        id: "level_up",
        name: "Level Up",
        description: "Gain coins when you reach new levels",
        coins: "50",
        frequency: "per level"
      }
    ]

    conn
    |> put_status(:ok)
    |> json(%{methods: methods})
  end
end
