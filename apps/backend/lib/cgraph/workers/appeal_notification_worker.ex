defmodule CGraph.Workers.AppealNotificationWorker do
  @moduledoc """
  Oban worker to send email notifications for appeal outcomes.

  Enqueued when a moderator reviews an appeal (approve or deny).
  Uses `CGraph.Workers.Orchestrator` to dispatch the email via the
  standard notification pipeline.
  """

  use Oban.Worker, queue: :notifications, max_attempts: 3

  alias CGraph.Moderation.Appeal
  alias CGraph.Repo

  require Logger

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"appeal_id" => appeal_id, "outcome" => outcome}}) do
    appeal =
      Repo.get!(Appeal, appeal_id)
      |> Repo.preload([:user, review_action: :report])

    template = email_template(outcome)

    assigns = %{
      user_name: appeal.user.display_name || appeal.user.username,
      appeal_reason: appeal.reason,
      outcome: outcome,
      reviewer_notes: appeal.reviewer_notes,
      restriction_type:
        if(appeal.review_action && appeal.review_action.report,
          do: appeal.review_action.report.target_type,
          else: "content"
        )
    }

    case CGraph.Workers.Orchestrator.enqueue(
           CGraph.Workers.EmailWorker,
           %{
             type: "email",
             template: Atom.to_string(template),
             to: appeal.user.email,
             assigns: assigns
           },
           queue: :email,
           priority: 1
         ) do
      {:ok, _job} ->
        Logger.info("appeal_notification_enqueued",
          appeal_id: appeal_id,
          outcome: outcome,
          user_id: appeal.user.id
        )

        :ok

      {:error, reason} ->
        Logger.error("appeal_notification_failed",
          appeal_id: appeal_id,
          reason: inspect(reason)
        )

        {:error, reason}
    end
  end

  defp email_template("approved"), do: :appeal_approved
  defp email_template("denied"), do: :appeal_denied
  defp email_template(_), do: :appeal_update
end
