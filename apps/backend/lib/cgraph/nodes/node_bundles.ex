defmodule CGraph.Nodes.NodeBundles do
  @moduledoc """
  Defines purchasable node bundles with EUR pricing.

  Bundle pricing:
  | ID       | Nodes  | Price  | Bonus |
  |----------|--------|--------|-------|
  | starter  | 500    | €4.99  | —     |
  | popular  | 1,200  | €9.99  | +20%  |
  | creator  | 2,800  | €19.99 | +40%  |
  | pro      | 6,500  | €39.99 | +63%  |
  | ultimate | 17,000 | €99.99 | +70%  |
  """

  @type bundle :: %{
          id: String.t(),
          name: String.t(),
          nodes: pos_integer(),
          price_cents: pos_integer(),
          price_eur: float(),
          bonus_percent: non_neg_integer(),
          popular: boolean(),
          stripe_price_id: String.t() | nil
        }

  @bundles [
    %{
      id: "starter",
      name: "Starter",
      nodes: 500,
      price_cents: 499,
      price_eur: 4.99,
      bonus_percent: 0,
      popular: false,
      stripe_price_id: nil
    },
    %{
      id: "popular",
      name: "Popular",
      nodes: 1200,
      price_cents: 999,
      price_eur: 9.99,
      bonus_percent: 20,
      popular: true,
      stripe_price_id: nil
    },
    %{
      id: "creator",
      name: "Creator",
      nodes: 2800,
      price_cents: 1999,
      price_eur: 19.99,
      bonus_percent: 40,
      popular: false,
      stripe_price_id: nil
    },
    %{
      id: "pro",
      name: "Pro",
      nodes: 6500,
      price_cents: 3999,
      price_eur: 39.99,
      bonus_percent: 63,
      popular: false,
      stripe_price_id: nil
    },
    %{
      id: "ultimate",
      name: "Ultimate",
      nodes: 17000,
      price_cents: 9999,
      price_eur: 99.99,
      bonus_percent: 70,
      popular: false,
      stripe_price_id: nil
    }
  ]

  @doc "Get all available bundles."
  @spec get_bundles() :: [bundle()]
  def get_bundles, do: @bundles

  @doc "Get a specific bundle by ID."
  @spec get_bundle(String.t()) :: bundle() | nil
  def get_bundle(id) when is_binary(id) do
    Enum.find(@bundles, fn b -> b.id == id end)
  end
end
