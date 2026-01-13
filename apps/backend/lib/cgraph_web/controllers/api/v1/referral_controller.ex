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

  ## Security
  - Rate limited code regeneration (max 3 per day)
  - Code validation with sanitization
  - Self-referral prevention
  - Fraud detection hooks
  """
  use CgraphWeb, :controller

  import CgraphWeb.Helpers.ParamParser

  alias Cgraph.Referrals
  alias Cgraph.RateLimiter

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
  Rate limited to prevent abuse (max 3 regenerations per day).
  """
  def regenerate_code(conn, _params) do
    user = conn.assigns.current_user

    with :ok <- check_regeneration_rate_limit(user),
         {:ok, code} <- Referrals.regenerate_code(user.id) do
      render(conn, :code, code: code)
    end
  end

  @doc """
  Validate a referral code (check if valid before signup).
  """
  def validate_code(conn, %{"code" => code}) do
    with {:ok, sanitized_code} <- parse_referral_code(code),
         {:ok, referrer} <- Referrals.validate_code(sanitized_code) do
      render(conn, :validation, valid: true, referrer: mask_referrer_info(referrer))
    else
      {:error, :invalid_format} ->
        conn
        |> put_status(:bad_request)
        |> render(:validation, valid: false, error: "Invalid code format")
      {:error, reason} ->
        render(conn, :validation, valid: false, error: reason)
    end
  end

  @doc """
  Apply a referral code during signup.
  Includes self-referral prevention and fraud detection.
  """
  def apply_code(conn, %{"code" => code}) do
    user = conn.assigns.current_user

    with {:ok, sanitized_code} <- parse_referral_code(code),
         :ok <- validate_not_self_referral(user, sanitized_code),
         :ok <- check_apply_rate_limit(user),
         {:ok, referral} <- Referrals.apply_code(user.id, sanitized_code) do
      # Log for fraud detection analysis
      log_referral_application(user, sanitized_code, conn)
      render(conn, :referral, referral: referral)
    else
      {:error, :invalid_format} ->
        {:error, :bad_request, "Invalid referral code format"}
      {:error, :self_referral} ->
        {:error, :forbidden, "You cannot use your own referral code"}
      error -> error
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

  # Rate limit code regeneration to prevent abuse
  defp check_regeneration_rate_limit(user) do
    case RateLimiter.check("referral_regen:#{user.id}", :referral_regenerate, limit: 3, window: 86_400) do
      :ok -> :ok
      {:error, :rate_limited, info} ->
        {:error, :too_many_requests, %{
          message: "You can only regenerate your referral code 3 times per day",
          retry_after: info.retry_after
        }}
    end
  end

  # Rate limit code application to prevent automated abuse
  defp check_apply_rate_limit(user) do
    case RateLimiter.check("referral_apply:#{user.id}", :referral_apply, limit: 5, window: 3600) do
      :ok -> :ok
      {:error, :rate_limited, _info} ->
        {:error, :too_many_requests, "Too many referral code attempts"}
    end
  end

  # Prevent self-referral fraud
  defp validate_not_self_referral(user, code) do
    case Referrals.get_code_owner(code) do
      {:ok, owner_id} when owner_id == user.id -> {:error, :self_referral}
      {:ok, _owner_id} -> :ok
      {:error, :not_found} -> :ok  # Will fail in apply_code anyway
    end
  end

  # Only expose necessary referrer info to prevent information leakage
  defp mask_referrer_info(referrer) do
    %{
      id: referrer.id,
      username: referrer.username,
      display_name: referrer.display_name,
      avatar_url: referrer.avatar_url
    }
  end

  # Log referral for fraud detection analysis
  defp log_referral_application(user, code, conn) do
    ip_address = get_client_ip(conn)
    user_agent = get_user_agent(conn)

    require Logger
    Logger.info("REFERRAL_APPLIED: user_id=#{user.id} code=#{code} ip=#{ip_address} ua=#{user_agent}")
  end

  defp get_client_ip(conn) do
    forwarded = Plug.Conn.get_req_header(conn, "x-forwarded-for")
    case forwarded do
      [ip | _] -> ip |> String.split(",") |> List.first() |> String.trim()
      [] -> conn.remote_ip |> :inet.ntoa() |> to_string()
    end
  end

  defp get_user_agent(conn) do
    case Plug.Conn.get_req_header(conn, "user-agent") do
      [ua | _] -> String.slice(ua, 0, 200)
      [] -> "unknown"
    end
  end
end
