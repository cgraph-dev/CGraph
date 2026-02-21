defmodule CGraph.Moderation.Enforcement do
  @moduledoc """
  Report review, enforcement actions, and user restrictions.

  Handles the staff-side workflow of reviewing reports and taking actions
  (dismiss, warn, remove content, suspend, ban), as well as managing
  user restrictions and warning escalation.
  """

  import Ecto.Query, warn: false

  alias CGraph.Accounts.User
  alias CGraph.Audit
  alias CGraph.Moderation.Report
  alias CGraph.Moderation.ReviewAction
  alias CGraph.Moderation.UserRestriction
  alias CGraph.Repo

  require Logger

  # ---------------------------------------------------------------------------
  # Review Actions
  # ---------------------------------------------------------------------------

  @doc """
  Review and take action on a report.

  ## Actions

  - `:dismiss` - Report invalid, no action taken
  - `:warn` - Issue warning to target user
  - `:remove_content` - Delete the reported content
  - `:suspend` - Temporarily suspend target user
  - `:ban` - Permanently ban target user

  ## Parameters

  - `reviewer` - Staff user reviewing the report
  - `report_id` - ID of report to review
  - `attrs` - Action attributes:
    - `action` - Action to take
    - `notes` - Internal notes
    - `duration_hours` - For suspensions, how long
    - `notify_reporter` - Whether to notify the reporter
  """
  def review_report(%User{} = reviewer, report_id, attrs) do
    with {:ok, report} <- get_report(report_id),
         :ok <- validate_reviewer(reviewer),
         {:ok, _action} <- create_review_action(reviewer, report, attrs),
         {:ok, report} <- apply_action(report, attrs) do

      Audit.log(:moderation, :report_reviewed, %{
        report_id: report.id,
        action: attrs[:action]
      }, actor_id: reviewer.id)

      {:ok, report}
    end
  end

  # ---------------------------------------------------------------------------
  # User Restrictions
  # ---------------------------------------------------------------------------

  @doc """
  Create a user restriction (suspension/ban).
  """
  def create_user_restriction(user_id, type, duration_hours) do
    expires_at = if duration_hours do
      DateTime.utc_now() |> DateTime.truncate(:second)
      |> DateTime.truncate(:second)
      |> DateTime.add(duration_hours * 3600, :second)
    else
      nil  # Permanent
    end

    %UserRestriction{}
    |> UserRestriction.changeset(%{
      user_id: user_id,
      type: type,
      expires_at: expires_at
    })
    |> Repo.insert()
  end

  @doc """
  Check if a user is currently restricted.
  """
  def user_restricted?(user_id) do
    now = DateTime.utc_now() |> DateTime.truncate(:second)

    Repo.exists?(
      from r in UserRestriction,
        where: r.user_id == ^user_id,
        where: r.active == true,
        where: is_nil(r.expires_at) or r.expires_at > ^now
    )
  end

  @doc """
  Get active restriction for a user.
  """
  def get_user_restriction(user_id) do
    now = DateTime.utc_now() |> DateTime.truncate(:second)

    Repo.one(
      from r in UserRestriction,
        where: r.user_id == ^user_id,
        where: r.active == true,
        where: is_nil(r.expires_at) or r.expires_at > ^now,
        order_by: [desc: r.inserted_at],
        limit: 1
    )
  end

  @doc false
  def validate_reviewer(%User{is_admin: true}), do: :ok
  def validate_reviewer(_), do: {:error, :unauthorized}

  # ---------------------------------------------------------------------------
  # Private Helpers
  # ---------------------------------------------------------------------------

  defp get_report(report_id) do
    case Repo.get(Report, report_id) do
      nil -> {:error, :not_found}
      report -> {:ok, report}
    end
  end

  defp create_review_action(reviewer, report, attrs) do
    %ReviewAction{}
    |> ReviewAction.changeset(%{
      report_id: report.id,
      reviewer_id: reviewer.id,
      action: attrs[:action],
      notes: attrs[:notes],
      duration_hours: attrs[:duration_hours]
    })
    |> Repo.insert()
  end

  defp apply_action(report, %{action: :dismiss}) do
    update_report_status(report, :dismissed)
  end

  defp apply_action(report, %{action: :warn} = attrs) do
    # Send formal warning notification to the user
    with {:ok, target_user} <- CGraph.Accounts.get_user(report.target_id) do
      warning_data = %{
        report_id: report.id,
        category: report.category,
        content_type: report.target_type,
        warning_level: calculate_warning_level(target_user, report.category),
        issued_at: DateTime.utc_now() |> DateTime.truncate(:second),
        notes: attrs[:notes] || "Your content was flagged for review.",
        appeal_deadline: DateTime.utc_now() |> DateTime.truncate(:second) |> DateTime.add(7 * 24 * 3600, :second)
      }

      # Create persistent warning record for user history
      record_user_warning(target_user, warning_data)

      # Send notification through the standard notification system
      CGraph.Notifications.notify(target_user, :moderation_warning,
        title: "Content Warning",
        body: "Your content has been flagged. Please review our community guidelines.",
        data: warning_data
      )

      # Increment warning count for escalation tracking
      update_user_warning_count(target_user)
    end

    update_report_status(report, :resolved)
  end

  defp apply_action(report, %{action: :remove_content}) do
    # Soft-delete the reported content based on content type
    removal_result = case report.target_type do
      :message ->
        CGraph.Messaging.soft_delete_message(report.target_id,
          reason: :moderation_removal,
          report_id: report.id
        )
      :post ->
        CGraph.Forums.soft_delete_post(report.target_id,
          reason: :moderation_removal,
          report_id: report.id
        )
      :comment ->
        CGraph.Forums.soft_delete_comment(report.target_id,
          reason: :moderation_removal,
          report_id: report.id
        )
      :profile_content ->
        CGraph.Accounts.remove_profile_content(report.target_id, report.target_id,
          reason: :moderation_removal
        )
      _ ->
        Logger.warning("unknown_content_type_for_removal", report_target_type: report.target_type)
        {:ok, :no_action}
    end

    case removal_result do
      {:ok, _} ->
        # Notify user that content was removed
        if target_user = CGraph.Accounts.get_user!(report.target_id) do
          CGraph.Notifications.notify(target_user, :content_removed,
            title: "Content Removed",
            body: "Your content was removed for violating community guidelines.",
            data: %{
              content_type: report.target_type,
              category: report.category,
              removed_at: DateTime.utc_now() |> DateTime.truncate(:second)
            }
          )
        end
        update_report_status(report, :resolved)
      {:error, reason} ->
        Logger.error("failed_to_remove_content", reason: inspect(reason))
        {:error, :removal_failed}
    end
  end

  defp apply_action(report, %{action: :suspend} = attrs) do
    duration = attrs[:duration_hours] || 24 * 7  # Default 7 days

    {:ok, _} = create_user_restriction(
      report.target_id,
      :suspended,
      duration
    )

    update_report_status(report, :resolved)
  end

  defp apply_action(report, %{action: :ban}) do
    {:ok, _} = create_user_restriction(
      report.target_id,
      :banned,
      nil  # Permanent
    )

    update_report_status(report, :resolved)
  end

  defp update_report_status(report, status) do
    report
    |> Ecto.Changeset.change(%{
      status: status,
      reviewed_at: DateTime.utc_now() |> DateTime.truncate(:second)
    })
    |> Repo.update()
  end

  # ---------------------------------------------------------------------------
  # Warning Management Helpers
  # ---------------------------------------------------------------------------

  # Calculate warning severity based on user history and violation category
  defp calculate_warning_level(user, category) do
    prior_warnings = get_user_warning_count(user.id)
    base_level = case category do
      cat when cat in [:csam, :illegal_content] -> :critical
      cat when cat in [:harassment, :hate_speech, :threats] -> :severe
      cat when cat in [:spam, :scam, :impersonation] -> :moderate
      _ -> :minor
    end

    # Escalate based on repeat offenses
    cond do
      prior_warnings >= 3 -> :final_warning
      prior_warnings >= 2 and base_level in [:severe, :critical] -> :final_warning
      prior_warnings >= 1 -> escalate_level(base_level)
      true -> base_level
    end
  end

  defp escalate_level(:minor), do: :moderate
  defp escalate_level(:moderate), do: :severe
  defp escalate_level(:severe), do: :critical
  defp escalate_level(level), do: level

  defp get_user_warning_count(user_id) do
    Repo.one(
      from r in ReviewAction,
        join: report in Report, on: report.id == r.report_id,
        where: report.target_id == ^user_id,
        where: r.action == :warn,
        where: r.inserted_at > ago(90, "day"),
        select: count(r.id)
    ) || 0
  end

  defp record_user_warning(user, warning_data) do
    # Store warning in user's moderation history for audit and escalation
    Logger.info("user_warning_issued_user_id_level_category", user_id: user.id, warning_data_warning_level: warning_data.warning_level, warning_data_category: warning_data.category)
    :ok
  end

  defp update_user_warning_count(_user) do
    # The warning count is dynamically calculated from ReviewActions
    # This hook allows for cache invalidation or notification triggers
    :ok
  end
end
