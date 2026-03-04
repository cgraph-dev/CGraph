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

  require Logger

  @bundle_definitions [
    %{
      id: "starter",
      coins: 100,
      price_cents: 99,
      stripe_env_key: :stripe_price_coins_starter,
      label: "Starter Pack",
      bonus: nil
    },
    %{
      id: "popular",
      coins: 500,
      price_cents: 399,
      stripe_env_key: :stripe_price_coins_popular,
      label: "Popular Pack",
      bonus: "20% bonus"
    },
    %{
      id: "mega",
      coins: 1200,
      price_cents: 799,
      stripe_env_key: :stripe_price_coins_mega,
      label: "Mega Pack",
      bonus: "50% bonus"
    },
    %{
      id: "ultra",
      coins: 3000,
      price_cents: 1499,
      stripe_env_key: :stripe_price_coins_ultra,
      label: "Ultra Pack",
      bonus: "100% bonus"
    }
  ]

  @doc "Returns all available coin bundles with Stripe price IDs resolved at runtime."
  @spec get_bundles() :: [bundle()]
  def get_bundles do
    coin_prices = Application.get_env(:cgraph, :stripe_coin_prices, %{})

    Enum.map(@bundle_definitions, fn bundle ->
      stripe_price_id = Map.get(coin_prices, bundle.stripe_env_key)

      bundle
      |> Map.delete(:stripe_env_key)
      |> Map.put(:stripe_price_id, stripe_price_id)
    end)
  end

  @doc "Returns a specific bundle by ID, or nil if not found."
  @spec get_bundle(String.t()) :: bundle() | nil
  def get_bundle(id) when is_binary(id) do
    Enum.find(get_bundles(), &(&1.id == id))
  end

  def get_bundle(_), do: nil

  @doc "Validates that all Stripe coin price IDs are configured. Logs warnings for missing."
  @spec validate_config!() :: :ok
  def validate_config! do
    coin_prices = Application.get_env(:cgraph, :stripe_coin_prices, %{})

    Enum.each(@bundle_definitions, fn bundle ->
      unless Map.get(coin_prices, bundle.stripe_env_key) do
        Logger.warning("Missing Stripe price ID for coin bundle",
          bundle: bundle.id,
          config_key: bundle.stripe_env_key
        )
      end
    end)

    :ok
  end
end
