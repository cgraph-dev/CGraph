defmodule CGraph.Workers.UnlockCheckWorker do
  @moduledoc """
  Oban worker that checks all locked cosmetic items for a user
  and grants any that are newly unlocked.

  Triggered when an achievement is earned (via PubSub subscriber).
  Runs in the `:unlocks` queue with deduplication per user (60 s window).
  """

  use Oban.Worker,
    queue: :unlocks,
    max_attempts: 3,
    unique: [period: 60, keys: [:user_id]]

  require Logger

  import Ecto.Query, warn: false

  alias CGraph.Cosmetics.{Badge, Inventory, UnlockEngine}
  alias CGraph.Repo

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"user_id" => user_id}}) do
    user = Repo.get!(CGraph.Accounts.User, user_id)
    locked_badges = get_locked_badges(user_id)

    newly_unlocked =
      Enum.filter(locked_badges, fn badge ->
        UnlockEngine.evaluate(user, badge) == :unlocked
      end)

    Enum.each(newly_unlocked, &grant_item(user_id, &1))

    if newly_unlocked != [] do
      Logger.info("unlock_check_completed",
        user_id: user_id,
        unlocked_count: length(newly_unlocked)
      )
    end

    :ok
  end

  # ── Helpers ───────────────────────────────────────────────────────────────

  defp get_locked_badges(user_id) do
    owned_ids =
      from(i in Inventory,
        where: i.user_id == ^user_id and i.item_type == "badge",
        select: i.item_id
      )
      |> Repo.all()

    from(b in Badge,
      where: b.is_active == true,
      where: b.id not in ^owned_ids
    )
    |> Repo.all()
  end

  defp grant_item(user_id, badge) do
    %Inventory{}
    |> Inventory.changeset(%{
      user_id: user_id,
      item_type: "badge",
      item_id: badge.id,
      obtained_at: DateTime.utc_now(),
      obtained_via: "unlock"
    })
    |> Repo.insert(on_conflict: :nothing)
  end
end
