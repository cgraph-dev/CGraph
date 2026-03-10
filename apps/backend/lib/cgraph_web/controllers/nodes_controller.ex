defmodule CGraphWeb.NodesController do
  @moduledoc """
  Controller for the Nodes virtual currency system.

  Handles wallet queries, node bundle purchases (via Stripe Checkout),
  tipping, content unlocking, and withdrawal requests.
  """
  use CGraphWeb, :controller

  alias CGraph.Nodes
  alias CGraph.Nodes.NodeBundles

  require Logger

  action_fallback CGraphWeb.FallbackController

  @doc """
  GET /api/v1/nodes/wallet
  Returns the user's node wallet (balance, pending, lifetime stats).
  """
  def wallet(conn, _params) do
    user = conn.assigns.current_user
    {:ok, wallet} = Nodes.get_or_create_wallet(user.id)

    conn
    |> put_status(:ok)
    |> render(:wallet, wallet: wallet)
  end

  @doc """
  GET /api/v1/nodes/transactions
  Returns transaction history with optional type filter and pagination.
  """
  def transactions(conn, params) do
    user = conn.assigns.current_user
    type = params["type"]
    limit = min(String.to_integer(params["limit"] || "50"), 100)
    offset = String.to_integer(params["offset"] || "0")

    transactions = Nodes.list_transactions(user.id, type: type, limit: limit, offset: offset)

    conn
    |> put_status(:ok)
    |> render(:transactions, transactions: transactions)
  end

  @doc """
  GET /api/v1/nodes/bundles
  Lists all purchasable node bundles.
  """
  def bundles(conn, _params) do
    bundles = NodeBundles.get_bundles()

    conn
    |> put_status(:ok)
    |> render(:bundles, bundles: bundles)
  end

  @doc """
  POST /api/v1/nodes/checkout
  Creates a Stripe Checkout session for a node bundle purchase.
  Expects: %{"bundle_id" => id}
  """
  def checkout(conn, %{"bundle_id" => bundle_id}) do
    user = conn.assigns.current_user

    case NodeBundles.get_bundle(bundle_id) do
      nil ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "bundle_not_found"})

      bundle ->
        app_url = Application.get_env(:cgraph_web, :app_url, "https://cgraph.app")

        price_cents = round(bundle.price * 100)

        checkout_params = %{
          mode: "payment",
          payment_method_types: ["card"],
          line_items: [
            %{
              price_data: %{
                currency: "eur",
                unit_amount: price_cents,
                product_data: %{
                  name: "#{bundle.name} — #{bundle.nodes} Nodes"
                }
              },
              quantity: 1
            }
          ],
          customer_email: user.email,
          success_url: "#{app_url}/nodes?session_id={CHECKOUT_SESSION_ID}&status=success",
          cancel_url: "#{app_url}/nodes?status=cancelled",
          metadata: %{
            type: "node_purchase",
            user_id: user.id,
            bundle_id: bundle.id
          }
        }

        case Stripe.Checkout.Session.create(checkout_params) do
          {:ok, session} ->
            conn
            |> put_status(:ok)
            |> json(%{success: true, checkout_url: session.url})

          {:error, %Stripe.Error{message: message}} ->
            Logger.error("nodes_checkout_failed",
              error: message,
              bundle_id: bundle_id,
              user_id: user.id
            )

            conn
            |> put_status(:service_unavailable)
            |> json(%{error: "checkout_failed", message: message})
        end
    end
  end

  @doc """
  POST /api/v1/nodes/tip
  Send a tip to another user.
  Expects: %{"recipient_id" => id, "amount" => integer}
  """
  def tip(conn, %{"recipient_id" => recipient_id, "amount" => amount}) do
    user = conn.assigns.current_user
    amount = if is_binary(amount), do: String.to_integer(amount), else: amount

    case Nodes.tip(user.id, recipient_id, amount) do
      {:ok, transaction} ->
        conn
        |> put_status(:ok)
        |> render(:transaction, transaction: transaction)

      {:error, :insufficient_balance} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: "insufficient_balance"})

      {:error, :self_tip} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: "cannot_tip_yourself"})

      {:error, _reason} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: "tip_failed"})
    end
  end

  @doc """
  POST /api/v1/nodes/unlock
  Unlock gated content (thread).
  Expects: %{"thread_id" => id}
  """
  def unlock(conn, %{"thread_id" => thread_id}) do
    user = conn.assigns.current_user

    case Nodes.unlock_content(user.id, thread_id) do
      {:ok, transaction} ->
        conn
        |> put_status(:ok)
        |> render(:transaction, transaction: transaction)

      {:error, :insufficient_balance} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: "insufficient_balance"})

      {:error, :already_unlocked} ->
        conn
        |> put_status(:conflict)
        |> json(%{error: "already_unlocked"})

      {:error, :not_gated} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: "content_not_gated"})

      {:error, :not_found} ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "thread_not_found"})

      {:error, _reason} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: "unlock_failed"})
    end
  end

  @doc """
  POST /api/v1/nodes/withdraw
  Request a withdrawal.
  Expects: %{"nodes_amount" => integer}
  """
  def withdraw(conn, %{"nodes_amount" => nodes_amount}) do
    user = conn.assigns.current_user
    nodes_amount = if is_binary(nodes_amount), do: String.to_integer(nodes_amount), else: nodes_amount

    case Nodes.request_withdrawal(user.id, nodes_amount) do
      {:ok, withdrawal} ->
        conn
        |> put_status(:ok)
        |> render(:withdrawal, withdrawal: withdrawal)

      {:error, :insufficient_balance} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: "insufficient_balance"})

      {:error, :minimum_not_met} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: "minimum_not_met", minimum: 1000})

      {:error, :no_wallet} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: "no_wallet"})

      {:error, _reason} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: "withdrawal_failed"})
    end
  end
end
