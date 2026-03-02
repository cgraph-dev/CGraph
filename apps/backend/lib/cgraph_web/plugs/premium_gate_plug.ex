defmodule CGraphWeb.Plugs.PremiumGatePlug do
  @moduledoc """
  Plug to gate API endpoints by subscription tier.

  Checks the current user's `subscription_tier` against the required minimum tier.
  Returns 403 with a `tier_required` error if the user doesn't meet the requirement.

  Follows the same pattern as `CGraphWeb.Plugs.LevelGatePlug` from Phase 16.

  ## Usage

      # In router pipelines:
      pipeline :premium_gate do
        plug CGraphWeb.Plugs.PremiumGatePlug, min_tier: "premium"
      end

      # Inline in a scope:
      plug CGraphWeb.Plugs.PremiumGatePlug, min_tier: "enterprise"

  ## Configuration

  Set `bypass_premium_gates: true` in config to bypass all gates (useful for tests):

      config :cgraph, bypass_premium_gates: true
  """

  import Plug.Conn

  @behaviour Plug

  @tier_levels %{
    "enterprise" => 3,
    "premium" => 2,
    "free" => 1
  }

  @impl Plug
  def init(opts), do: opts

  @impl Plug
  def call(conn, opts) do
    if Application.get_env(:cgraph, :bypass_premium_gates, false) do
      conn
    else
      min_tier = Keyword.fetch!(opts, :min_tier)
      do_gate(conn, min_tier)
    end
  end

  defp do_gate(conn, min_tier) do
    user = conn.assigns[:current_user]

    cond do
      is_nil(user) ->
        # No user assigned — let auth plug handle it
        conn

      tier_sufficient?(user.subscription_tier, min_tier) ->
        conn

      true ->
        conn
        |> put_resp_content_type("application/json")
        |> send_resp(403, Jason.encode!(%{
          error: "tier_required",
          message: "Upgrade to #{min_tier} to access this feature",
          required_tier: min_tier,
          current_tier: user.subscription_tier || "free"
        }))
        |> halt()
    end
  end

  defp tier_sufficient?(current, required) do
    tier_level(current) >= tier_level(required)
  end

  defp tier_level(tier) when is_binary(tier) do
    Map.get(@tier_levels, tier, 0)
  end

  defp tier_level(_), do: 0
end
