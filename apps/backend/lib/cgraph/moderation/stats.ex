defmodule CGraph.Moderation.Stats do
  @moduledoc """
  Moderation statistics and metrics queries.

  Provides aggregate data for the moderation dashboard, including
  report review counts, response times, and active restrictions.
  """

  import Ecto.Query, warn: false

  alias CGraph.Moderation.Report
  alias CGraph.Moderation.UserRestriction
  alias CGraph.Repo

  @doc """
  Get count of reports reviewed today.
  """
  @spec reports_reviewed_today() :: non_neg_integer()
  def reports_reviewed_today do
    today_start = DateTime.utc_now() |> DateTime.truncate(:second) |> DateTime.to_date() |> DateTime.new!(~T[00:00:00], "Etc/UTC")

    Repo.one(
      from r in Report,
        where: r.reviewed_at >= ^today_start,
        select: count(r.id)
    ) || 0
  end

  @doc """
  Get average response time for reports (in hours).
  """
  @spec average_response_time() :: float() | nil
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
  @spec active_restriction_count() :: non_neg_integer()
  def active_restriction_count do
    now = DateTime.utc_now() |> DateTime.truncate(:second)

    Repo.one(
      from r in UserRestriction,
        where: r.active == true,
        where: is_nil(r.expires_at) or r.expires_at > ^now,
        select: count(r.id)
    ) || 0
  end
end
