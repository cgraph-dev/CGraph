defmodule CGraphWeb.CoinShopController do
  @moduledoc """
  API controller for coin bundle purchases.

  Provides endpoints for:
  - Listing available coin bundles with server-side pricing
  - Creating Stripe Checkout sessions for one-time coin purchases

  Routes are mounted under `/api/v1/shop` (level-gated at level 8)
  alongside the existing ShopController.
  """

  use CGraphWeb, :controller

  import CGraphWeb.ControllerHelpers, only: [render_data: 2]

  alias CGraph.Guardian
  alias CGraph.Shop.{CoinBundles, CoinCheckout}

  action_fallback CGraphWeb.FallbackController

  @doc """
  Lists all available coin bundles with prices.

  GET /api/v1/shop/bundles
  """
  @spec bundles(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def bundles(conn, _params) do
    bundles =
      CoinBundles.get_bundles()
      |> Enum.map(fn bundle ->
        %{
          id: bundle.id,
          coins: bundle.coins,
          price_cents: bundle.price_cents,
          label: bundle.label,
          bonus: bundle.bonus
        }
      end)

    render_data(conn, %{bundles: bundles})
  end

  @doc """
  Creates a Stripe Checkout session for a coin bundle purchase.

  POST /api/v1/shop/purchase-coins
  Body: {"bundle_id": "popular"}
  Returns: {"data": {"checkout_url": "https://checkout.stripe.com/..."}}
  """
  @spec checkout(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def checkout(conn, %{"bundle_id" => bundle_id}) do
    user = Guardian.Plug.current_resource(conn)

    case CoinCheckout.create_checkout_session(user, bundle_id) do
      {:ok, %{checkout_url: url, session_id: _session_id}} ->
        render_data(conn, %{checkout_url: url})

      {:error, :invalid_bundle} ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: "Invalid bundle ID"})

      {:error, reason} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: "Failed to create checkout session", details: inspect(reason)})
    end
  end

  def checkout(conn, _params) do
    conn
    |> put_status(:bad_request)
    |> json(%{error: "Missing required parameter: bundle_id"})
  end
end
