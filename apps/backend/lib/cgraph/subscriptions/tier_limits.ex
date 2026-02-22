defmodule CGraph.Subscriptions.TierLimits do
  @moduledoc """
  Context module for managing tier limits and checking user permissions.

  This module provides functions to:
  - Query tier configurations from the database
  - Check if users can perform specific actions
  - Get effective limits for users (with overrides)
  - Cache tier data for performance

  ## Caching

  Tier limits are cached in-memory using ETS for fast lookups.
  The cache is refreshed every 5 minutes or when tiers are updated.

  ## Usage

      # Get a tier
      {:ok, tier} = TierLimits.get_tier("premium")

      # Check limits
      TierLimits.can_create_forum?(user)
      TierLimits.has_storage_space?(user, 1_000_000)

      # Get effective limit (with overrides)
      TierLimits.get_effective_limit(user, :max_forums_owned)
  """

  import Ecto.Query, warn: false
  alias CGraph.Accounts.User
  alias CGraph.Repo
  alias CGraph.Subscriptions.{TierFeature, TierLimit, UserTierOverride}

  @cache_table :tier_limits_cache
  @cache_ttl_ms 300_000  # 5 minutes

  # ===========================================================================
  # Cache Management
  # ===========================================================================

  @doc """
  Initializes the tier limits cache.
  Called during application startup.
  """
  @spec init_cache() :: :ok
  def init_cache do
    if :ets.whereis(@cache_table) == :undefined do
      :ets.new(@cache_table, [:named_table, :public, read_concurrency: true])
    end
    refresh_cache()
  end

  @doc """
  Refreshes the tier limits cache from the database.
  """
  @spec refresh_cache() :: :ok
  def refresh_cache do
    tiers = list_active_tiers()

    Enum.each(tiers, fn tier ->
      :ets.insert(@cache_table, {{:tier, tier.tier}, tier, System.system_time(:millisecond)})
    end)

    :ok
  end

  defp get_cached_tier(tier_name) do
    case :ets.lookup(@cache_table, {:tier, tier_name}) do
      [{{:tier, ^tier_name}, tier, cached_at}] ->
        if System.system_time(:millisecond) - cached_at < @cache_ttl_ms do
          {:ok, tier}
        else
          fetch_and_cache_tier(tier_name)
        end
      [] ->
        fetch_and_cache_tier(tier_name)
    end
  end

  defp fetch_and_cache_tier(tier_name) do
    case get_tier_from_db(tier_name) do
      {:ok, tier} ->
        :ets.insert(@cache_table, {{:tier, tier_name}, tier, System.system_time(:millisecond)})
        {:ok, tier}
      error ->
        error
    end
  end

  # ===========================================================================
  # Tier Queries
  # ===========================================================================

  @doc """
  Lists all active tiers ordered by position.
  """
  @spec list_active_tiers() :: [TierLimit.t()]
  def list_active_tiers do
    TierLimit
    |> where([t], t.is_active == true)
    |> order_by([t], t.position)
    |> Repo.all()
  end

  @doc """
  Lists all tiers (including inactive).
  """
  @spec list_all_tiers() :: [TierLimit.t()]
  def list_all_tiers do
    TierLimit
    |> order_by([t], t.position)
    |> Repo.all()
  end

  @doc """
  Gets a tier by name from cache (falls back to database).
  """
  @spec get_tier(String.t()) :: {:ok, TierLimit.t()} | {:error, :tier_not_found}
  def get_tier(tier_name) do
    case :ets.whereis(@cache_table) do
      :undefined -> get_tier_from_db(tier_name)
      _ -> get_cached_tier(tier_name)
    end
  end

  @doc """
  Gets a tier directly from the database.
  """
  @spec get_tier_from_db(String.t()) :: {:ok, TierLimit.t()} | {:error, :tier_not_found}
  def get_tier_from_db(tier_name) do
    case Repo.get_by(TierLimit, tier: tier_name) do
      nil -> {:error, :tier_not_found}
      tier -> {:ok, tier}
    end
  end

  @doc """
  Gets a tier by ID.
  """
  @spec get_tier_by_id(String.t()) :: {:ok, TierLimit.t()} | {:error, :tier_not_found}
  def get_tier_by_id(id) do
    case Repo.get(TierLimit, id) do
      nil -> {:error, :tier_not_found}
      tier -> {:ok, tier}
    end
  end

  @doc """
  Gets features for a tier.
  """
  @spec get_tier_features(String.t()) :: [TierFeature.t()]
  def get_tier_features(tier_id) do
    TierFeature
    |> where([f], f.tier_id == ^tier_id)
    |> Repo.all()
  end

  @doc """
  Creates a new tier.
  """
  @spec create_tier(map()) :: {:ok, TierLimit.t()} | {:error, Ecto.Changeset.t()}
  def create_tier(attrs) do
    %TierLimit{}
    |> TierLimit.changeset(attrs)
    |> Repo.insert()
    |> tap(fn
      {:ok, _} -> refresh_cache()
      _ -> :ok
    end)
  end

  @doc """
  Updates a tier.
  """
  @spec update_tier(TierLimit.t(), map()) :: {:ok, TierLimit.t()} | {:error, Ecto.Changeset.t()}
  def update_tier(%TierLimit{} = tier, attrs) do
    tier
    |> TierLimit.changeset(attrs)
    |> Repo.update()
    |> tap(fn
      {:ok, _} -> refresh_cache()
      _ -> :ok
    end)
  end

  # ===========================================================================
  # User Tier Resolution
  # ===========================================================================

  @doc """
  Gets the user's subscription tier.
  Returns "free" if no subscription found.
  """
  @spec get_user_tier(User.t() | String.t()) :: String.t()
  def get_user_tier(%User{} = user) do
    # Reads subscription_tier from user record, defaulting to "free"
    user.subscription_tier || "free"
  end

  def get_user_tier(user_id) when is_binary(user_id) do
    case CGraph.Accounts.get_user(user_id) do
      {:ok, user} -> get_user_tier(user)
      {:error, _} -> "free"
    end
  end

  @doc """
  Gets the full tier limits for a user.
  """
  @spec get_user_tier_limits(User.t()) :: {:ok, TierLimit.t()} | {:error, :tier_not_found}
  def get_user_tier_limits(%User{} = user) do
    tier_name = get_user_tier(user)
    get_tier(tier_name)
  end

  # ===========================================================================
  # Override Management
  # ===========================================================================

  @doc """
  Gets all active overrides for a user.
  """
  @spec get_user_overrides(String.t()) :: [UserTierOverride.t()]
  def get_user_overrides(user_id) do
    now = DateTime.utc_now()

    UserTierOverride
    |> where([o], o.user_id == ^user_id)
    |> where([o], is_nil(o.expires_at) or o.expires_at > ^now)
    |> Repo.all()
  end

  @doc """
  Gets a specific override for a user.
  """
  @spec get_user_override(String.t(), String.t()) :: UserTierOverride.t() | nil
  def get_user_override(user_id, limit_key) do
    now = DateTime.utc_now()

    UserTierOverride
    |> where([o], o.user_id == ^user_id and o.limit_key == ^limit_key)
    |> where([o], is_nil(o.expires_at) or o.expires_at > ^now)
    |> Repo.one()
  end

  @doc """
  Creates or updates an override for a user.
  """
  @spec set_user_override(String.t(), String.t(), term(), keyword()) :: {:ok, UserTierOverride.t()} | {:error, Ecto.Changeset.t()}
  def set_user_override(user_id, limit_key, value, opts \\ []) do
    attrs = %{
      user_id: user_id,
      limit_key: to_string(limit_key),
      override_value: to_string(value),
      reason: opts[:reason],
      granted_by_id: opts[:granted_by_id],
      expires_at: opts[:expires_at]
    }

    case get_user_override(user_id, to_string(limit_key)) do
      nil ->
        %UserTierOverride{}
        |> UserTierOverride.changeset(attrs)
        |> Repo.insert()

      existing ->
        existing
        |> UserTierOverride.changeset(attrs)
        |> Repo.update()
    end
  end

  @doc """
  Removes an override for a user.
  """
  @spec remove_user_override(String.t(), String.t()) :: {non_neg_integer(), nil | list()}
  def remove_user_override(user_id, limit_key) do
    UserTierOverride
    |> where([o], o.user_id == ^user_id and o.limit_key == ^limit_key)
    |> Repo.delete_all()
  end

  # ===========================================================================
  # Effective Limit Calculation
  # ===========================================================================

  @doc """
  Gets the effective limit for a user, considering tier and overrides.

  ## Examples

      get_effective_limit(user, :max_forums_owned)
      # => 10

      get_effective_limit(user, :max_storage_bytes)
      # => 5368709120
  """
  @spec get_effective_limit(User.t(), atom()) :: term()
  def get_effective_limit(%User{} = user, limit_key) do
    limit_key_str = to_string(limit_key)

    # Check for override first
    case get_user_override(user.id, limit_key_str) do
      %UserTierOverride{} = override ->
        case UserTierOverride.parse_value(limit_key_str, override.override_value) do
          {:ok, value} -> value
          _ -> get_tier_limit(user, limit_key)
        end

      nil ->
        get_tier_limit(user, limit_key)
    end
  end

  defp get_tier_limit(%User{} = user, limit_key) do
    case get_user_tier_limits(user) do
      {:ok, tier} -> Map.get(tier, limit_key)
      _ -> nil
    end
  end

  # ===========================================================================
  # Limit Checks — delegated to CGraph.Subscriptions.TierLimits.Checks
  # ===========================================================================

  defdelegate can_create_forum?(user), to: CGraph.Subscriptions.TierLimits.Checks
  defdelegate can_join_forum?(user), to: CGraph.Subscriptions.TierLimits.Checks
  defdelegate can_create_thread?(user), to: CGraph.Subscriptions.TierLimits.Checks
  defdelegate can_create_post?(user), to: CGraph.Subscriptions.TierLimits.Checks
  defdelegate has_storage_space?(user, file_size_bytes), to: CGraph.Subscriptions.TierLimits.Checks
  defdelegate has_feature?(user, feature_key), to: CGraph.Subscriptions.TierLimits.Checks
  defdelegate ai_moderation_available?(user), to: CGraph.Subscriptions.TierLimits.Checks
  defdelegate can_make_ai_moderation_request?(user), to: CGraph.Subscriptions.TierLimits.Checks
  defdelegate ai_suggestions_available?(user), to: CGraph.Subscriptions.TierLimits.Checks

  # ===========================================================================
  # Tier Comparison
  # ===========================================================================

  @doc """
  Compares two tiers and returns the differences.
  Useful for upgrade/downgrade displays.
  """
  @spec compare_tiers(String.t(), String.t()) :: {:ok, map()} | {:error, :tier_not_found}
  def compare_tiers(tier1_name, tier2_name) do
    with {:ok, tier1} <- get_tier(tier1_name),
         {:ok, tier2} <- get_tier(tier2_name) do
      fields = [
        :max_forums_owned, :max_storage_bytes, :max_file_size_bytes,
        :ai_moderation_enabled, :custom_css_enabled, :custom_themes_enabled,
        :video_calls_enabled, :api_access_enabled
      ]

      differences = Enum.map(fields, fn field ->
        v1 = Map.get(tier1, field)
        v2 = Map.get(tier2, field)
        {field, v1, v2, compare_values(v1, v2)}
      end)

      {:ok, %{
        from: tier1,
        to: tier2,
        differences: differences,
        is_upgrade: tier2.position > tier1.position
      }}
    end
  end

  defp compare_values(nil, nil), do: :equal
  defp compare_values(nil, _), do: :decrease  # unlimited -> limited
  defp compare_values(_, nil), do: :increase  # limited -> unlimited
  defp compare_values(v1, v2) when v1 < v2, do: :increase
  defp compare_values(v1, v2) when v1 > v2, do: :decrease
  defp compare_values(_, _), do: :equal

  # ===========================================================================
  # Serialization for API/Mobile
  # ===========================================================================

  @doc """
  Serializes tier limits to a map suitable for API responses.
  """
  @spec serialize_tier(TierLimit.t(), keyword()) :: map()
  def serialize_tier(%TierLimit{} = tier, opts \\ []) do
    base = %{
      id: tier.id,
      tier: tier.tier,
      display_name: tier.display_name,
      description: tier.description,
      position: tier.position,
      badge_color: tier.badge_color,
      badge_icon: tier.badge_icon,
      price_monthly_cents: tier.price_monthly_cents,
      price_yearly_cents: tier.price_yearly_cents
    }

    if opts[:include_limits] do
      Map.merge(base, %{
        limits: %{
          forums: %{
            max_owned: tier.max_forums_owned,
            max_joined: tier.max_forums_joined,
            max_boards: tier.max_boards_per_forum,
            max_threads_per_day: tier.max_threads_per_day,
            max_posts_per_day: tier.max_posts_per_day
          },
          storage: %{
            max_bytes: tier.max_storage_bytes,
            max_file_size: tier.max_file_size_bytes,
            formatted_max: TierLimit.format_bytes(tier.max_storage_bytes)
          },
          ai: %{
            moderation_enabled: tier.ai_moderation_enabled,
            suggestions_enabled: tier.ai_suggestions_enabled,
            search_enabled: tier.ai_search_enabled
          }
        },
        features: %{
          custom_css: tier.custom_css_enabled,
          custom_themes: tier.custom_themes_enabled,
          custom_domain: tier.custom_domain_enabled,
          video_calls: tier.video_calls_enabled,
          api_access: tier.api_access_enabled,
          webhooks: tier.webhook_enabled,
          priority_queue: tier.priority_queue,
          early_access: tier.early_access
        }
      })
    else
      base
    end
  end

  @doc """
  Serializes user's effective limits for API responses.
  """
  @spec serialize_user_limits(User.t()) :: map()
  def serialize_user_limits(%User{} = user) do
    case get_user_tier_limits(user) do
      {:ok, tier} ->
        overrides = get_user_overrides(user.id)

        %{
          tier: serialize_tier(tier, include_limits: true),
          overrides: Enum.map(overrides, fn o ->
            %{
              limit_key: o.limit_key,
              value: o.override_value,
              reason: o.reason,
              expires_at: o.expires_at
            }
          end),
          effective_limits: %{
            max_forums_owned: get_effective_limit(user, :max_forums_owned),
            max_storage_bytes: get_effective_limit(user, :max_storage_bytes),
            max_threads_per_day: get_effective_limit(user, :max_threads_per_day)
          }
        }

      {:error, _} ->
        %{tier: nil, overrides: [], effective_limits: %{}}
    end
  end
end
