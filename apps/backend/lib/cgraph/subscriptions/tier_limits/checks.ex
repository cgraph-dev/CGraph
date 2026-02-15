defmodule CGraph.Subscriptions.TierLimits.Checks do
  @moduledoc """
  Predicate and feature-check functions for tier limits.

  This module contains all `can_*?`, `has_*?`, and `ai_*` functions
  that verify whether a user's subscription tier permits a given action.

  These functions are delegated from `CGraph.Subscriptions.TierLimits`
  so the public API surface remains unchanged.
  """

  import Ecto.Query, warn: false
  alias CGraph.Accounts.User
  alias CGraph.Repo
  alias CGraph.Subscriptions.{TierFeature, TierLimit}
  alias CGraph.Subscriptions.TierLimits

  # ===========================================================================
  # Limit Checks
  # ===========================================================================

  @doc """
  Checks if a user can create a new forum.

  Compares the user's effective `:max_forums_owned` limit against the current
  number of forums they own.
  """
  @spec can_create_forum?(User.t()) :: boolean()
  def can_create_forum?(%User{} = user) do
    max = TierLimits.get_effective_limit(user, :max_forums_owned)
    current = CGraph.Forums.count_user_forums(user.id)
    TierLimit.within_limit?(max, current)
  end

  @doc """
  Checks if a user can join another forum.

  Compares the user's effective `:max_forums_joined` limit against the current
  number of forums they have joined.
  """
  @spec can_join_forum?(User.t()) :: boolean()
  def can_join_forum?(%User{} = user) do
    max = TierLimits.get_effective_limit(user, :max_forums_joined)
    current = CGraph.Forums.count_user_joined_forums(user.id)
    TierLimit.within_limit?(max, current)
  end

  @doc """
  Checks if a user can create a thread today.

  Compares the user's effective `:max_threads_per_day` limit against the number
  of threads they have created today.
  """
  @spec can_create_thread?(User.t()) :: boolean()
  def can_create_thread?(%User{} = user) do
    max = TierLimits.get_effective_limit(user, :max_threads_per_day)
    current = CGraph.Forums.count_user_threads_today(user.id)
    TierLimit.within_limit?(max, current)
  end

  @doc """
  Checks if a user can create a post today.

  Compares the user's effective `:max_posts_per_day` limit against the number
  of posts they have created today.
  """
  @spec can_create_post?(User.t()) :: boolean()
  def can_create_post?(%User{} = user) do
    max = TierLimits.get_effective_limit(user, :max_posts_per_day)
    current = CGraph.Forums.count_user_posts_today(user.id)
    TierLimit.within_limit?(max, current)
  end

  @doc """
  Checks if a user has storage space for a file of the given size.

  Returns `:ok` when there is sufficient space, or an error tuple when the
  file exceeds the per-file size limit or total storage quota.
  """
  @spec has_storage_space?(User.t(), non_neg_integer()) ::
          :ok | {:error, :file_too_large | :storage_limit_exceeded}
  def has_storage_space?(%User{} = user, file_size_bytes) do
    max_storage = TierLimits.get_effective_limit(user, :max_storage_bytes)
    max_file_size = TierLimits.get_effective_limit(user, :max_file_size_bytes)
    current_usage = CGraph.Storage.get_user_usage(user.id)

    cond do
      max_file_size != nil and file_size_bytes > max_file_size ->
        {:error, :file_too_large}

      max_storage != nil and (current_usage + file_size_bytes) > max_storage ->
        {:error, :storage_limit_exceeded}

      true ->
        :ok
    end
  end

  @doc """
  Checks if a user has access to a named feature.

  The feature is looked up first in the `TierFeature` table, then falls back
  to boolean fields on the tier record itself.
  """
  @spec has_feature?(User.t(), String.t()) :: boolean()
  def has_feature?(%User{} = user, feature_key) when is_binary(feature_key) do
    case TierLimits.get_user_tier_limits(user) do
      {:ok, tier} ->
        # First check tier-level features table
        case get_tier_feature(tier.id, feature_key) do
          %TierFeature{enabled: enabled} -> enabled
          nil -> check_tier_boolean_field(tier, feature_key)
        end

      _ -> false
    end
  end

  defp get_tier_feature(tier_id, feature_key) do
    TierFeature
    |> where([f], f.tier_id == ^tier_id and f.feature_key == ^feature_key)
    |> Repo.one()
  end

  defp check_tier_boolean_field(tier, feature_key) do
    # Map common feature keys to tier fields
    case feature_key do
      "ai.moderation" -> tier.ai_moderation_enabled
      "ai.suggestions" -> tier.ai_suggestions_enabled
      "ai.search" -> tier.ai_search_enabled
      "forums.custom_css" -> tier.custom_css_enabled
      "forums.custom_themes" -> tier.custom_themes_enabled
      "forums.custom_domain" -> tier.custom_domain_enabled
      "forums.analytics" -> tier.forum_analytics_enabled
      "messaging.video_calls" -> tier.video_calls_enabled
      "messaging.screen_sharing" -> tier.screen_sharing_enabled
      "gamification.battle_pass" -> tier.battle_pass_enabled
      "gamification.trading" -> tier.trading_enabled
      "api.access" -> tier.api_access_enabled
      "api.webhooks" -> tier.webhook_enabled
      _ -> false
    end
  end

  # ===========================================================================
  # AI Feature Checks (Prepared for v1.1)
  # ===========================================================================

  @doc """
  Checks if AI moderation is available for this user's tier.
  """
  @spec ai_moderation_available?(User.t()) :: boolean()
  def ai_moderation_available?(%User{} = user) do
    has_feature?(user, "ai.moderation")
  end

  @doc """
  Checks if user can make another AI moderation request today.

  Compares the user's effective `:ai_moderation_requests_per_day` limit against
  the number of AI moderation requests they have made today.
  """
  @spec can_make_ai_moderation_request?(User.t()) :: boolean()
  def can_make_ai_moderation_request?(%User{} = user) do
    max = TierLimits.get_effective_limit(user, :ai_moderation_requests_per_day)
    current = get_ai_requests_today(user.id, :moderation)
    TierLimit.within_limit?(max, current)
  end

  @doc """
  Checks if AI suggestions are available for this user.
  """
  @spec ai_suggestions_available?(User.t()) :: boolean()
  def ai_suggestions_available?(%User{} = user) do
    has_feature?(user, "ai.suggestions")
  end

  defp get_ai_requests_today(user_id, type) do
    # Count AI requests from rate limiter for today
    key = "ai_#{type}:#{user_id}:#{Date.utc_today()}"
    case CGraph.Redis.command(["GET", key]) do
      {:ok, nil} -> 0
      {:ok, count} -> String.to_integer(count)
      {:error, _} -> 0
    end
  end
end
