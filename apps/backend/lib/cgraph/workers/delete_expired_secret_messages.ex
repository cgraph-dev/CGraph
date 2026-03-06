defmodule CGraph.Workers.DeleteExpiredSecretMessages do
  @moduledoc """
  Oban cron worker that hard-deletes expired secret messages.

  Runs every minute to ensure self-destruct messages are cleaned up promptly.
  Also marks stale secret conversations (no activity in 30+ days) as expired.

  Unlike regular message cleanup, secret message deletion is a privacy-critical
  operation — expired messages must be irrecoverably deleted.
  """

  use Oban.Worker,
    queue: :cleanup,
    max_attempts: 3

  require Logger

  alias CGraph.Messaging.SecretChat
  alias CGraph.Crypto.E2EE.SecretSession

  @impl Oban.Worker
  def perform(_job) do
    # 1. Hard-delete expired secret messages
    deleted_count = SecretChat.cleanup_expired_messages()

    if deleted_count > 0 do
      Logger.info("deleted_expired_secret_messages", count: deleted_count)
    end

    # 2. Mark stale E2EE sessions (no activity in 30+ days)
    stale_count = SecretSession.mark_stale_sessions()

    if stale_count > 0 do
      Logger.info("marked_stale_e2ee_sessions", count: stale_count)
    end

    :ok
  end
end
