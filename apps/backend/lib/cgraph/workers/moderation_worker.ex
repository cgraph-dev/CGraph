defmodule CGraph.Workers.ModerationWorker do
  @moduledoc """
  Oban worker for asynchronous AI content moderation.

  Processes content through the AI moderation pipeline and triggers
  auto-action for high-confidence detections. Enqueued after message
  or post creation when AI moderation is enabled.

  ## Args

  - `"content"` - The text content to moderate
  - `"user_id"` - ID of the content author
  - `"target_id"` - ID of the content item (message, post, etc.)
  - `"type"` - Content type: "message", "post", "comment"
  - `"content_type"` - Media type: "text", "image"
  """

  use Oban.Worker, queue: :moderation, max_attempts: 3

  alias CGraph.Moderation.AutoAction

  require Logger

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"content" => content} = args}) do
    opts = [
      user_id: args["user_id"],
      target_id: args["target_id"],
      type: args["type"] || "message",
      content_type: args["content_type"] || "text"
    ]

    case AutoAction.process(content, opts) do
      :ok ->
        :ok

      {:error, reason} ->
        Logger.warning("moderation_worker_failed",
          target_id: args["target_id"],
          reason: inspect(reason)
        )

        # Return ok to avoid retries for non-transient errors
        :ok
    end
  end
end
