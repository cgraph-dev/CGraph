defmodule CGraph.Enterprise.AnalyticsDashboard do
  @moduledoc """
  Enterprise analytics dashboard data aggregation.

  Provides platform-wide and per-organization analytics including
  user engagement, message activity, growth metrics, and time-series data.
  """

  alias CGraph.Repo

  import Ecto.Query

  @doc "Get platform-wide overview metrics."
  @spec platform_overview() :: {:ok, map()}
  def platform_overview do
    users_total = Repo.aggregate(from(u in "users", where: is_nil(u.deleted_at)), :count)
    groups_total = Repo.aggregate(from(g in "groups", where: is_nil(g.deleted_at)), :count)
    messages_today = count_today("messages")
    orgs_total = Repo.aggregate(from(o in "enterprise_organizations", where: is_nil(o.deleted_at)), :count)

    {:ok,
     %{
       users: %{total: users_total || 0},
       groups: %{total: groups_total || 0},
       organizations: %{total: orgs_total || 0},
       messages: %{today: messages_today || 0},
       generated_at: DateTime.utc_now()
     }}
  end

  @doc "Get analytics breakdown for a specific organization."
  @spec org_breakdown(String.t()) :: {:ok, map()}
  def org_breakdown(org_id) do
    members_count =
      Repo.aggregate(
        from(m in "enterprise_org_memberships", where: m.org_id == ^org_id),
        :count
      )

    groups_count =
      Repo.aggregate(
        from(g in "groups", where: g.org_id == ^org_id and is_nil(g.deleted_at)),
        :count
      )

    {:ok,
     %{
       org_id: org_id,
       members: members_count || 0,
       groups: groups_count || 0,
       generated_at: DateTime.utc_now()
     }}
  end

  @doc "Get time-series data for a metric over a period."
  @spec time_series(String.t(), String.t(), Date.t(), Date.t()) :: {:ok, list()}
  def time_series(metric, _org_id, start_date, end_date) do
    days = Date.range(start_date, end_date) |> Enum.to_list()

    series =
      Enum.map(days, fn date ->
        %{
          date: Date.to_iso8601(date),
          value: synthetic_value(metric, date)
        }
      end)

    {:ok, series}
  end

  @doc "Export analytics data as a flat list of maps (for CSV)."
  @spec export_csv(String.t(), keyword()) :: {:ok, list()}
  def export_csv(org_id, opts \\ []) do
    {:ok, breakdown} = org_breakdown(org_id)

    rows = [
      %{metric: "members", value: breakdown.members, org_id: org_id, exported_at: format_now()},
      %{metric: "groups", value: breakdown.groups, org_id: org_id, exported_at: format_now()}
    ]

    limit = Keyword.get(opts, :limit, 1000)
    {:ok, Enum.take(rows, limit)}
  end

  # ---------------------------------------------------------------------------
  # Helpers
  # ---------------------------------------------------------------------------

  defp count_today(table) do
    today = Date.utc_today()
    start_of_day = DateTime.new!(today, ~T[00:00:00], "Etc/UTC")

    Repo.aggregate(
      from(r in table, where: r.inserted_at >= ^start_of_day),
      :count
    )
  rescue
    _ -> 0
  end

  defp synthetic_value(_metric, _date) do
    # Placeholder — real implementation would query aggregate tables
    0
  end

  defp format_now do
    DateTime.to_iso8601(DateTime.utc_now())
  end
end
