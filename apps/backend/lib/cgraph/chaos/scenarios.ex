defmodule CGraph.Chaos.Scenarios do
  @moduledoc """
  Pre-built chaos scenarios that simulate common failure modes.

  Each scenario sets up fault injections that mimic real-world outages:
  - Redis going down (cache/session loss)
  - Database becoming slow (connection pool pressure)
  - Push notification services failing (APNs/FCM/Expo)
  - Search engine unavailable (MeiliSearch)
  - Full cascade failure (multiple services)
  """

  alias CGraph.Chaos.FaultInjector
  alias CGraph.Chaos.CircuitBreakerValidator

  require Logger

  @doc """
  Simulate Redis going completely down.
  Tests that the app degrades gracefully without cached data.
  """
  def redis_down do
    Logger.warning("[Chaos Scenario] Redis DOWN — simulating connection refused")
    FaultInjector.inject_error(:redis, :connection_refused)
    FaultInjector.inject_partition(:redis)

    # Trip the Redis fuse if it exists
    CircuitBreakerValidator.stress_fuse(:redis_fuse, max_attempts: 10)

    :ok
  end

  @doc """
  Simulate slow database queries (e.g., under heavy load).
  Adds 2-5 second latency to database operations.
  """
  def database_slow(delay_ms \\ 3_000) do
    Logger.warning("[Chaos Scenario] Database SLOW — #{delay_ms}ms latency")
    FaultInjector.inject_latency(:database, delay_ms)
    :ok
  end

  @doc """
  Simulate all push notification services going down.
  APNs, FCM, and Expo all fail simultaneously.
  """
  def push_services_down do
    Logger.warning("[Chaos Scenario] Push services DOWN — APNs, FCM, Expo all failing")
    FaultInjector.inject_error(:apns, :service_unavailable)
    FaultInjector.inject_error(:fcm, :service_unavailable)
    FaultInjector.inject_error(:expo, :service_unavailable)

    CircuitBreakerValidator.stress_fuse(:apns_fuse, max_attempts: 10)
    CircuitBreakerValidator.stress_fuse(:fcm_fuse, max_attempts: 10)
    CircuitBreakerValidator.stress_fuse(:expo_fuse, max_attempts: 10)

    :ok
  end

  @doc """
  Simulate MeiliSearch being unavailable.
  Messages/posts should still create successfully (search is async).
  """
  def search_unavailable do
    Logger.warning("[Chaos Scenario] MeiliSearch UNAVAILABLE")
    FaultInjector.inject_error(:meilisearch, :connection_refused)
    FaultInjector.inject_partition(:meilisearch)
    :ok
  end

  @doc """
  Simulate email/mailer service failure.
  Verification emails, notifications should queue and retry.
  """
  def mailer_down do
    Logger.warning("[Chaos Scenario] Mailer DOWN")
    FaultInjector.inject_error(:mailer, :service_unavailable)
    CircuitBreakerValidator.stress_fuse(:mailer_fuse, max_attempts: 10)
    :ok
  end

  @doc """
  Simulate a cascade failure where multiple services go down.
  This is the worst-case scenario — tests fundamental app resilience.
  """
  def cascade_failure do
    Logger.warning("[Chaos Scenario] CASCADE FAILURE — multiple services down")
    redis_down()
    push_services_down()
    search_unavailable()
    mailer_down()
    :ok
  end

  @doc """
  Simulate intermittent failures (flapping).
  Services fail every other request — tests retry logic.
  """
  def intermittent_failures(component, count \\ 5) do
    Logger.warning("[Chaos Scenario] Intermittent failures for #{component} (#{count} failures)")
    FaultInjector.inject_error(component, :timeout, count: count)
    :ok
  end

  @doc """
  Simulate high latency across all external services.
  Tests timeout handling and user experience under slow conditions.
  """
  def high_latency(delay_ms \\ 5_000) do
    Logger.warning("[Chaos Scenario] HIGH LATENCY — #{delay_ms}ms on all services")
    for svc <- [:redis, :database, :apns, :fcm, :expo, :meilisearch, :mailer] do
      FaultInjector.inject_latency(svc, delay_ms)
    end
    :ok
  end

  @doc """
  Clear all chaos scenarios and restore normal operation.
  """
  def restore_all do
    Logger.info("[Chaos Scenario] Restoring all services to normal")
    FaultInjector.clear_all()

    # Reset any tripped fuses
    for fuse <- CircuitBreakerValidator.known_fuses() do
      CircuitBreakerValidator.reset_fuse(fuse)
    end

    :ok
  end
end
