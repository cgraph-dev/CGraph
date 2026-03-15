defmodule CGraph.Workers.StatusExpiryWorker do
  @moduledoc """
  Oban cron worker that clears expired custom statuses.

  Runs every minute, queries users whose `status_expires_at` has passed,
  clears their status fields, and broadcasts the change to friends.
  """
  use Oban.Worker, queue: :default, max_attempts: 3

  import Ecto.Query

  require Logger

  alias CGraph.Accounts.Friends
  alias CGraph.Accounts.User
  alias CGraph.Repo

  @doc "Executes the job."
  @spec perform(Oban.Job.t()) :: :ok | {:error, term()}
  @impl Oban.Worker
  def perform(%Oban.Job{}) do
    now = DateTime.utc_now()

    expired_users =
      from(u in User,
        where: not is_nil(u.status_expires_at) and u.status_expires_at <= ^now,
        select: u
      )
      |> Repo.all()

    if expired_users != [] do
      Logger.info("[StatusExpiryWorker] Clearing expired status for #{length(expired_users)} user(s)")
    end

    Enum.each(expired_users, fn user ->
      clear_expired_status(user)
    end)

    :ok
  end

  @spec clear_expired_status(User.t()) :: :ok
  defp clear_expired_status(user) do
    user
    |> Ecto.Changeset.change(%{
      status_message: nil,
      custom_status: nil,
      status_expires_at: nil,
      status: "online"
    })
    |> Repo.update()

    # Broadcast cleared status to friends
    friend_ids =
      Friends.list_friends(user.id)
      |> Enum.map(& &1.friend_id)

    payload = %{
      user_id: user.id,
      status: "online",
      status_message: nil,
      custom_status: nil,
      expires_at: nil,
      updated_at: DateTime.utc_now() |> DateTime.to_iso8601()
    }

    Enum.each(friend_ids, fn friend_id ->
      Phoenix.PubSub.broadcast(
        CGraph.PubSub,
        "user:#{friend_id}:presence_updates",
        {:presence_update, user.id, Map.put(payload, :from_user_id, user.id)}
      )
    end)

    # Also broadcast on the presence channel topic
    CGraphWeb.Endpoint.broadcast("presence:lobby", "friend_status_changed", payload)

    :ok
  rescue
    e ->
      Logger.error("[StatusExpiryWorker] Failed to clear status for user #{user.id}: #{inspect(e)}")
      :ok
  end
end
