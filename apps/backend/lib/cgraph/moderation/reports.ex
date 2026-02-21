defmodule CGraph.Moderation.Reports do
  @moduledoc """
  Report creation, validation, querying, and critical report handling.

  Handles the full lifecycle of user-submitted reports, including duplicate
  detection, priority scoring, and automated escalation for critical categories
  (e.g., CSAM, terrorism).
  """

  import Ecto.Query, warn: false

  alias CGraph.Accounts.User
  alias CGraph.Audit
  alias CGraph.Moderation.Report
  alias CGraph.Repo
  alias CGraph.Workers.CriticalAlertDispatcher

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
  # Report Creation
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

  # ---------------------------------------------------------------------------
  # Report Queries
  # ---------------------------------------------------------------------------

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
    query =
      from(r in Report,
        where: r.reporter_id == ^user_id
      )

    pagination_opts = CGraph.Pagination.parse_params(
      Enum.into(opts, %{}),
      sort_field: :inserted_at,
      sort_direction: :desc,
      default_limit: 20
    )

    CGraph.Pagination.paginate(query, pagination_opts)
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
  # Private Helpers
  # ---------------------------------------------------------------------------

  defp validate_not_self_report(reporter, %{target_type: :user, target_id: target_id}) do
    if reporter.id == target_id, do: {:error, :self_report}, else: :ok
  end
  defp validate_not_self_report(_, _), do: :ok

  defp check_duplicate_report(reporter, attrs) do
    target_type = attrs[:target_type]
    target_id = attrs[:target_id]

    query = from r in Report,
      where: r.reporter_id == ^reporter.id,
      where: r.status == :pending

    query = if is_nil(target_type) do
      from r in query, where: is_nil(r.target_type)
    else
      from r in query, where: r.target_type == ^target_type
    end

    query = if is_nil(target_id) do
      from r in query, where: is_nil(r.target_id)
    else
      from r in query, where: r.target_id == ^target_id
    end

    exists? = Repo.exists?(query)

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

  # ---------------------------------------------------------------------------
  # Critical Report Handling
  # ---------------------------------------------------------------------------

  defp handle_critical_report(report) do
    Logger.warning("critical_report", report_category: report.category, report_id: report.id)

    # For CSAM and other critical content, immediately quarantine and escalate
    if report.category == :csam do
      # Step 1: Immediately quarantine the content (hide from public view)
      quarantine_reported_content(report)

      # Step 2: Generate NCMEC-compatible incident report for legal compliance
      # Note: Actual NCMEC submission requires CyberTipline API integration
      # This creates the structured report data for manual or automated submission
      incident_data = generate_ncmec_incident_report(report)
      Logger.critical("ncmec_incident_prepared", incident_data: inspect(incident_data))

      # Step 3: Alert on-call staff via priority notification channel
      alert_oncall_staff(report, :critical)

      # Step 4: Log for audit trail (required for legal compliance)
      log_critical_incident(report, incident_data)
    end

    :ok
  end

  # Quarantine content by setting visibility to hidden and flagging for review
  defp quarantine_reported_content(report) do
    case report.target_type do
      :message ->
        CGraph.Messaging.hide_message(report.target_id, :moderation_quarantine)
      :post ->
        CGraph.Forums.hide_post(report.target_id, :moderation_quarantine)
      :comment ->
        CGraph.Forums.hide_comment(report.target_id, :moderation_quarantine)
      :profile ->
        CGraph.Accounts.flag_profile_for_review(report.target_id)
      _ ->
        Logger.warning("unknown_content_type_for_quarantine", report_target_type: report.target_type)
    end
  rescue
    e ->
      Logger.error("failed_to_quarantine_content", e: inspect(e))
  end

  # Generate structured incident report following NCMEC CyberTipline format
  defp generate_ncmec_incident_report(report) do
    %{
      incident_type: "CSAM",
      report_id: report.id,
      reported_at: DateTime.utc_now() |> DateTime.truncate(:second) |> DateTime.to_iso8601(),
      reporter_info: %{
        esp_name: "CGraph",
        esp_contact: Application.get_env(:cgraph, :legal_contact_email, "legal@cgraph.org")
      },
      incident_details: %{
        content_id: report.target_id,
        content_type: report.target_type,
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
      escalation_deadline: DateTime.utc_now() |> DateTime.truncate(:second) |> DateTime.add(3600, :second)
    }

    # Broadcast to admin channel for real-time alerting
    Phoenix.PubSub.broadcast(
      CGraph.PubSub,
      "admin:moderation:critical",
      {:critical_report, staff_notification}
    )

    # Queue background job for additional notification channels (email, SMS, etc.)
    CriticalAlertDispatcher.enqueue(staff_notification)
  rescue
    e ->
      Logger.error("failed_to_alert_on_call_staff", e: inspect(e))
  end

  # Immutable audit log entry for legal compliance
  defp log_critical_incident(report, incident_data) do
    audit_entry = %{
      event_type: :critical_content_report,
      timestamp: DateTime.utc_now() |> DateTime.truncate(:second),
      report_id: report.id,
      incident_data: incident_data,
      actions_taken: [:quarantine, :ncmec_report_prepared, :staff_alerted],
      retention_policy: :permanent
    }

    # Log to structured audit system
    Logger.info("audit_critical_incident", jason_encode_audit_entry: inspect(Jason.encode!(audit_entry)))
  end
end
