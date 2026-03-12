defmodule CGraph.Cache.CacheWarmer do
  @moduledoc """
  Warms caches with hot data on boot and on demand.

  ## Strategy

  On application startup (or when called via `warm_on_boot/0`):

  1. Top 1 000 recently-active users  → `:users` namespace
  2. Active conversations (last 24 h) → `:messages` namespace
  3. Hot forum threads (last 7 days)  → `:feeds` namespace

  Each category is warmed in a supervised `Task` so that a single
  failure does not block the other categories.

  ## Periodic refresh

  `CGraph.Workers.CacheWarmerWorker` (Oban, hourly) calls
  `refresh_hot_data/0` to keep the warm set fresh.
  """

  require Logger

  alias CGraph.Cache.MultiTierCache
  alias CGraph.Repo

  import Ecto.Query

  # ── Boot warming ──────────────────────────────────────────────────────────

  @doc """
  Warm all hot-data categories concurrently.

  Returns `:ok` immediately — actual warming happens in background tasks.
  """
  @spec warm_on_boot() :: :ok
  def warm_on_boot do
    Logger.info("[CacheWarmer] Starting boot warming")

    tasks = [
      Task.async(fn -> warm_users() end),
      Task.async(fn -> warm_conversations() end),
      Task.async(fn -> warm_threads() end)
    ]

    # Wait up to 30 s; don't crash if one category fails
    results = Task.yield_many(tasks, :timer.seconds(30))

    Enum.each(results, fn {task, result} ->
      case result do
        {:ok, {:ok, count}} ->
          Logger.info("[CacheWarmer] Warmed #{count} entries from task #{inspect(task.ref)}")

        {:ok, {:error, reason}} ->
          Logger.warning("[CacheWarmer] Warming task failed: #{inspect(reason)}")

        {:exit, reason} ->
          Logger.warning("[CacheWarmer] Warming task exited: #{inspect(reason)}")

        nil ->
          Task.shutdown(task, :brutal_kill)
          Logger.warning("[CacheWarmer] Warming task timed out")
      end
    end)

    :telemetry.execute([:cgraph, :cache, :warmer, :boot], %{count: 1}, %{})
    :ok
  end

  # ── Periodic refresh ──────────────────────────────────────────────────────

  @doc """
  Refresh hot data. Called hourly by `CacheWarmerWorker`.
  """
  @spec refresh_hot_data() :: :ok
  def refresh_hot_data do
    Logger.info("[CacheWarmer] Refreshing hot data")
    warm_users()
    warm_conversations()
    warm_threads()

    :telemetry.execute([:cgraph, :cache, :warmer, :refresh], %{count: 1}, %{})
    :ok
  end

  # ── Category warmers ──────────────────────────────────────────────────────

  @doc """
  Warm the top 1 000 most recently active users into cache.
  """
  @spec warm_users() :: {:ok, non_neg_integer()} | {:error, term()}
  def warm_users do
    try do
      users =
        from(u in "users",
          select: %{id: u.id, username: u.username, display_name: u.display_name, avatar_url: u.avatar_url},
          order_by: [desc: u.last_active_at],
          limit: 1000
        )
        |> Repo.all()

      Enum.each(users, fn user ->
        MultiTierCache.put("users", user.id, user)
      end)

      Logger.info("[CacheWarmer] Warmed #{length(users)} users")
      {:ok, length(users)}
    rescue
      e ->
        Logger.warning("[CacheWarmer] Failed to warm users: #{inspect(e)}")
        {:error, e}
    end
  end

  @doc """
  Warm active conversations from the last 24 hours.
  """
  @spec warm_conversations() :: {:ok, non_neg_integer()} | {:error, term()}
  def warm_conversations do
    try do
      cutoff = DateTime.utc_now() |> DateTime.add(-86_400)

      conversations =
        from(c in "conversations",
          select: %{id: c.id, name: c.name, last_message_at: c.last_message_at},
          where: c.last_message_at >= ^cutoff,
          order_by: [desc: c.last_message_at],
          limit: 1000
        )
        |> Repo.all()

      Enum.each(conversations, fn conv ->
        MultiTierCache.put("conversations", conv.id, conv)
      end)

      Logger.info("[CacheWarmer] Warmed #{length(conversations)} conversations")
      {:ok, length(conversations)}
    rescue
      e ->
        Logger.warning("[CacheWarmer] Failed to warm conversations: #{inspect(e)}")
        {:error, e}
    end
  end

  @doc """
  Warm hot forum threads from the last 7 days.
  """
  @spec warm_threads() :: {:ok, non_neg_integer()} | {:error, term()}
  def warm_threads do
    try do
      cutoff = DateTime.utc_now() |> DateTime.add(-7 * 86_400)

      threads =
        from(t in "threads",
          select: %{id: t.id, title: t.title, view_count: t.view_count, reply_count: t.reply_count},
          where: t.last_post_at >= ^cutoff,
          order_by: [desc: t.view_count],
          limit: 1000
        )
        |> Repo.all()

      Enum.each(threads, fn thread ->
        MultiTierCache.put("threads", thread.id, thread)
      end)

      Logger.info("[CacheWarmer] Warmed #{length(threads)} threads")
      {:ok, length(threads)}
    rescue
      e ->
        Logger.warning("[CacheWarmer] Failed to warm threads: #{inspect(e)}")
        {:error, e}
    end
  end
end
