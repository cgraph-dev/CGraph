defmodule CGraphWeb.API.V1.TierController do
  @moduledoc """
  Handles tier and subscription limit operations.

  Provides endpoints for:
  - Listing available subscription tiers
  - Getting tier details
  - Getting user's current limits
  - Comparing tiers for upgrade/downgrade

  ## Security

  - Public endpoints: list tiers, get tier details
  - Authenticated endpoints: get my limits, get my tier
  """
  use CGraphWeb, :controller
  import CGraphWeb.ControllerHelpers, only: [render_data: 2, render_data: 3, render_error: 3]

  alias CGraph.Subscriptions.TierLimit
  alias CGraph.Subscriptions.TierLimits

  @doc """
  Lists all active subscription tiers.

  GET /api/v1/tiers

  Response:
    - 200: List of tiers with basic info
  """
  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, _params) do
    tiers = TierLimits.list_active_tiers()

    render_data(conn, Enum.map(tiers, &TierLimits.serialize_tier/1), %{
      count: length(tiers)
    })
  end

  @doc """
  Gets details for a specific tier.

  GET /api/v1/tiers/:tier

  Response:
    - 200: Tier details with limits
    - 404: Tier not found
  """
  @spec show(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def show(conn, %{"tier" => tier_name}) do
    case TierLimits.get_tier(tier_name) do
      {:ok, tier} ->
        render_data(conn, TierLimits.serialize_tier(tier, include_limits: true))

      {:error, :tier_not_found} ->
        render_error(conn, :not_found, "Tier not found")
    end
  end

  @doc """
  Gets the current user's tier and effective limits.

  GET /api/v1/tiers/me

  Requires authentication.

  Response:
    - 200: User's tier, limits, and any overrides
    - 401: Unauthorized
  """
  @spec my_tier(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def my_tier(conn, _params) do
    case conn.assigns[:current_user] do
      nil ->
        render_error(conn, :unauthorized, "Authentication required")
      user ->
        render_data(conn, TierLimits.serialize_user_limits(user))
    end
  end

  @doc """
  Compares two tiers for upgrade/downgrade UI.

  GET /api/v1/tiers/compare?from=free&to=premium

  Response:
    - 200: Comparison of limits between tiers
    - 400: Invalid tier names
  """
  @spec compare(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def compare(conn, %{"from" => from_tier, "to" => to_tier}) do
    case TierLimits.compare_tiers(from_tier, to_tier) do
      {:ok, comparison} ->
        render_data(conn, %{
            from: TierLimits.serialize_tier(comparison.from, include_limits: true),
            to: TierLimits.serialize_tier(comparison.to, include_limits: true),
            is_upgrade: comparison.is_upgrade,
            differences: format_differences(comparison.differences)
        })

      {:error, :tier_not_found} ->
        render_error(conn, :bad_request, "One or both tier names are invalid")
    end
  end

  @spec compare(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def compare(conn, _params) do
    render_error(conn, :bad_request, "Both 'from' and 'to' parameters are required")
  end

  @doc """
  Checks if user can perform a specific action.

  GET /api/v1/tiers/check/:action

  Supported actions:
    - create_forum
    - join_forum
    - create_thread
    - create_post
    - use_ai_moderation

  Response:
    - 200: { allowed: true/false, limit: X, current: Y }
  """
  @doc "Checks if a user's tier permits an action."
  @spec check_action(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def check_action(conn, %{"action" => action}) do
    user = conn.assigns.current_user

    result = case action do
      "create_forum" ->
        %{
          allowed: TierLimits.can_create_forum?(user),
          limit: TierLimits.get_effective_limit(user, :max_forums_owned),
          current: CGraph.Forums.count_user_forums(user.id)
        }

      "join_forum" ->
        %{
          allowed: TierLimits.can_join_forum?(user),
          limit: TierLimits.get_effective_limit(user, :max_forums_joined),
          current: CGraph.Forums.count_user_joined_forums(user.id)
        }

      "create_thread" ->
        %{
          allowed: TierLimits.can_create_thread?(user),
          limit: TierLimits.get_effective_limit(user, :max_threads_per_day),
          current: CGraph.Forums.count_user_threads_today(user.id)
        }

      "create_post" ->
        %{
          allowed: TierLimits.can_create_post?(user),
          limit: TierLimits.get_effective_limit(user, :max_posts_per_day),
          current: CGraph.Forums.count_user_posts_today(user.id)
        }

      "use_ai_moderation" ->
        current_usage = get_ai_moderation_usage(user.id)
        %{
          allowed: TierLimits.ai_moderation_available?(user),
          limit: TierLimits.get_effective_limit(user, :ai_moderation_requests_per_day),
          current: current_usage
        }

      _ ->
        nil
    end

    if result do
      render_data(conn, result)
    else
      render_error(conn, :bad_request, "Unknown action: #{action}")
    end
  end

  @doc """
  Checks if user has a specific feature.

  GET /api/v1/tiers/features/:feature

  Examples:
    - /api/v1/tiers/features/ai.moderation
    - /api/v1/tiers/features/forums.custom_css

  Response:
    - 200: { enabled: true/false }
  """
  @spec check_feature(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def check_feature(conn, %{"feature" => feature_key}) do
    user = conn.assigns.current_user
    enabled = TierLimits.has_feature?(user, feature_key)

    render_data(conn, %{
        feature: feature_key,
        enabled: enabled
    })
  end

  # Private helpers

  defp format_differences(differences) do
    Enum.map(differences, fn {field, from_val, to_val, change} ->
      %{
        field: to_string(field),
        from: format_limit_value(field, from_val),
        to: format_limit_value(field, to_val),
        change: to_string(change)
      }
    end)
  end

  defp get_ai_moderation_usage(user_id) do
    key = "ai_moderation:#{user_id}:#{Date.utc_today()}"
    case CGraph.Redis.command(["GET", key]) do
      {:ok, nil} -> 0
      {:ok, count} -> String.to_integer(count)
      {:error, _} -> 0
    end
  end

  defp format_limit_value(_field, nil), do: "Unlimited"
  defp format_limit_value(:max_storage_bytes, val), do: TierLimit.format_bytes(val)
  defp format_limit_value(:max_file_size_bytes, val), do: TierLimit.format_bytes(val)
  defp format_limit_value(_field, val) when is_boolean(val), do: val
  defp format_limit_value(_field, val), do: val
end
