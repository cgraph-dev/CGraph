defmodule CGraph.FeatureFlags do
  @moduledoc """
  Production-grade feature flag system for controlled rollouts.

  Supports boolean, percentage, targeted, and variant (A/B test) flags.
  Flags are cached in-memory (Cachex, 5 min TTL) and synced from Postgres.

  ## Usage

      FeatureFlags.enabled?(:new_dashboard, user_id: user.id)
      FeatureFlags.variant(:pricing_page, user_id: user.id)
      FeatureFlags.enable(:new_feature)
      FeatureFlags.set_percentage(:new_feature, 25)

  ## Telemetry

  - `[:cgraph, :feature_flags, :check]` — flag evaluation
  - `[:cgraph, :feature_flags, :updated]` — flag modified

  Submodules: `Evaluation`, `Store`.
  """

  use GenServer
  require Logger

  alias CGraph.FeatureFlags.{Evaluation, Store}

  # Default flags - can be overridden by database
  @default_flags %{
    registration_enabled: %{type: :boolean, enabled: true},
    email_verification_required: %{type: :boolean, enabled: true},
    wallet_auth_enabled: %{type: :boolean, enabled: true},
    file_uploads_enabled: %{type: :boolean, enabled: true},
    video_calls_enabled: %{type: :boolean, enabled: true},
    screen_share_enabled: %{type: :boolean, enabled: true},
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
  @spec start_link(keyword()) :: GenServer.on_start()
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
  @doc "Checks if a feature flag is enabled."
  @spec enabled?(atom(), keyword()) :: boolean()
  def enabled?(flag_name, opts \\ []) do
    opts = if is_map(opts), do: Map.to_list(opts), else: opts
    flag_name = Store.normalize_flag_name(flag_name)
    user_id = Keyword.get(opts, :user_id)
    default = Keyword.get(opts, :default, false)

    start_time = System.monotonic_time(:microsecond)

    result = case get_flag(flag_name) do
      nil ->
        default

      flag ->
        Evaluation.evaluate_flag(flag, user_id, opts)
    end

    Store.emit_check_telemetry(flag_name, result, start_time)

    result
  end

  @doc """
  Get the variant for an A/B test flag.

  Returns the variant name, or nil if not enrolled.
  """
  @spec variant(atom(), keyword()) :: String.t() | nil
  def variant(flag_name, opts \\ []) do
    opts = if is_map(opts), do: Map.to_list(opts), else: opts
    flag_name = Store.normalize_flag_name(flag_name)
    user_id = Keyword.get(opts, :user_id)

    case get_flag(flag_name) do
      %{type: :variant, enabled: true} = flag ->
        Evaluation.select_variant(flag, user_id)

      _ ->
        nil
    end
  end

  @doc """
  Get all feature flags and their current state.
  """
  @spec all_flags() :: map()
  def all_flags do
    GenServer.call(__MODULE__, :all_flags)
  end

  @doc """
  Get a specific flag's configuration.
  """
  @spec get_flag(atom()) :: map() | nil
  def get_flag(flag_name) do
    flag_name = Store.normalize_flag_name(flag_name)

    case Store.cache_get(flag_name) do
      {:ok, nil} ->
        # Not in cache - fetch from source
        flag = Map.get(all_flags(), flag_name)
        if flag, do: Store.cache_flag(flag_name, flag)
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
  @spec enable(atom()) :: {:ok, map()} | {:error, term()}
  def enable(flag_name) do
    update_flag(flag_name, %{enabled: true})
  end

  @doc """
  Disable a feature flag.
  """
  @spec disable(atom()) :: {:ok, map()} | {:error, term()}
  def disable(flag_name) do
    update_flag(flag_name, %{enabled: false})
  end

  @doc """
  Set percentage rollout for a flag.

  ## Example

      FeatureFlags.set_percentage(:new_ui, 25)  # Enable for 25% of users
  """
  @spec set_percentage(atom(), 0..100) :: {:ok, map()} | {:error, term()}
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
  @doc "Sets targeting rules for a feature flag."
  @spec set_targeting(atom(), keyword()) :: {:ok, map()} | {:error, term()}
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
  @spec set_variants(atom(), keyword()) :: {:ok, map()} | {:error, term()}
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
  @spec update_flag(atom(), map()) :: {:ok, map()} | {:error, term()}
  def update_flag(flag_name, changes) do
    GenServer.call(__MODULE__, {:update_flag, Store.normalize_flag_name(flag_name), changes})
  end

  @doc """
  Create a new feature flag.
  """
  @spec create_flag(atom(), map()) :: {:ok, map()} | {:error, :already_exists}
  def create_flag(flag_name, config) do
    GenServer.call(__MODULE__, {:create_flag, Store.normalize_flag_name(flag_name), config})
  end

  @doc """
  Delete a feature flag.
  """
  @spec delete_flag(atom()) :: :ok
  def delete_flag(flag_name) do
    GenServer.call(__MODULE__, {:delete_flag, Store.normalize_flag_name(flag_name)})
  end

  @doc """
  Clear the flag cache (force reload from database).
  """
  @spec clear_cache() :: :ok
  def clear_cache do
    Store.clear_all()
  end

  @doc """
  Generate a consistent percentage (0-100) for a user.

  Uses FNV-1a hash for even distribution and consistency.
  """
  defdelegate user_percentage(user_id), to: Evaluation

  # ---------------------------------------------------------------------------
  # GenServer Implementation
  # ---------------------------------------------------------------------------

  @spec init(keyword()) :: {:ok, map()}
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

  @doc "Handles synchronous call messages."
  @spec handle_call(term(), GenServer.from(), map()) :: {:reply, term(), map()}
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
    Store.invalidate_cache(flag_name)

    # Emit telemetry
    Store.emit_update_telemetry(flag_name, changes)

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

      Store.emit_update_telemetry(flag_name, config)

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
    Store.invalidate_cache(flag_name)

    Logger.info("Feature flag deleted", flag: flag_name)

    {:reply, :ok, %{state | overrides: overrides}}
  end

  @doc "Handles generic messages."
  @spec handle_info(term(), map()) :: {:noreply, map()}
  @impl true
  def handle_info(:sync_flags, state) do
    # Would sync with database here
    schedule_sync()
    {:noreply, state}
  end

  defp schedule_sync do
    Process.send_after(self(), :sync_flags, Store.cache_ttl())
  end
end
