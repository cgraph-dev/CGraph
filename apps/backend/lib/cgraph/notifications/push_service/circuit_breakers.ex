defmodule CGraph.Notifications.PushService.CircuitBreakers do
  @moduledoc """
  Circuit breaker integration for push notification platforms.

  Installs Fuse circuit breakers for each external push service dependency:
  - APNs (Apple Push Notification Service)
  - FCM (Firebase Cloud Messaging)
  - Web Push (VAPID-based browser push)
  - Mailer (Swoosh email delivery)

  Follows Discord/Meta patterns: every external dependency gets a circuit breaker
  so one vendor outage cannot cascade and degrade the entire notification pipeline.

  ## Fuse Configuration

  Each fuse uses `{:standard, count, window_ms}` which trips after `count`
  failures within `window_ms` milliseconds, then resets after `reset_ms`.
  """

  require Logger

  @fuses %{
    apns: {:apns_fuse, {{:standard, 5, 10_000}, {:reset, 30_000}}},
    fcm: {:fcm_fuse, {{:standard, 5, 10_000}, {:reset, 30_000}}},
    web_push: {:web_push_fuse, {{:standard, 5, 10_000}, {:reset, 30_000}}},
    mailer: {:mailer_fuse, {{:standard, 3, 15_000}, {:reset, 60_000}}}
  }

  @doc """
  Install all push-service fuses. Call from PushService.init/1.
  """
  @spec install_all() :: :ok
  def install_all do
    Enum.each(@fuses, fn {platform, {name, opts}} ->
      :fuse.install(name, opts)
      Logger.info("circuit_breaker_installed", service: platform)
    end)

    :ok
  end

  @doc """
  Execute a function behind the named circuit breaker for the given platform.

  Returns `{:error, :circuit_open}` when the fuse is blown, allowing the caller
  to skip the platform gracefully instead of hammering a down service.
  """
  @spec call(atom(), (-> result)) :: result | {:error, :circuit_open} when result: term()
  def call(platform, fun) when is_atom(platform) and is_function(fun, 0) do
    {fuse_name, _opts} = Map.fetch!(@fuses, platform)

    case :fuse.ask(fuse_name, :sync) do
      :ok ->
        try do
          result = fun.()
          handle_result(fuse_name, platform, result)
        rescue
          e ->
            :fuse.melt(fuse_name)
            Logger.error("push_circuit_breaker_exception",
              service: platform,
              error: inspect(e)
            )
            reraise e, __STACKTRACE__
        end

      :blown ->
        Logger.warning("push_circuit_open", service: platform)
        {:error, :circuit_open}
    end
  end

  @doc """
  Returns the current state of a platform's fuse.
  """
  @spec status(atom()) :: :ok | :blown
  def status(platform) do
    {fuse_name, _opts} = Map.fetch!(@fuses, platform)
    :fuse.ask(fuse_name, :sync)
  end

  # ── Private ──────────────────────────────────────────────────────────

  defp handle_result(_fuse_name, _platform, {:ok, _} = result), do: result
  defp handle_result(_fuse_name, _platform, {:ok, _, _, _} = result), do: result
  defp handle_result(_fuse_name, _platform, :ok), do: :ok

  defp handle_result(fuse_name, platform, {:error, reason} = result) do
    :fuse.melt(fuse_name)
    Logger.warning("push_circuit_breaker_failure",
      service: platform,
      reason: inspect(reason)
    )
    result
  end

  defp handle_result(fuse_name, platform, {:error, reason, count} = result) do
    :fuse.melt(fuse_name)
    Logger.warning("push_circuit_breaker_failure",
      service: platform,
      reason: inspect(reason),
      failed_count: count
    )
    result
  end

  # Pass through any other shape (e.g. tuples from platform senders)
  defp handle_result(_fuse_name, _platform, result), do: result
end
