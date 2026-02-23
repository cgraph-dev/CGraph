defmodule CGraph.Moderation do
  @moduledoc """
  Content moderation and abuse reporting system.

  Delegates to focused submodules:

  - `CGraph.Moderation.Reports` — report creation, validation, querying, critical handling
  - `CGraph.Moderation.Enforcement` — review actions, user restrictions, warning escalation
  - `CGraph.Moderation.Appeals` — appeal creation and review
  - `CGraph.Moderation.Stats` — dashboard statistics

  ## Report Flow

  ```
  User Reports Content ──► Automatic Checks ──► Review Queue
                                                    │
                              ┌──────────────────────┴──────────┐
                              ▼                                  ▼
                    Warn / Suspend / Ban              Dismiss Report
                              │
                              ▼
                    User Can Appeal
  ```

  ## Usage

      {:ok, report} = Moderation.create_report(reporter, %{
        target_type: :message,
        target_id: message.id,
        category: :harassment,
        description: "User is sending threatening messages"
      })

      {:ok, report} = Moderation.review_report(staff, report_id, %{
        action: :warn,
        notes: "First offense, issued warning"
      })

      {:ok, appeal} = Moderation.create_appeal(user, action_id, %{
        reason: "This was a misunderstanding"
      })
  """

  # ---------------------------------------------------------------------------
  # Reports  (see CGraph.Moderation.Reports)
  # ---------------------------------------------------------------------------

  defdelegate report_categories, to: CGraph.Moderation.Reports
  defdelegate create_report(reporter, attrs), to: CGraph.Moderation.Reports
  defdelegate get_user_report(user_id, report_id), to: CGraph.Moderation.Reports
  defdelegate pending_report_counts, to: CGraph.Moderation.Reports

  @spec list_reports(keyword()) :: [map()]
  def list_reports(opts \\ []), do: CGraph.Moderation.Reports.list_reports(opts)

  @spec list_user_reports(String.t(), keyword()) :: [map()]
  def list_user_reports(user_id, opts \\ []), do: CGraph.Moderation.Reports.list_user_reports(user_id, opts)

  # ---------------------------------------------------------------------------
  # Enforcement  (see CGraph.Moderation.Enforcement)
  # ---------------------------------------------------------------------------

  defdelegate review_report(reviewer, report_id, attrs), to: CGraph.Moderation.Enforcement
  defdelegate create_user_restriction(user_id, type, duration_hours), to: CGraph.Moderation.Enforcement
  defdelegate user_restricted?(user_id), to: CGraph.Moderation.Enforcement
  defdelegate get_user_restriction(user_id), to: CGraph.Moderation.Enforcement

  # ---------------------------------------------------------------------------
  # Appeals  (see CGraph.Moderation.Appeals)
  # ---------------------------------------------------------------------------

  defdelegate create_appeal(user, action_id, attrs), to: CGraph.Moderation.Appeals
  defdelegate review_appeal(reviewer, appeal_id, attrs), to: CGraph.Moderation.Appeals

  @spec list_appeals(keyword()) :: [map()]
  def list_appeals(opts \\ []), do: CGraph.Moderation.Appeals.list_appeals(opts)

  # ---------------------------------------------------------------------------
  # Stats  (see CGraph.Moderation.Stats)
  # ---------------------------------------------------------------------------

  defdelegate reports_reviewed_today, to: CGraph.Moderation.Stats
  defdelegate average_response_time, to: CGraph.Moderation.Stats
  defdelegate active_restriction_count, to: CGraph.Moderation.Stats
end
