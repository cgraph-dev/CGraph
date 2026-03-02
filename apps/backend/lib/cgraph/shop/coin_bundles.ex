defmodule CGraph.Shop.CoinBundles do
  @moduledoc """
  Defines purchasable coin bundles with Stripe price IDs.

  Bundle pricing is defined server-side to prevent client-side tampering.
  Stripe price IDs should be configured via environment variables in production
  (created in the Stripe dashboard). For dev/test, `nil` enables demo mode.

  ## Bundles

  | ID       | Coins | Price  | Bonus      |
  |----------|-------|--------|------------|
  | starter  | 100   | $0.99  | —          |
  | popular  | 500   | $3.99  | 20% bonus  |
  | mega     | 1200  | $7.99  | 50% bonus  |
  | ultra    | 3000  | $14.99 | 100% bonus |
  """

  @type bundle :: %{
          id: String.t(),
          coins: pos_integer(),
          price_cents: pos_integer(),
          stripe_price_id: String.t() | nil,
          label: String.t(),
          bonus: String.t() | nil
        }

  @bundles [
    %{
      id: "starter",
      coins: 100,
      price_cents: 99,
      stripe_price_id: System.get_env("STRIPE_PRICE_COINS_STARTER"),
      label: "Starter Pack",
      bonus: nil
    },
    %{
      id: "popular",
      coins: 500,
      price_cents: 399,
      stripe_price_id: System.get_env("STRIPE_PRICE_COINS_POPULAR"),
      label: "Popular Pack",
      bonus: "20% bonus"
    },
    %{
      id: "mega",
      coins: 1200,
      price_cents: 799,
      stripe_price_id: System.get_env("STRIPE_PRICE_COINS_MEGA"),
      label: "Mega Pack",
      bonus: "50% bonus"
    },
    %{
      id: "ultra",
      coins: 3000,
      price_cents: 1499,
      stripe_price_id: System.get_env("STRIPE_PRICE_COINS_ULTRA"),
      label: "Ultra Pack",
      bonus: "100% bonus"
    }
  ]

  @doc "Returns all available coin bundles."
  @spec get_bundles() :: [bundle()]
  def get_bundles, do: @bundles

  @doc "Returns a specific bundle by ID, or nil if not found."
  @spec get_bundle(String.t()) :: bundle() | nil
  def get_bundle(id) when is_binary(id) do
    Enum.find(@bundles, &(&1.id == id))
  end

  def get_bundle(_), do: nil
end
