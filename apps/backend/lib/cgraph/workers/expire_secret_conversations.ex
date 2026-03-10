defmodule CGraph.Workers.ExpireSecretConversations do
  @moduledoc """
  Oban cron worker that expires secret conversations past their `expires_at`.

  Runs periodically to check for active secret conversations whose
  `expires_at` timestamp has passed, and marks them as "expired".
  Also hard-deletes all messages in expired conversations for privacy.

  Unlike regular cleanup, this is a privacy-critical operation —
  expired conversations and their messages must be irrecoverably removed.
  """

  use Oban.Worker,
    queue: :cleanup,
    max_attempts: 3

  require Logger

  import Ecto.Query

  alias CGraph.Repo
  alias CGraph.Messaging.{SecretConversation, SecretMessage}

  @impl Oban.Worker
  def perform(_job) do
    now = DateTime.utc_now()

    # Find active conversations past their expiry
    expired_conversations =
      from(sc in SecretConversation,
        where: sc.status == "active",
        where: not is_nil(sc.expires_at),
        where: sc.expires_at < ^now,
        select: sc.id
      )
      |> Repo.all()

    if expired_conversations != [] do
      # Hard-delete all messages in expired conversations
      {deleted_messages, _} =
        from(m in SecretMessage, where: m.secret_conversation_id in ^expired_conversations)
        |> Repo.delete_all()

      # Mark conversations as expired
      {expired_count, _} =
        from(sc in SecretConversation,
          where: sc.id in ^expired_conversations,
          where: sc.status == "active"
        )
        |> Repo.update_all(set: [status: "expired"])

      # Broadcast expiry to participants
      Enum.each(expired_conversations, fn convo_id ->
        Phoenix.PubSub.broadcast(
          CGraph.PubSub,
          "secret_chat:#{convo_id}",
          {:secret_chat_expired, %{conversation_id: convo_id}}
        )
      end)

      Logger.info("expired_secret_conversations",
        conversations: expired_count,
        messages_deleted: deleted_messages
      )
    end

    :ok
  end
end
