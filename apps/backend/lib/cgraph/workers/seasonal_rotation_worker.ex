defmodule CGraph.Workers.SeasonalRotationWorker do
  @moduledoc """
  Oban worker for monthly seasonal cosmetic rotation.

  Runs on the 1st of each month (cron) in the `:cosmetics` queue.
  Deactivates expired seasonal/event items and activates ones whose
  event window has started.
  """

  use Oban.Worker,
    queue: :cosmetics,
    max_attempts: 3

  require Logger

  import Ecto.Query, warn: false

  alias CGraph.Cosmetics.Badge
  alias CGraph.Repo

  @impl Oban.Worker
  def perform(%Oban.Job{}) do
    now = DateTime.utc_now()

    expired_count = deactivate_expired_items(now)
    activated_count = activate_seasonal_items(now)

    Logger.info("seasonal_rotation_completed",
      expired: expired_count,
      activated: activated_count,
      run_at: DateTime.to_iso8601(now)
    )

    :ok
  end

  # ── Private ───────────────────────────────────────────────────────────────

  defp deactivate_expired_items(now) do
    {count, _} =
      from(b in Badge,
        where: b.is_active == true,
        where: b.unlock_type in ["event", "season"],
        where: fragment("(?->>'ends_at')::timestamptz < ?", b.unlock_condition, ^now)
      )
      |> Repo.update_all(set: [is_active: false])

    count
  end

  defp activate_seasonal_items(now) do
    {count, _} =
      from(b in Badge,
        where: b.is_active == false,
        where: b.unlock_type in ["event", "season"],
        where: fragment("(?->>'starts_at')::timestamptz <= ?", b.unlock_condition, ^now),
        where: fragment("(?->>'ends_at')::timestamptz > ?", b.unlock_condition, ^now)
      )
      |> Repo.update_all(set: [is_active: true])

    count
  end
end
