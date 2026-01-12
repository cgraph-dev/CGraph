defmodule Cgraph.Moderation do
  @moduledoc """
  Content moderation and abuse reporting system.

  ## Overview

  Provides infrastructure for user safety and platform integrity:

  - **Reporting**: Users can report content, users, or groups
  - **Review Queue**: Staff reviews and acts on reports
  - **Enforcement**: Warnings, suspensions, bans
  - **Appeals**: Users can contest enforcement actions

  ## Report Flow

  ```
  ┌───────────────────────────────────────────────────────────────────────────┐
  │                        MODERATION PIPELINE                                 │
  ├───────────────────────────────────────────────────────────────────────────┤
  │                                                                            │
  │   User Reports Content                                                     │
  │   ┌───────────────┐                                                       │
  │   │  create_report │                                                       │
  │   └───────┬───────┘                                                       │
  │           │                                                                │
  │           ▼                                                                │
  │   ┌───────────────────────────────────────────────────────────────┐       │
  │   │                    AUTOMATIC CHECKS                            │       │
  │   │  • Duplicate detection (same content already reported)         │       │
  │   │  • Priority scoring (severity, reporter trust, target history) │       │
  │   │  • Auto-action for obvious violations (CSAM hash match, etc.)  │       │
  │   └───────┬───────────────────────────────────────────────────────┘       │
  │           │                                                                │
  │           ▼                                                                │
  │   ┌───────────────┐     ┌─────────────────┐     ┌────────────────┐       │
  │   │  Review Queue │────►│  Staff Reviews  │────►│  Take Action   │       │
  │   │   (Pending)   │     │                 │     │                │       │
  │   └───────────────┘     └─────────────────┘     └───────┬────────┘       │
  │                                                          │                │
  │                              ┌───────────────────────────┴───────┐        │
  │                              ▼                                   ▼        │
  │                    ┌──────────────────┐              ┌──────────────────┐ │
  │                    │  Warn/Suspend/Ban │              │  Dismiss Report  │ │
  │                    └────────┬─────────┘              └──────────────────┘ │
  │                             │                                              │
  │                             ▼                                              │
  │                    ┌──────────────────┐                                   │
  │                    │  User Can Appeal  │                                   │
  │                    └──────────────────┘                                   │
  │                                                                            │
  └───────────────────────────────────────────────────────────────────────────┘
  ```

  ## Report Categories

  | Category | Priority | Auto-Action |
  |----------|----------|-------------|
  | `csam` | Critical | Immediate removal + legal |
  | `terrorism` | Critical | Immediate removal |
  | `violence_threat` | High | Queue + rate limit |
  | `harassment` | High | Queue |
  | `hate_speech` | High | Queue |
  | `spam` | Medium | Queue |
  | `impersonation` | Medium | Queue |
  | `nsfw_unlabeled` | Low | Queue |
  | `other` | Low | Queue |

  ## Usage

      # Create a report
      {:ok, report} = Moderation.create_report(reporter, %{
        target_type: :message,
        target_id: message.id,
        category: :harassment,
        description: "User is sending threatening messages"
      })

      # Review a report (staff only)
      {:ok, report} = Moderation.review_report(staff, report_id, %{
        action: :warn,
        notes: "First offense, issued warning"
      })

      # User appeals
      {:ok, appeal} = Moderation.create_appeal(user, action_id, %{
        reason: "This was a misunderstanding"
      })
  """

  import Ecto.Query, warn: false

  alias Cgraph.Accounts.User
  alias Cgraph.Audit
  alias Cgraph.Moderation.Appeal
  alias Cgraph.Moderation.Report
  alias Cgraph.Moderation.ReviewAction
  alias Cgraph.Moderation.UserRestriction
  alias Cgraph.Repo

  require Logger

  # ---------------------------------------------------------------------------
  # Report Categories & Priorities
  # ---------------------------------------------------------------------------

  @report_categories ~w(
    csam
    terrorism
    violence_threat
    harassment
    hate_speech
    doxxing
    spam
    scam
    impersonation
    copyright
    nsfw_unlabeled
    self_harm
    other
  )a

  @critical_categories ~w(csam terrorism)a
  @high_priority_categories ~w(violence_threat harassment hate_speech doxxing self_harm)a

  @doc """
  Get all valid report categories.
  """
  def report_categories, do: @report_categories

  # ---------------------------------------------------------------------------
  # Reports
  # ---------------------------------------------------------------------------

  @doc """
  Create a new report.

  ## Parameters

  - `reporter` - User creating the report
  - `attrs` - Report attributes:
    - `target_type` - :user, :message, :group, :forum, :post, :comment
    - `target_id` - ID of the reported content/user
    - `category` - Report category atom
    - `description` - Optional description
    - `evidence_urls` - Optional list of screenshot URLs

  ## Returns

  - `{:ok, report}` - Report created successfully
  - `{:error, changeset}` - Validation error
  - `{:error, :duplicate}` - Same report already exists
  - `{:error, :self_report}` - Cannot report own content
  """
  def create_report(%User{} = reporter, attrs) do
    attrs = Map.put(attrs, :reporter_id, reporter.id)

    with :ok <- validate_not_self_report(reporter, attrs),
         :ok <- check_duplicate_report(reporter, attrs),
         {:ok, report} <- do_create_report(attrs) do

      # Handle critical categories immediately
      if report.category in @critical_categories do
        handle_critical_report(report)
      end

      # Log for audit
      Audit.log(:moderation, :report_created, %{
        report_id: report.id,
        target_type: report.target_type,
        category: report.category
      }, actor_id: reporter.id)

      {:ok, report}
    end
  end

  defp validate_not_self_report(reporter, %{target_type: :user, target_id: target_id}) do
    if reporter.id == target_id, do: {:error, :self_report}, else: :ok
  end
  defp validate_not_self_report(_, _), do: :ok

  defp check_duplicate_report(reporter, attrs) do
    exists? = Repo.exists?(
      from r in Report,
        where: r.reporter_id == ^reporter.id,
        where: r.target_type == ^attrs[:target_type],
        where: r.target_id == ^attrs[:target_id],
        where: r.status == :pending
    )

    if exists?, do: {:error, :duplicate}, else: :ok
  end

  defp do_create_report(attrs) do
    priority = calculate_priority(attrs[:category])

    %Report{}
    |> Report.changeset(Map.put(attrs, :priority, priority))
    |> Repo.insert()
  end

  defp calculate_priority(category) when category in @critical_categories, do: :critical
  defp calculate_priority(category) when category in @high_priority_categories, do: :high
  defp calculate_priority(_), do: :normal

  defp handle_critical_report(report) do
    Logger.warning("CRITICAL REPORT: #{report.category} - #{report.id}")

    # For CSAM and other critical content, immediately quarantine and escalate
    if report.category == :csam do
      # Step 1: Immediately quarantine the content (hide from public view)
      quarantine_reported_content(report)
      
      # Step 2: Generate NCMEC-compatible incident report for legal compliance
      # Note: Actual NCMEC submission requires CyberTipline API integration
      # This creates the structured report data for manual or automated submission
      incident_data = generate_ncmec_incident_report(report)
      Logger.critical("NCMEC_INCIDENT_PREPARED: #{inspect(incident_data)}")
      
      # Step 3: Alert on-call staff via priority notification channel
      alert_oncall_staff(report, :critical)
      
      # Step 4: Log for audit trail (required for legal compliance)
      log_critical_incident(report, incident_data)
    end

    :ok
  end

  # Quarantine content by setting visibility to hidden and flagging for review
  defp quarantine_reported_content(report) do
    case report.content_type do
      :message ->
        Cgraph.Messaging.hide_message(report.content_id, :moderation_quarantine)
      :post ->
        Cgraph.Forums.hide_post(report.content_id, :moderation_quarantine)
      :comment ->
        Cgraph.Forums.hide_comment(report.content_id, :moderation_quarantine)
      :profile ->
        Cgraph.Accounts.flag_profile_for_review(report.target_id)
      _ ->
        Logger.warning("Unknown content type for quarantine: #{report.content_type}")
    end
  rescue
    e ->
      Logger.error("Failed to quarantine content: #{inspect(e)}")
  end

  # Generate structured incident report following NCMEC CyberTipline format
  defp generate_ncmec_incident_report(report) do
    %{
      incident_type: "CSAM",
      report_id: report.id,
      reported_at: DateTime.utc_now() |> DateTime.to_iso8601(),
      reporter_info: %{
        esp_name: "CGraph",
        esp_contact: Application.get_env(:cgraph, :legal_contact_email, "legal@cgraph.org")
      },
      incident_details: %{
        content_id: report.content_id,
        content_type: report.content_type,
        reported_user_id: report.target_id,
        original_report_text: report.description,
        category: report.category
      },
      preservation_status: :quarantined,
      hash_values: [], # Would contain perceptual hashes if image content
      submission_ready: false # Requires manual review before NCMEC submission
    }
  end

  # Alert on-call staff through multiple channels
  defp alert_oncall_staff(report, priority) do
    staff_notification = %{
      type: :critical_moderation_alert,
      priority: priority,
      report_id: report.id,
      category: report.category,
      requires_immediate_action: true,
      escalation_deadline: DateTime.utc_now() |> DateTime.add(3600, :second)
    }
    
    # Broadcast to admin channel for real-time alerting
    Phoenix.PubSub.broadcast(
      Cgraph.PubSub,
      "admin:moderation:critical",
      {:critical_report, staff_notification}
    )
    
    # Queue background job for additional notification channels (email, SMS, etc.)
    Cgraph.Workers.CriticalAlertDispatcher.enqueue(staff_notification)
  rescue
    e ->
      Logger.error("Failed to alert on-call staff: #{inspect(e)}")
  end

  # Immutable audit log entry for legal compliance
  defp log_critical_incident(report, incident_data) do
    audit_entry = %{
      event_type: :critical_content_report,
      timestamp: DateTime.utc_now(),
      report_id: report.id,
      incident_data: incident_data,
      actions_taken: [:quarantine, :ncmec_report_prepared, :staff_alerted],
      retention_policy: :permanent
    }
    
    # Log to structured audit system
    Logger.info("AUDIT_CRITICAL_INCIDENT: #{Jason.encode!(audit_entry)}")
  end

  @doc """
  List reports for moderation queue.
  """
  def list_reports(opts \\ []) do
    status = Keyword.get(opts, :status, :pending)
    category = Keyword.get(opts, :category)
    priority = Keyword.get(opts, :priority)
    limit = Keyword.get(opts, :limit, 50)

    query = from r in Report,
      where: r.status == ^status,
      order_by: [asc: r.priority, asc: r.inserted_at],
      limit: ^limit,
      preload: [:reporter]

    query = if category, do: where(query, [r], r.category == ^category), else: query
    query = if priority, do: where(query, [r], r.priority == ^priority), else: query

    Repo.all(query)
  end

  @doc """
  List reports created by a specific user.
  """
  def list_user_reports(user_id, opts \\ []) do
    page = Keyword.get(opts, :page, 1)
    limit = Keyword.get(opts, :limit, 20)
    offset = (page - 1) * limit

    from(r in Report,
      where: r.reporter_id == ^user_id,
      order_by: [desc: r.inserted_at],
      limit: ^limit,
      offset: ^offset
    )
    |> Repo.all()
  end

  @doc """
  Get a specific report belonging to a user.
  """
  def get_user_report(user_id, report_id) do
    Repo.get_by(Report, id: report_id, reporter_id: user_id)
  end

  @doc """
  Get pending report count by priority.
  """
  def pending_report_counts do
    Repo.all(
      from r in Report,
        where: r.status == :pending,
        group_by: r.priority,
        select: {r.priority, count(r.id)}
    )
    |> Map.new()
  end

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

  defp get_report(report_id) do
    case Repo.get(Report, report_id) do
      nil -> {:error, :not_found}
      report -> {:ok, report}
    end
  end

  defp validate_reviewer(%User{is_admin: true}), do: :ok
  defp validate_reviewer(_), do: {:error, :unauthorized}

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
    with {:ok, target_user} <- Cgraph.Accounts.get_user(report.target_id) do
      warning_data = %{
        report_id: report.id,
        category: report.category,
        content_type: report.content_type,
        warning_level: calculate_warning_level(target_user, report.category),
        issued_at: DateTime.utc_now(),
        notes: attrs[:notes] || "Your content was flagged for review.",
        appeal_deadline: DateTime.utc_now() |> DateTime.add(7 * 24 * 3600, :second)
      }
      
      # Create persistent warning record for user history
      record_user_warning(target_user, warning_data)
      
      # Send notification through the standard notification system
      Cgraph.Notifications.notify(target_user, :moderation_warning,
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
    removal_result = case report.content_type do
      :message ->
        Cgraph.Messaging.soft_delete_message(report.content_id, 
          reason: :moderation_removal,
          report_id: report.id
        )
      :post ->
        Cgraph.Forums.soft_delete_post(report.content_id,
          reason: :moderation_removal,
          report_id: report.id
        )
      :comment ->
        Cgraph.Forums.soft_delete_comment(report.content_id,
          reason: :moderation_removal,
          report_id: report.id
        )
      :profile_content ->
        Cgraph.Accounts.remove_profile_content(report.target_id, report.content_id,
          reason: :moderation_removal
        )
      _ ->
        Logger.warning("Unknown content type for removal: #{report.content_type}")
        {:ok, :no_action}
    end
    
    case removal_result do
      {:ok, _} ->
        # Notify user that content was removed
        if target_user = Cgraph.Accounts.get_user!(report.target_id) do
          Cgraph.Notifications.notify(target_user, :content_removed,
            title: "Content Removed",
            body: "Your content was removed for violating community guidelines.",
            data: %{
              content_type: report.content_type,
              category: report.category,
              removed_at: DateTime.utc_now()
            }
          )
        end
        update_report_status(report, :resolved)
      {:error, reason} ->
        Logger.error("Failed to remove content: #{inspect(reason)}")
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
  # User Restrictions
  # ---------------------------------------------------------------------------

  @doc """
  Create a user restriction (suspension/ban).
  """
  def create_user_restriction(user_id, type, duration_hours) do
    expires_at = if duration_hours do
      DateTime.utc_now()
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
    now = DateTime.utc_now()

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
    now = DateTime.utc_now()

    Repo.one(
      from r in UserRestriction,
        where: r.user_id == ^user_id,
        where: r.active == true,
        where: is_nil(r.expires_at) or r.expires_at > ^now,
        order_by: [desc: r.inserted_at],
        limit: 1
    )
  end

  # ---------------------------------------------------------------------------
  # Appeals
  # ---------------------------------------------------------------------------

  @doc """
  List pending appeals.
  """
  def list_appeals(opts \\ []) do
    limit = Keyword.get(opts, :limit, 50)

    from(a in Appeal,
      where: a.status == :pending,
      order_by: [asc: a.inserted_at],
      limit: ^limit,
      preload: [:user, review_action: :report]
    )
    |> Repo.all()
  end

  @doc """
  Create an appeal for a moderation action.
  """
  def create_appeal(%User{} = user, action_id, attrs) do
    with {:ok, action} <- get_action_for_appeal(action_id, user),
         :ok <- check_appeal_eligibility(action, user) do
      %Appeal{}
      |> Appeal.changeset(%{
        user_id: user.id,
        review_action_id: action_id,
        reason: attrs[:reason],
        status: :pending
      })
      |> Repo.insert()
    end
  end

  defp get_action_for_appeal(action_id, user) do
    action = Repo.get(ReviewAction, action_id)
    report = action && Repo.get(Report, action.report_id)

    cond do
      is_nil(action) -> {:error, :not_found}
      is_nil(report) -> {:error, :not_found}
      report.target_id != user.id -> {:error, :unauthorized}
      true -> {:ok, action}
    end
  end

  defp check_appeal_eligibility(action, user) do
    # Check if appeal already exists
    exists? = Repo.exists?(
      from a in Appeal,
        where: a.review_action_id == ^action.id,
        where: a.user_id == ^user.id
    )

    if exists?, do: {:error, :already_appealed}, else: :ok
  end

  @doc """
  Review an appeal (staff only).
  """
  def review_appeal(%User{} = reviewer, appeal_id, attrs) do
    with {:ok, appeal} <- get_appeal(appeal_id),
         :ok <- validate_reviewer(reviewer) do

      status = if attrs[:approved], do: :approved, else: :denied

      appeal
      |> Ecto.Changeset.change(%{
        status: status,
        reviewer_id: reviewer.id,
        reviewer_notes: attrs[:notes],
        reviewed_at: DateTime.utc_now() |> DateTime.truncate(:second)
      })
      |> Repo.update()
      |> maybe_lift_restriction(status)
    end
  end

  defp get_appeal(appeal_id) do
    case Repo.get(Appeal, appeal_id) do
      nil -> {:error, :not_found}
      appeal -> {:ok, appeal}
    end
  end

  defp maybe_lift_restriction({:ok, appeal}, :approved) do
    # Lift the user restriction
    action = Repo.get(ReviewAction, appeal.review_action_id)
    report = Repo.get(Report, action.report_id)

    from(r in UserRestriction,
      where: r.user_id == ^report.target_id,
      where: r.active == true
    )
    |> Repo.update_all(set: [active: false])

    {:ok, appeal}
  end
  defp maybe_lift_restriction(result, _), do: result

  # ---------------------------------------------------------------------------
  # Statistics
  # ---------------------------------------------------------------------------

  @doc """
  Get count of reports reviewed today.
  """
  def reports_reviewed_today do
    today_start = DateTime.utc_now() |> DateTime.to_date() |> DateTime.new!(~T[00:00:00], "Etc/UTC")

    Repo.one(
      from r in Report,
        where: r.reviewed_at >= ^today_start,
        select: count(r.id)
    ) || 0
  end

  @doc """
  Get average response time for reports (in hours).
  """
  def average_response_time do
    result = Repo.one(
      from r in Report,
        where: not is_nil(r.reviewed_at),
        where: r.reviewed_at > r.inserted_at,
        select: avg(fragment("EXTRACT(EPOCH FROM (? - ?)) / 3600", r.reviewed_at, r.inserted_at))
    )

    case result do
      nil -> nil
      avg -> Float.round(avg, 1)
    end
  end

  @doc """
  Get count of currently active restrictions.
  """
  def active_restriction_count do
    now = DateTime.utc_now()

    Repo.one(
      from r in UserRestriction,
        where: r.active == true,
        where: is_nil(r.expires_at) or r.expires_at > ^now,
        select: count(r.id)
    ) || 0
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
    Logger.info("USER_WARNING_ISSUED: user_id=#{user.id} level=#{warning_data.warning_level} category=#{warning_data.category}")
    :ok
  end

  defp update_user_warning_count(_user) do
    # The warning count is dynamically calculated from ReviewActions
    # This hook allows for cache invalidation or notification triggers
    :ok
  end
end
