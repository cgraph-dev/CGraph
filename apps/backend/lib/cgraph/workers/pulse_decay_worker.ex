defmodule CGraph.Workers.PulseDecayWorker do
  @moduledoc "Daily worker: 5% decay for users inactive 30+ days in a community."
  use Oban.Worker, queue: :default, max_attempts: 3

  alias CGraph.Pulse.PulseSystem
  alias CGraph.Repo
  import Ecto.Query

  @impl Oban.Worker
  def perform(%Oban.Job{}) do
    thirty_days_ago = DateTime.add(DateTime.utc_now(), -30, :day)

    # Find all pulse scores > 0 where user has no recent activity in that forum
    inactive_scores =
      from(s in CGraph.Pulse.PulseScore,
        where: s.score > 0,
        where: s.updated_at < ^thirty_days_ago,
        select: {s.user_id, s.forum_id}
      )
      |> Repo.all()

    Enum.each(inactive_scores, fn {user_id, forum_id} ->
      PulseSystem.apply_decay(user_id, forum_id)
    end)

    :ok
  end
end
