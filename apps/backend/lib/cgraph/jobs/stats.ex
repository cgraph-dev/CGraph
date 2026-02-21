defmodule CGraph.Jobs.Stats do
  @moduledoc """
  Job statistics and observability — aggregated metrics, error analysis,
  and worker performance data.
  """

  import Ecto.Query

  alias CGraph.Repo

  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------

  @doc """
  Get job statistics for a time window.
  """
  @spec get_stats(keyword()) :: map()
  def get_stats(opts \\ []) do
    window = Keyword.get(opts, :window, :timer.minutes(5))
    since = DateTime.add(DateTime.utc_now(), -window, :millisecond)

    states =
      Repo.all(
        from j in Oban.Job,
          where: j.inserted_at >= ^since,
          group_by: j.state,
          select: {j.state, count(j.id)}
      )
      |> Map.new()

    queues =
      Repo.all(
        from j in Oban.Job,
          where: j.inserted_at >= ^since,
          group_by: j.queue,
          select: {j.queue, count(j.id)}
      )
      |> Map.new()

    workers =
      Repo.all(
        from j in Oban.Job,
          where: j.inserted_at >= ^since,
          group_by: j.worker,
          select: {j.worker, count(j.id)}
      )
      |> Map.new()

    %{
      window_seconds: div(window, 1000),
      since: since,
      by_state: states,
      by_queue: queues,
      by_worker: workers,
      total: Enum.reduce(states, 0, fn {_k, v}, acc -> acc + v end)
    }
  end

  @doc """
  Get error statistics grouped by error type.
  """
  @spec get_error_stats(keyword()) :: [map()]
  def get_error_stats(opts \\ []) do
    limit = Keyword.get(opts, :limit, 20)
    since = Keyword.get(opts, :since, DateTime.add(DateTime.utc_now(), -24 * 60 * 60, :second))

    Repo.all(
      from j in Oban.Job,
        where: j.state == "discarded" and j.discarded_at >= ^since,
        group_by: fragment("errors->-1->>'error'"),
        select: %{
          error: fragment("errors->-1->>'error'"),
          count: count(j.id),
          last_seen: max(j.discarded_at)
        },
        order_by: [desc: count(j.id)],
        limit: ^limit
    )
  end

  @doc """
  Get performance statistics for workers.
  """
  @spec get_worker_performance(keyword()) :: [map()]
  def get_worker_performance(opts \\ []) do
    limit = Keyword.get(opts, :limit, 20)
    since = Keyword.get(opts, :since, DateTime.add(DateTime.utc_now(), -24 * 60 * 60, :second))

    Repo.all(
      from j in Oban.Job,
        where: j.state == "completed" and j.completed_at >= ^since,
        group_by: j.worker,
        select: %{
          worker: j.worker,
          count: count(j.id),
          avg_duration_ms: fragment(
            "EXTRACT(EPOCH FROM (avg(completed_at - attempted_at))) * 1000"
          ),
          max_duration_ms: fragment(
            "EXTRACT(EPOCH FROM (max(completed_at - attempted_at))) * 1000"
          ),
          min_duration_ms: fragment(
            "EXTRACT(EPOCH FROM (min(completed_at - attempted_at))) * 1000"
          )
        },
        order_by: [desc: count(j.id)],
        limit: ^limit
    )
  end
end
