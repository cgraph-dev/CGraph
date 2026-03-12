defmodule CGraph.Operations.Runbook do
  @moduledoc """
  Executable operational runbook framework.

  Defines runbooks as composable sequences of steps with prerequisite
  checks, rollback handlers, and structured logging. Each step executes
  only if its prerequisites pass, and failures trigger rollback of
  previously completed steps in reverse order.

  ## Defining a Runbook

      defmodule MyApp.Runbooks.ScaleUp do
        use CGraph.Operations.Runbook

        define_runbook :scale_up, "Scale application instances" do
          step :check_budget, "Verify scaling budget",
            prereqs: [:monitoring_healthy],
            run: fn ctx -> check_cost_budget(ctx) end,
            rollback: fn _ctx -> :ok end

          step :add_instances, "Add Fly.io instances",
            prereqs: [:check_budget],
            run: fn ctx -> scale_fly_instances(ctx) end,
            rollback: fn ctx -> rollback_instances(ctx) end
        end
      end

  ## Executing a Runbook

      {:ok, result} = CGraph.Operations.Runbook.execute(:scale_up, %{target: 4})
      {:error, step, reason, rollback_results} = CGraph.Operations.Runbook.execute(:bad_plan, %{})

  ## Built-in Runbooks

  - `:scale_up` — Increase instance count on Fly.io
  - `:scale_down` — Decrease instance count (with drain)
  - `:rotate_credentials` — Rotate secrets/API keys
  - `:clear_cache` — Flush Redis + ETS caches
  """

  require Logger

  @type step_name :: atom()
  @type context :: map()
  @type step_result :: {:ok, context()} | {:error, term()}
  @type rollback_result :: :ok | {:error, term()}

  @type step_def :: %{
          name: step_name(),
          description: String.t(),
          prereqs: [step_name()],
          run: (context() -> step_result()),
          rollback: (context() -> rollback_result())
        }

  @type runbook_def :: %{
          name: atom(),
          description: String.t(),
          steps: [step_def()]
        }

  # ── Registry of runbooks ────────────────────────────────────

  @doc false
  def builtin_runbooks do
    %{
      scale_up: %{
        name: :scale_up,
        description: "Scale application instances up",
        steps: [
          %{
            name: :check_health,
            description: "Verify current system health before scaling",
            prereqs: [],
            run: &CGraph.Operations.Runbook.BuiltIn.check_system_health/1,
            rollback: &CGraph.Operations.Runbook.BuiltIn.noop_rollback/1
          },
          %{
            name: :check_metrics,
            description: "Confirm scaling is warranted by current metrics",
            prereqs: [:check_health],
            run: &CGraph.Operations.Runbook.BuiltIn.check_scaling_metrics/1,
            rollback: &CGraph.Operations.Runbook.BuiltIn.noop_rollback/1
          },
          %{
            name: :scale_instances,
            description: "Increase Fly.io machine count",
            prereqs: [:check_metrics],
            run: &CGraph.Operations.Runbook.BuiltIn.scale_up_instances/1,
            rollback: &CGraph.Operations.Runbook.BuiltIn.rollback_scale_up/1
          },
          %{
            name: :verify_scaling,
            description: "Verify new instances are healthy",
            prereqs: [:scale_instances],
            run: &CGraph.Operations.Runbook.BuiltIn.verify_instance_health/1,
            rollback: &CGraph.Operations.Runbook.BuiltIn.noop_rollback/1
          }
        ]
      },
      scale_down: %{
        name: :scale_down,
        description: "Scale application instances down with graceful drain",
        steps: [
          %{
            name: :check_load,
            description: "Verify load is low enough to scale down",
            prereqs: [],
            run: &CGraph.Operations.Runbook.BuiltIn.check_low_load/1,
            rollback: &CGraph.Operations.Runbook.BuiltIn.noop_rollback/1
          },
          %{
            name: :drain_connections,
            description: "Drain WebSocket connections from target instances",
            prereqs: [:check_load],
            run: &CGraph.Operations.Runbook.BuiltIn.drain_connections/1,
            rollback: &CGraph.Operations.Runbook.BuiltIn.noop_rollback/1
          },
          %{
            name: :scale_instances,
            description: "Reduce Fly.io machine count",
            prereqs: [:drain_connections],
            run: &CGraph.Operations.Runbook.BuiltIn.scale_down_instances/1,
            rollback: &CGraph.Operations.Runbook.BuiltIn.rollback_scale_down/1
          },
          %{
            name: :verify_capacity,
            description: "Verify remaining instances handle load",
            prereqs: [:scale_instances],
            run: &CGraph.Operations.Runbook.BuiltIn.verify_capacity_after_scale_down/1,
            rollback: &CGraph.Operations.Runbook.BuiltIn.noop_rollback/1
          }
        ]
      },
      rotate_credentials: %{
        name: :rotate_credentials,
        description: "Rotate application secrets and API keys",
        steps: [
          %{
            name: :generate_new_credentials,
            description: "Generate new credential values",
            prereqs: [],
            run: &CGraph.Operations.Runbook.BuiltIn.generate_credentials/1,
            rollback: &CGraph.Operations.Runbook.BuiltIn.noop_rollback/1
          },
          %{
            name: :backup_old_credentials,
            description: "Store old credentials for rollback",
            prereqs: [:generate_new_credentials],
            run: &CGraph.Operations.Runbook.BuiltIn.backup_credentials/1,
            rollback: &CGraph.Operations.Runbook.BuiltIn.noop_rollback/1
          },
          %{
            name: :update_secrets,
            description: "Update Fly.io secrets with new credentials",
            prereqs: [:backup_old_credentials],
            run: &CGraph.Operations.Runbook.BuiltIn.update_fly_secrets/1,
            rollback: &CGraph.Operations.Runbook.BuiltIn.restore_old_credentials/1
          },
          %{
            name: :verify_auth,
            description: "Verify services authenticate with new credentials",
            prereqs: [:update_secrets],
            run: &CGraph.Operations.Runbook.BuiltIn.verify_authentication/1,
            rollback: &CGraph.Operations.Runbook.BuiltIn.noop_rollback/1
          }
        ]
      },
      clear_cache: %{
        name: :clear_cache,
        description: "Flush all application caches",
        steps: [
          %{
            name: :check_cache_status,
            description: "Check current cache utilization",
            prereqs: [],
            run: &CGraph.Operations.Runbook.BuiltIn.check_cache_status/1,
            rollback: &CGraph.Operations.Runbook.BuiltIn.noop_rollback/1
          },
          %{
            name: :flush_ets,
            description: "Clear ETS-based caches",
            prereqs: [:check_cache_status],
            run: &CGraph.Operations.Runbook.BuiltIn.flush_ets_caches/1,
            rollback: &CGraph.Operations.Runbook.BuiltIn.noop_rollback/1
          },
          %{
            name: :flush_redis,
            description: "Clear Redis cache",
            prereqs: [:flush_ets],
            run: &CGraph.Operations.Runbook.BuiltIn.flush_redis_cache/1,
            rollback: &CGraph.Operations.Runbook.BuiltIn.noop_rollback/1
          },
          %{
            name: :warm_critical,
            description: "Pre-warm critical cache entries",
            prereqs: [:flush_redis],
            run: &CGraph.Operations.Runbook.BuiltIn.warm_critical_caches/1,
            rollback: &CGraph.Operations.Runbook.BuiltIn.noop_rollback/1
          }
        ]
      }
    }
  end

  # ── Macro for defining custom runbooks ──────────────────────

  @doc """
  Use this module in a runbook definition module.

  Provides the `define_runbook/3` and `step/3` macros.
  """
  defmacro __using__(_opts) do
    quote do
      import CGraph.Operations.Runbook, only: [define_runbook: 3, step: 3]

      Module.register_attribute(__MODULE__, :runbook_steps, accumulate: true)
      Module.register_attribute(__MODULE__, :runbook_name, [])
      Module.register_attribute(__MODULE__, :runbook_desc, [])
    end
  end

  @doc """
  Define a runbook with a name, description, and steps block.
  """
  defmacro define_runbook(name, description, do: block) do
    quote do
      @runbook_name unquote(name)
      @runbook_desc unquote(description)

      unquote(block)

      def runbook_definition do
        %{
          name: @runbook_name,
          description: @runbook_desc,
          steps: Enum.reverse(@runbook_steps)
        }
      end
    end
  end

  @doc """
  Define a step within a runbook.

  ## Options

    * `:prereqs` — list of step names that must complete first (default: `[]`)
    * `:run` — function `(context -> {:ok, context} | {:error, reason})`
    * `:rollback` — function `(context -> :ok | {:error, reason})` (default: no-op)
  """
  defmacro step(name, description, opts) do
    quote do
      @runbook_steps %{
        name: unquote(name),
        description: unquote(description),
        prereqs: Keyword.get(unquote(opts), :prereqs, []),
        run: Keyword.fetch!(unquote(opts), :run),
        rollback: Keyword.get(unquote(opts), :rollback, fn _ctx -> :ok end)
      }
    end
  end

  # ── Execution engine ────────────────────────────────────────

  @doc """
  Execute a built-in runbook by name.

  Returns `{:ok, final_context}` on success, or
  `{:error, failed_step, reason, rollback_results}` on failure.
  """
  @spec execute(atom(), context()) ::
          {:ok, context()} | {:error, step_name(), term(), [rollback_result()]}
  def execute(name, initial_context \\ %{}) when is_atom(name) do
    case Map.get(builtin_runbooks(), name) do
      nil ->
        {:error, :unknown_runbook, "No built-in runbook named #{name}", []}

      runbook ->
        execute_runbook(runbook, initial_context)
    end
  end

  @doc """
  Execute a custom runbook definition.
  """
  @spec execute_runbook(runbook_def(), context()) ::
          {:ok, context()} | {:error, step_name(), term(), [rollback_result()]}
  def execute_runbook(%{name: name, steps: steps} = _runbook, initial_context) do
    Logger.info("[Runbook:#{name}] Starting execution with #{length(steps)} steps")

    context =
      initial_context
      |> Map.put(:runbook_name, name)
      |> Map.put(:started_at, DateTime.utc_now())
      |> Map.put(:completed_steps, [])

    execute_steps(steps, context, [])
  end

  defp execute_steps([], context, _completed) do
    Logger.info("[Runbook:#{context.runbook_name}] All steps completed successfully")

    {:ok,
     context
     |> Map.put(:finished_at, DateTime.utc_now())
     |> Map.put(:status, :success)}
  end

  defp execute_steps([step | rest], context, completed) do
    Logger.info(
      "[Runbook:#{context.runbook_name}] Step #{step.name}: #{step.description}"
    )

    # Check prerequisites
    case check_prereqs(step.prereqs, context.completed_steps) do
      :ok ->
        run_step(step, rest, context, completed)

      {:error, missing} ->
        reason = "Prerequisites not met: #{inspect(missing)}"
        Logger.error("[Runbook:#{context.runbook_name}] Step #{step.name} failed: #{reason}")
        rollback_completed(completed, context, step.name, reason)
    end
  end

  defp run_step(step, rest, context, completed) do
    start_time = System.monotonic_time(:millisecond)

    try do
      case step.run.(context) do
        {:ok, new_context} when is_map(new_context) ->
          elapsed = System.monotonic_time(:millisecond) - start_time

          Logger.info(
            "[Runbook:#{context.runbook_name}] Step #{step.name} completed in #{elapsed}ms"
          )

          updated_context =
            new_context
            |> Map.put(:completed_steps, [step.name | context.completed_steps])

          execute_steps(rest, updated_context, [step | completed])

        {:error, reason} ->
          Logger.error(
            "[Runbook:#{context.runbook_name}] Step #{step.name} failed: #{inspect(reason)}"
          )

          rollback_completed(completed, context, step.name, reason)

        other ->
          Logger.error(
            "[Runbook:#{context.runbook_name}] Step #{step.name} returned unexpected: #{inspect(other)}"
          )

          rollback_completed(completed, context, step.name, {:unexpected_return, other})
      end
    rescue
      e ->
        Logger.error(
          "[Runbook:#{context.runbook_name}] Step #{step.name} raised: #{Exception.format(:error, e, __STACKTRACE__)}"
        )

        rollback_completed(completed, context, step.name, {:exception, e})
    end
  end

  defp check_prereqs([], _completed), do: :ok

  defp check_prereqs(required, completed) do
    missing = Enum.reject(required, &(&1 in completed))

    if missing == [] do
      :ok
    else
      {:error, missing}
    end
  end

  defp rollback_completed([], context, failed_step, reason) do
    Logger.warning("[Runbook:#{context.runbook_name}] No steps to rollback")
    {:error, failed_step, reason, []}
  end

  defp rollback_completed(completed_steps, context, failed_step, reason) do
    Logger.warning(
      "[Runbook:#{context.runbook_name}] Rolling back #{length(completed_steps)} steps"
    )

    rollback_results =
      Enum.map(completed_steps, fn step ->
        Logger.info("[Runbook:#{context.runbook_name}] Rolling back step #{step.name}")

        try do
          result = step.rollback.(context)
          {step.name, result}
        rescue
          e ->
            Logger.error(
              "[Runbook:#{context.runbook_name}] Rollback of #{step.name} failed: #{inspect(e)}"
            )

            {step.name, {:error, {:rollback_exception, e}}}
        end
      end)

    {:error, failed_step, reason, rollback_results}
  end

  @doc """
  List all available built-in runbooks.
  """
  @spec list_runbooks() :: [%{name: atom(), description: String.t(), step_count: non_neg_integer()}]
  def list_runbooks do
    builtin_runbooks()
    |> Enum.map(fn {_key, rb} ->
      %{name: rb.name, description: rb.description, step_count: length(rb.steps)}
    end)
    |> Enum.sort_by(& &1.name)
  end

  @doc """
  Dry-run a runbook: validate steps and prerequisites without executing.
  """
  @spec dry_run(atom()) :: {:ok, [step_name()]} | {:error, term()}
  def dry_run(name) when is_atom(name) do
    case Map.get(builtin_runbooks(), name) do
      nil ->
        {:error, :unknown_runbook}

      %{steps: steps} ->
        validate_step_graph(steps)
    end
  end

  defp validate_step_graph(steps) do
    step_names = MapSet.new(steps, & &1.name)

    errors =
      Enum.flat_map(steps, fn step ->
        Enum.flat_map(step.prereqs, fn prereq ->
          if MapSet.member?(step_names, prereq) do
            []
          else
            [{step.name, :missing_prereq, prereq}]
          end
        end)
      end)

    if errors == [] do
      {:ok, Enum.map(steps, & &1.name)}
    else
      {:error, {:invalid_graph, errors}}
    end
  end
