defmodule CGraph.Groups.Moderation do
  @moduledoc """
  Group-scoped moderation context.

  Provides report querying and review scoped to a specific group,
  enabling group moderators (with manage_messages or ban_members
  permissions) to handle reports targeting content within their group.
  """

  import Ecto.Query, warn: false

  alias CGraph.Groups
  alias CGraph.Groups.Members
  alias CGraph.Moderation.Report
  alias CGraph.Moderation.ReviewAction
  alias CGraph.Repo

  # ---------------------------------------------------------------------------
  # Report Queries
  # ---------------------------------------------------------------------------

  @doc """
  List reports targeting content within a specific group.

  Joins reports to messages via channel_id → channels.group_id to scope
  results to the given group. Supports status filtering and pagination.

  ## Options

  - `:status` — Filter by report status (pending, reviewing, resolved, dismissed)
  - `:page` — Page number (default 1)
  - `:limit` — Results per page (default 20, max 100)
  """
  @spec list_group_reports(binary(), keyword()) :: {list(), map()}
  def list_group_reports(group_id, opts \\ []) do
    status = Keyword.get(opts, :status)
    page = max(Keyword.get(opts, :page, 1), 1)
    limit = min(Keyword.get(opts, :limit, 20), 100)
    offset = (page - 1) * limit

    base_query = group_reports_query(group_id)

    query =
      if status do
        status_atom = if is_binary(status), do: String.to_existing_atom(status), else: status
        from(r in base_query, where: r.status == ^status_atom)
      else
        base_query
      end

    total = Repo.aggregate(query, :count)

    reports =
      query
      |> order_by([r], [asc: r.priority, asc: r.inserted_at])
      |> limit(^limit)
      |> offset(^offset)
      |> preload([:reporter, :review_actions])
      |> Repo.all()

    meta = %{
      page: page,
      per_page: limit,
      total: total,
      total_pages: ceil(total / max(limit, 1))
    }

    {reports, meta}
  end

  @doc """
  Get a single report scoped to the group.

  Returns the report only if the target content belongs to the group.
  """
  @spec get_group_report(binary(), binary()) :: {:ok, Report.t()} | {:error, :not_found}
  def get_group_report(group_id, report_id) do
    query =
      from(r in group_reports_query(group_id),
        where: r.id == ^report_id,
        preload: [:reporter, review_actions: [:reviewer]]
      )

    case Repo.one(query) do
      nil -> {:error, :not_found}
      report -> {:ok, report}
    end
  end

  @doc """
  Review a report as a group moderator.

  Verifies the moderator has appropriate group permissions before
  delegating to the platform enforcement system.

  ## Parameters

  - `report_id` — ID of the report to review
  - `moderator_id` — User ID of the group moderator
  - `group_id` — Group ID for authorization
  - `attrs` — Action attributes (action, notes, duration_hours)
  """
  @spec review_group_report(binary(), binary(), binary(), map()) ::
          {:ok, Report.t()} | {:error, term()}
  def review_group_report(report_id, moderator_id, group_id, attrs) do
    with {:ok, group} <- Groups.get_group(group_id),
         moderator when not is_nil(moderator) <- Members.get_member_by_user(group, moderator_id),
         :ok <- verify_moderation_permission(moderator, group, attrs),
         {:ok, report} <- get_group_report(group_id, report_id),
         {:ok, reviewed} <- do_review(report, moderator_id, attrs) do
      {:ok, reviewed}
    else
      nil -> {:error, :not_found}
      error -> error
    end
  end

  @doc """
  Moderation statistics for a group dashboard.

  Returns counts of pending reports, recent review actions,
  and active bans.
  """
  @spec group_moderation_stats(binary()) :: map()
  def group_moderation_stats(group_id) do
    base = group_reports_query(group_id)

    pending_count =
      from(r in base, where: r.status == :pending)
      |> Repo.aggregate(:count)

    reviewing_count =
      from(r in base, where: r.status == :reviewing)
      |> Repo.aggregate(:count)

    resolved_count =
      from(r in base, where: r.status in [:resolved, :dismissed])
      |> Repo.aggregate(:count)

    recent_actions_count =
      from(ra in ReviewAction,
        join: r in Report, on: ra.report_id == r.id,
        where: r.id in subquery(from(rr in base, select: rr.id)),
        where: ra.inserted_at > ago(7, "day")
      )
      |> Repo.aggregate(:count)

    %{
      pending_reports: pending_count,
      reviewing_reports: reviewing_count,
      resolved_reports: resolved_count,
      recent_actions_7d: recent_actions_count
    }
  end

  # ---------------------------------------------------------------------------
  # Private Helpers
  # ---------------------------------------------------------------------------

  # Build a base query for reports targeting content in a given group.
  # Matches message reports via channel → group, and user reports via group members.
  defp group_reports_query(group_id) do
    message_ids =
      from(m in CGraph.Messaging.Message,
        join: c in CGraph.Groups.Channel, on: m.channel_id == c.id,
        where: c.group_id == ^group_id,
        select: type(m.id, :binary_id)
      )

    from(r in Report,
      where:
        (r.target_type == :message and r.target_id in subquery(message_ids)) or
        (r.target_type == :group and r.target_id == ^group_id)
    )
  end

  # Verify the moderator has the right permission for the given action.
  defp verify_moderation_permission(member, group, attrs) do
    action = attrs[:action]

    required_perm =
      case action do
        a when a in [:ban, :suspend] -> :ban_members
        _ -> :manage_messages
      end

    if group.owner_id == member.user_id do
      :ok
    else
      case Groups.Roles.has_permission?(member, required_perm) do
        true -> :ok
        false -> {:error, :insufficient_permissions}
      end
    end
  end

  # Perform the actual review: create review action and update report status.
  defp do_review(report, moderator_id, attrs) do
    action = attrs[:action]

    review_attrs = %{
      report_id: report.id,
      reviewer_id: moderator_id,
      action: action,
      notes: attrs[:notes],
      duration_hours: attrs[:duration_hours]
    }

    Repo.transaction(fn ->
      case %ReviewAction{}
           |> ReviewAction.changeset(review_attrs)
           |> Repo.insert() do
        {:ok, _review_action} ->
          status = if action == :dismiss, do: :dismissed, else: :resolved

          {:ok, updated} =
            report
            |> Ecto.Changeset.change(%{
              status: status,
              reviewed_at: DateTime.utc_now() |> DateTime.truncate(:second)
            })
            |> Repo.update()

          Repo.preload(updated, [:reporter, review_actions: [:reviewer]])

        {:error, changeset} ->
          Repo.rollback(changeset)
      end
    end)
  end
end
