defmodule CGraph.Workers.DeleteExpiredMessages do
  @moduledoc """
  Oban cron worker that deletes messages past their expires_at timestamp.
  Runs every minute to clean up ephemeral/disappearing messages.
  """

  use Oban.Worker,
    queue: :default,
    max_attempts: 3

  import Ecto.Query
  alias CGraph.Repo

  @impl Oban.Worker
  def perform(_job) do
    now = DateTime.utc_now()

    {deleted_count, _} =
      from(m in "messages",
        where: not is_nil(m.expires_at),
        where: m.expires_at <= ^now
      )
      |> Repo.delete_all()

    if deleted_count > 0 do
      require Logger
      Logger.info("Deleted #{deleted_count} expired messages")
    end

    :ok
  end
end