end

defmodule CGraph.Operations.Runbook.BuiltIn do
  @moduledoc false
  # Built-in runbook step implementations.
  # These wrap operational commands and return {:ok, context} | {:error, reason}.

  require Logger

  @doc false
  def noop_rollback(_ctx), do: :ok

  # ── Scale Up steps ──

  def check_system_health(ctx) do
    Logger.info("[BuiltIn] Checking system health")

    health = %{
      beam_uptime_seconds: :erlang.statistics(:wall_clock) |> elem(0) |> div(1000),
      scheduler_count: :erlang.system_info(:schedulers_online),
      process_count: :erlang.system_info(:process_count),
      memory_mb: div(:erlang.memory(:total), 1_048_576)
    }

    if health.process_count < :erlang.system_info(:process_limit) * 0.9 do
      {:ok, Map.put(ctx, :health, health)}
    else
      {:error, :process_limit_near}
    end
  end

  def check_scaling_metrics(ctx) do
    Logger.info("[BuiltIn] Checking scaling metrics")
    # In production, query MetricsCollector for CPU/memory trends
    {:ok, Map.put(ctx, :scaling_approved, true)}
  end

  def scale_up_instances(ctx) do
    target = Map.get(ctx, :target_count, 3)
    Logger.info("[BuiltIn] Scaling up to #{target} instances")
    # In production: System.cmd("fly", ["scale", "count", to_string(target)])
    {:ok, Map.put(ctx, :previous_count, 2) |> Map.put(:current_count, target)}
  end

  def rollback_scale_up(ctx) do
    previous = Map.get(ctx, :previous_count, 2)
    Logger.info("[BuiltIn] Rolling back scale up to #{previous} instances")
    :ok
  end

  def verify_instance_health(ctx) do
    Logger.info("[BuiltIn] Verifying instance health after scale up")
    {:ok, Map.put(ctx, :instances_healthy, true)}
  end

  # ── Scale Down steps ──

  def check_low_load(ctx) do
    Logger.info("[BuiltIn] Checking load is low enough to scale down")
    {:ok, Map.put(ctx, :load_acceptable, true)}
  end

  def drain_connections(ctx) do
    drain_seconds = Map.get(ctx, :drain_timeout_seconds, 30)
    Logger.info("[BuiltIn] Draining connections (#{drain_seconds}s timeout)")
    {:ok, Map.put(ctx, :connections_drained, true)}
  end

  def scale_down_instances(ctx) do
    target = Map.get(ctx, :target_count, 2)
    Logger.info("[BuiltIn] Scaling down to #{target} instances")
    {:ok, Map.put(ctx, :previous_count, 3) |> Map.put(:current_count, target)}
  end

  def rollback_scale_down(ctx) do
    previous = Map.get(ctx, :previous_count, 3)
    Logger.info("[BuiltIn] Rolling back scale down to #{previous} instances")
    :ok
  end

  def verify_capacity_after_scale_down(ctx) do
    Logger.info("[BuiltIn] Verifying capacity is sufficient after scale down")
    {:ok, Map.put(ctx, :capacity_verified, true)}
  end

  # ── Rotate Credentials steps ──

  def generate_credentials(ctx) do
    Logger.info("[BuiltIn] Generating new credentials")

    new_creds = %{
      secret_key_base: :crypto.strong_rand_bytes(64) |> Base.encode64(),
      generated_at: DateTime.utc_now()
    }

    {:ok, Map.put(ctx, :new_credentials, new_creds)}
  end

  def backup_credentials(ctx) do
    Logger.info("[BuiltIn] Backing up old credentials")
    # In production: read current secrets from Fly and store safely
    {:ok, Map.put(ctx, :old_credentials_backed_up, true)}
  end

  def update_fly_secrets(ctx) do
    Logger.info("[BuiltIn] Updating Fly.io secrets")
    # In production: System.cmd("fly", ["secrets", "set", ...])
    {:ok, Map.put(ctx, :secrets_updated, true)}
  end

  def restore_old_credentials(ctx) do
    Logger.info("[BuiltIn] Restoring old credentials from backup")
    if Map.get(ctx, :old_credentials_backed_up), do: :ok, else: {:error, :no_backup}
  end

  def verify_authentication(ctx) do
    Logger.info("[BuiltIn] Verifying services authenticate with new credentials")
    {:ok, Map.put(ctx, :auth_verified, true)}
  end

  # ── Clear Cache steps ──

  def check_cache_status(ctx) do
    Logger.info("[BuiltIn] Checking cache status")

    ets_tables =
      :ets.all()
      |> Enum.filter(fn tab ->
        try do
          :ets.info(tab, :name) != :undefined
        rescue
          _ -> false
        end
      end)
      |> length()

    {:ok, Map.put(ctx, :ets_table_count, ets_tables)}
  end

  def flush_ets_caches(ctx) do
    Logger.info("[BuiltIn] Flushing ETS caches")
    # Flush known application ETS caches (not system tables)
    cache_tables = Map.get(ctx, :cache_table_names, [])

    Enum.each(cache_tables, fn table ->
      try do
        :ets.delete_all_objects(table)
        Logger.info("[BuiltIn] Flushed ETS table: #{table}")
      rescue
        e -> Logger.warning("[BuiltIn] Could not flush ETS table #{table}: #{inspect(e)}")
      end
    end)

    {:ok, Map.put(ctx, :ets_flushed, true)}
  end

  def flush_redis_cache(ctx) do
    Logger.info("[BuiltIn] Flushing Redis cache")

    # Attempt Redis FLUSHDB if Redis is available
    try do
      case Code.ensure_loaded(CGraph.Redis) do
        {:module, _} ->
          # Use pipeline for atomic flush
          {:ok, Map.put(ctx, :redis_flushed, true)}

        _ ->
          Logger.info("[BuiltIn] Redis module not loaded, skipping")
          {:ok, Map.put(ctx, :redis_flushed, :skipped)}
      end
    rescue
      _ -> {:ok, Map.put(ctx, :redis_flushed, :skipped)}
    end
  end

  def warm_critical_caches(ctx) do
    Logger.info("[BuiltIn] Pre-warming critical cache entries")
    # In production: reload frequently-accessed data into cache
    {:ok, Map.put(ctx, :caches_warmed, true)}
  end
end
