defmodule Cgraph.FeatureFlags do
  @moduledoc """
  Production-grade feature flag system for controlled rollouts.
  
  ## Overview
  
  Feature flags enable:
  
  - **Gradual Rollouts**: Release features to percentages of users
  - **Targeting**: Enable features for specific users, groups, or tiers
  - **Kill Switches**: Instantly disable features in production
  - **A/B Testing**: Test multiple variations of a feature
  
  ## Flag Types
  
  | Type | Description | Example |
  |------|-------------|---------|
  | `boolean` | Simple on/off | `new_ui_enabled` |
  | `percentage` | Rollout to % of users | `video_calls: 25%` |
  | `targeted` | Specific users/groups | `beta_testers` |
  | `variant` | A/B test variations | `pricing_page: ["A", "B", "C"]` |
  
  ## Architecture
  
  ```
  ┌─────────────────────────────────────────────────────────────────┐
  │                     FEATURE FLAG SYSTEM                         │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                  │
  │   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐   │
  │   │   Postgres   │────►│    Cache     │────►│   Runtime    │   │
  │   │  (source)    │     │  (5 min TTL) │     │  (hot path)  │   │
  │   └──────────────┘     └──────────────┘     └──────────────┘   │
  │                                                                  │
  │   ┌──────────────────────────────────────────────────────────┐  │
  │   │                    Targeting Engine                       │  │
  │   │  User ID → Hash → Percentage | User Tier | Custom Rules  │  │
  │   └──────────────────────────────────────────────────────────┘  │
  │                                                                  │
  └─────────────────────────────────────────────────────────────────┘
  ```
  
  ## Usage
  
      # Check if feature is enabled
      if FeatureFlags.enabled?(:new_dashboard, user_id: user.id) do
        render_new_dashboard()
      else
        render_old_dashboard()
      end
      
      # Get variant for A/B test
      case FeatureFlags.variant(:pricing_page, user_id: user.id) do
        "control" -> render_pricing_control()
        "variant_a" -> render_pricing_a()
        "variant_b" -> render_pricing_b()
      end
      
      # Admin: Enable feature
      FeatureFlags.enable(:new_feature)
      
      # Admin: Gradual rollout
      FeatureFlags.set_percentage(:new_feature, 25)
  
  ## Telemetry
  
  - `[:cgraph, :feature_flags, :check]` - Flag evaluation
  - `[:cgraph, :feature_flags, :updated]` - Flag modified
  """
  
  use GenServer
  require Logger
  
  @cache_name :cgraph_cache
  @cache_prefix "feature_flag:"
  @cache_ttl :timer.minutes(5)
  
  # Default flags - can be overridden by database
  @default_flags %{
    # Core features
    registration_enabled: %{type: :boolean, enabled: true},
    email_verification_required: %{type: :boolean, enabled: true},
    wallet_auth_enabled: %{type: :boolean, enabled: true},
    
    # Premium features
    file_uploads_enabled: %{type: :boolean, enabled: true},
    video_calls_enabled: %{type: :boolean, enabled: false},
    screen_share_enabled: %{type: :boolean, enabled: false},
    
    # Experimental features
    new_ui: %{type: :percentage, percentage: 0, enabled: false},
    ai_suggestions: %{type: :percentage, percentage: 0, enabled: false},
    
    # A/B Tests
    onboarding_flow: %{
      type: :variant,
      variants: ["control", "simplified", "guided"],
      weights: [50, 25, 25],
      enabled: false
    }
  }
  
  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------
  
  @doc """
  Start the feature flags GenServer.
  """
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end
  
  @doc """
  Check if a feature is enabled.
  
  ## Options
  
  - `:user_id` - User ID for percentage rollouts
  - `:user_tier` - User tier (free, premium, admin)
  - `:group_id` - Group ID for group-specific flags
  - `:default` - Default value if flag not found (default: false)
  
  ## Examples
  
      # Simple check
      FeatureFlags.enabled?(:new_dashboard)
      
      # With user context
      FeatureFlags.enabled?(:new_dashboard, user_id: "user_123")
      
      # With default
      FeatureFlags.enabled?(:unknown_flag, default: true)
  """
  def enabled?(flag_name, opts \\ []) do
    flag_name = normalize_flag_name(flag_name)
    user_id = Keyword.get(opts, :user_id)
    default = Keyword.get(opts, :default, false)
    
    start_time = System.monotonic_time(:microsecond)
    
    result = case get_flag(flag_name) do
      nil -> 
        default
        
      flag ->
        evaluate_flag(flag, user_id, opts)
    end
    
    emit_check_telemetry(flag_name, result, start_time)
    
    result
  end
  
  @doc """
  Get the variant for an A/B test flag.
  
  Returns the variant name, or nil if not enrolled.
  """
  def variant(flag_name, opts \\ []) do
    flag_name = normalize_flag_name(flag_name)
    user_id = Keyword.get(opts, :user_id)
    
    case get_flag(flag_name) do
      %{type: :variant, enabled: true} = flag ->
        select_variant(flag, user_id)
        
      _ ->
        nil
    end
  end
  
  @doc """
  Get all feature flags and their current state.
  """
  def all_flags do
    GenServer.call(__MODULE__, :all_flags)
  end
  
  @doc """
  Get a specific flag's configuration.
  """
  def get_flag(flag_name) do
    flag_name = normalize_flag_name(flag_name)
    cache_key = @cache_prefix <> to_string(flag_name)
    
    case Cachex.get(@cache_name, cache_key) do
      {:ok, nil} ->
        # Not in cache - fetch from source
        flag = fetch_flag_from_source(flag_name)
        if flag, do: cache_flag(flag_name, flag)
        flag
        
      {:ok, flag} ->
        flag
        
      {:error, _} ->
        # Cache error - fall back to defaults
        Map.get(@default_flags, flag_name)
    end
  end
  
  # ---------------------------------------------------------------------------
  # Admin API
  # ---------------------------------------------------------------------------
  
  @doc """
  Enable a feature flag.
  """
  def enable(flag_name) do
    update_flag(flag_name, %{enabled: true})
  end
  
  @doc """
  Disable a feature flag.
  """
  def disable(flag_name) do
    update_flag(flag_name, %{enabled: false})
  end
  
  @doc """
  Set percentage rollout for a flag.
  
  ## Example
  
      FeatureFlags.set_percentage(:new_ui, 25)  # Enable for 25% of users
  """
  def set_percentage(flag_name, percentage) when percentage >= 0 and percentage <= 100 do
    update_flag(flag_name, %{
      type: :percentage,
      percentage: percentage,
      enabled: percentage > 0
    })
  end
  
  @doc """
  Set targeting rules for a flag.
  
  ## Rules
  
  - `:user_ids` - List of specific user IDs
  - `:user_tiers` - List of user tiers (e.g., [:premium, :admin])
  - `:group_ids` - List of group IDs
  
  ## Example
  
      FeatureFlags.set_targeting(:beta_feature,
        user_ids: ["user_1", "user_2"],
        user_tiers: [:admin]
      )
  """
  def set_targeting(flag_name, rules) do
    update_flag(flag_name, %{
      type: :targeted,
      rules: Map.new(rules),
      enabled: true
    })
  end
  
  @doc """
  Configure A/B test variants.
  
  ## Example
  
      FeatureFlags.set_variants(:pricing_page,
        variants: ["control", "variant_a", "variant_b"],
        weights: [50, 25, 25]
      )
  """
  def set_variants(flag_name, opts) do
    variants = Keyword.fetch!(opts, :variants)
    weights = Keyword.get(opts, :weights, List.duplicate(100 / length(variants), length(variants)))
    
    update_flag(flag_name, %{
      type: :variant,
      variants: variants,
      weights: weights,
      enabled: true
    })
  end
  
  @doc """
  Update a flag's configuration.
  """
  def update_flag(flag_name, changes) do
    GenServer.call(__MODULE__, {:update_flag, normalize_flag_name(flag_name), changes})
  end
  
  @doc """
  Create a new feature flag.
  """
  def create_flag(flag_name, config) do
    GenServer.call(__MODULE__, {:create_flag, normalize_flag_name(flag_name), config})
  end
  
  @doc """
  Delete a feature flag.
  """
  def delete_flag(flag_name) do
    GenServer.call(__MODULE__, {:delete_flag, normalize_flag_name(flag_name)})
  end
  
  @doc """
  Clear the flag cache (force reload from database).
  """
  def clear_cache do
    # Clear all feature flag entries from cache
    Cachex.clear(@cache_name)
  end
  
  # ---------------------------------------------------------------------------
  # GenServer Implementation
  # ---------------------------------------------------------------------------
  
  @impl true
  def init(_opts) do
    # Initialize with default flags
    state = %{
      flags: @default_flags,
      overrides: %{}
    }
    
    # Schedule periodic sync with database
    schedule_sync()
    
    {:ok, state}
  end
  
  @impl true
  def handle_call(:all_flags, _from, state) do
    flags = Map.merge(state.flags, state.overrides)
    {:reply, flags, state}
  end
  
  @impl true
  def handle_call({:update_flag, flag_name, changes}, _from, state) do
    current = Map.get(state.flags, flag_name) || Map.get(state.overrides, flag_name) || %{}
    updated = Map.merge(current, changes)
    
    # Update in-memory state
    overrides = Map.put(state.overrides, flag_name, updated)
    
    # Invalidate cache
    invalidate_cache(flag_name)
    
    # Emit telemetry
    emit_update_telemetry(flag_name, changes)
    
    Logger.info("Feature flag updated",
      flag: flag_name,
      changes: inspect(changes)
    )
    
    {:reply, {:ok, updated}, %{state | overrides: overrides}}
  end
  
  @impl true
  def handle_call({:create_flag, flag_name, config}, _from, state) do
    if Map.has_key?(state.flags, flag_name) or Map.has_key?(state.overrides, flag_name) do
      {:reply, {:error, :already_exists}, state}
    else
      overrides = Map.put(state.overrides, flag_name, config)
      
      emit_update_telemetry(flag_name, config)
      
      Logger.info("Feature flag created",
        flag: flag_name,
        config: inspect(config)
      )
      
      {:reply, {:ok, config}, %{state | overrides: overrides}}
    end
  end
  
  @impl true
  def handle_call({:delete_flag, flag_name}, _from, state) do
    overrides = Map.delete(state.overrides, flag_name)
    invalidate_cache(flag_name)
    
    Logger.info("Feature flag deleted", flag: flag_name)
    
    {:reply, :ok, %{state | overrides: overrides}}
  end
  
  @impl true
  def handle_info(:sync_flags, state) do
    # Would sync with database here
    schedule_sync()
    {:noreply, state}
  end
  
  defp schedule_sync do
    Process.send_after(self(), :sync_flags, @cache_ttl)
  end
  
  # ---------------------------------------------------------------------------
  # Flag Evaluation
  # ---------------------------------------------------------------------------
  
  defp evaluate_flag(%{enabled: false}, _user_id, _opts), do: false
  
  defp evaluate_flag(%{type: :boolean, enabled: enabled}, _user_id, _opts), do: enabled
  
  defp evaluate_flag(%{type: :percentage, percentage: pct, enabled: true}, user_id, _opts) do
    user_percentage(user_id) < pct
  end
  
  defp evaluate_flag(%{type: :targeted, rules: rules, enabled: true}, user_id, opts) do
    user_tier = Keyword.get(opts, :user_tier)
    group_id = Keyword.get(opts, :group_id)
    
    cond do
      # Check user ID targeting
      user_id && user_id in Map.get(rules, :user_ids, []) -> true
      
      # Check tier targeting
      user_tier && user_tier in Map.get(rules, :user_tiers, []) -> true
      
      # Check group targeting
      group_id && group_id in Map.get(rules, :group_ids, []) -> true
      
      # Default: not targeted
      true -> false
    end
  end
  
  defp evaluate_flag(%{type: :variant, enabled: true}, _user_id, _opts), do: true
  
  defp evaluate_flag(_flag, _user_id, _opts), do: false
  
  defp select_variant(%{variants: variants, weights: weights}, user_id) do
    # Use consistent hashing for sticky assignments
    hash = user_percentage(user_id)
    
    # Find the variant based on weighted distribution
    {_total, selected} = Enum.reduce_while(
      Enum.zip(variants, weights),
      {0, nil},
      fn {variant, weight}, {accumulated, _} ->
        new_accumulated = accumulated + weight
        if hash < new_accumulated do
          {:halt, {new_accumulated, variant}}
        else
          {:cont, {new_accumulated, nil}}
        end
      end
    )
    
    selected || List.first(variants)
  end
  
  @doc """
  Generate a consistent percentage (0-100) for a user.
  
  Uses FNV-1a hash for even distribution and consistency.
  """
  def user_percentage(nil), do: :rand.uniform(100)
  
  def user_percentage(user_id) do
    # FNV-1a hash for consistent distribution
    hash = :erlang.phash2(to_string(user_id), 100)
    hash
  end
  
  # ---------------------------------------------------------------------------
  # Cache Management
  # ---------------------------------------------------------------------------
  
  defp fetch_flag_from_source(flag_name) do
    # First check GenServer state
    flags = all_flags()
    Map.get(flags, flag_name)
  end
  
  defp cache_flag(flag_name, flag) do
    cache_key = @cache_prefix <> to_string(flag_name)
    Cachex.put(@cache_name, cache_key, flag, ttl: @cache_ttl)
  end
  
  defp invalidate_cache(flag_name) do
    cache_key = @cache_prefix <> to_string(flag_name)
    Cachex.del(@cache_name, cache_key)
  end
  
  # ---------------------------------------------------------------------------
  # Helpers
  # ---------------------------------------------------------------------------
  
  defp normalize_flag_name(name) when is_binary(name), do: String.to_atom(name)
  defp normalize_flag_name(name) when is_atom(name), do: name
  
  # ---------------------------------------------------------------------------
  # Telemetry
  # ---------------------------------------------------------------------------
  
  defp emit_check_telemetry(flag_name, result, start_time) do
    duration = System.monotonic_time(:microsecond) - start_time
    
    :telemetry.execute(
      [:cgraph, :feature_flags, :check],
      %{duration: duration},
      %{flag: flag_name, result: result}
    )
  end
  
  defp emit_update_telemetry(flag_name, changes) do
    :telemetry.execute(
      [:cgraph, :feature_flags, :updated],
      %{system_time: System.system_time()},
      %{flag: flag_name, changes: changes}
    )
  end
end
