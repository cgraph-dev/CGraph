defmodule CgraphWeb.API.V1.ReferralController do
  @moduledoc """
  Controller for Referral system.
  Implements comprehensive referral tracking with rewards, leaderboards, and analytics.

  ## Features
  - Referral code generation and management
  - Referral tracking and stats
  - Reward tiers and claiming
  - Leaderboards
  - Referral validation
  """
  use CgraphWeb, :controller

  alias Cgraph.Referrals

  action_fallback CgraphWeb.FallbackController

  @max_per_page 100

  # ========================================
  # REFERRAL CODE MANAGEMENT
  # ========================================

  @doc """
  Get the current user's referral code.
  """
  def get_code(conn, _params) do
    user = conn.assigns.current_user
    
    with {:ok, code} <- Referrals.get_or_create_code(user.id) do
      render(conn, :code, code: code)
    end
  end

  @doc """
  Regenerate referral code.
  """
  def regenerate_code(conn, _params) do
    user = conn.assigns.current_user

    with {:ok, code} <- Referrals.regenerate_code(user.id) do
      render(conn, :code, code: code)
    end
  end

  @doc """
  Validate a referral code (check if valid before signup).
  """
  def validate_code(conn, %{"code" => code}) do
    case Referrals.validate_code(code) do
      {:ok, referrer} ->
        render(conn, :validation, valid: true, referrer: referrer)
      {:error, reason} ->
        render(conn, :validation, valid: false, error: reason)
    end
  end

  @doc """
  Apply a referral code during signup.
  """
  def apply_code(conn, %{"code" => code}) do
    user = conn.assigns.current_user

    with {:ok, referral} <- Referrals.apply_code(user.id, code) do
      render(conn, :referral, referral: referral)
    end
  end

  # ========================================
  # REFERRAL LISTING
  # ========================================

  @doc """
  List all referrals made by the current user.
  """
  def list_referrals(conn, params) do
    user = conn.assigns.current_user
    
    opts = [
      page: parse_int(params["page"], 1),
      per_page: min(parse_int(params["per_page"], 20), @max_per_page),
      status: params["status"]
    ]

    {referrals, pagination} = Referrals.list_referrals(user.id, opts)
    render(conn, :referrals, referrals: referrals, pagination: pagination)
  end

  @doc """
  List pending referrals (not yet confirmed).
  """
  def list_pending(conn, params) do
    user = conn.assigns.current_user
    
    opts = [
      page: parse_int(params["page"], 1),
      per_page: min(parse_int(params["per_page"], 20), @max_per_page)
    ]

    {referrals, pagination} = Referrals.list_pending_referrals(user.id, opts)
    render(conn, :referrals, referrals: referrals, pagination: pagination)
  end

  # ========================================
  # STATISTICS
  # ========================================

  @doc """
  Get referral statistics for the current user.
  """
  def stats(conn, _params) do
    user = conn.assigns.current_user
    stats = Referrals.get_user_stats(user.id)
    render(conn, :stats, stats: stats)
  end

  @doc """
  Get referral leaderboard.
  """
  def leaderboard(conn, params) do
    opts = [
      period: params["period"] || "all",
      limit: min(parse_int(params["limit"], 10), 100)
    ]

    leaderboard = Referrals.get_leaderboard(opts)
    render(conn, :leaderboard, leaderboard: leaderboard)
  end

  # ========================================
  # REWARDS
  # ========================================

  @doc """
  List available reward tiers.
  """
  def list_reward_tiers(conn, _params) do
    user = conn.assigns.current_user
    tiers = Referrals.list_reward_tiers(user.id)
    render(conn, :reward_tiers, tiers: tiers)
  end

  @doc """
  Claim a reward.
  """
  def claim_reward(conn, %{"tier_id" => tier_id}) do
    user = conn.assigns.current_user

    with {:ok, reward} <- Referrals.claim_reward(user.id, tier_id) do
      render(conn, :reward, reward: reward)
    end
  end

  # ========================================
  # HELPERS
  # ========================================

  defp parse_int(nil, default), do: default
  defp parse_int(val, default) when is_binary(val) do
    case Integer.parse(val) do
      {int, _} -> int
      :error -> default
    end
  end
  defp parse_int(val, _default) when is_integer(val), do: val
  defp parse_int(_, default), do: default
end
