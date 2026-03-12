defmodule CGraph.Compliance.AMLMonitor do
  @moduledoc """
  AML (Anti-Money Laundering) monitoring context.

  Provides pattern detection for suspicious transaction activity:
  - Circular tipping between user pairs
  - Rapid transaction volume spikes
  - Structuring (splitting amounts to avoid thresholds)

  Flags are recorded in the `aml_flags` table for admin review.
  """

  import Ecto.Query, warn: false

  alias CGraph.Repo
  alias CGraph.Compliance.AMLFlag
  alias CGraph.Nodes.NodeTransaction

  require Logger

  # ── Pattern Detection ───────────────────────────────────────────

  @doc """
  Runs all AML pattern checks for a user and creates flags for matches.
  """
  @spec scan_user(String.t()) :: {:ok, non_neg_integer()}
  def scan_user(user_id) do
    checks = [
      &check_circular_tips/1,
      &check_rapid_volume/1,
      &check_structuring/1
    ]

    flag_count =
      Enum.reduce(checks, 0, fn check, acc ->
        case check.(user_id) do
          {:flagged, _} -> acc + 1
          :clean -> acc
        end
      end)

    {:ok, flag_count}
  end

  @doc """
  Detects circular tipping — tip_sent and tip_received between the same
  user pairs within 7 days with amounts within 20% of each other.
  """
  @spec check_circular_tips(String.t()) :: {:flagged, map()} | :clean
  def check_circular_tips(user_id) do
    seven_days_ago = DateTime.utc_now() |> DateTime.add(-7, :day)

    # Find users this person sent tips to
    sent_query =
      from(t in NodeTransaction,
        where:
          t.user_id == ^user_id and
            t.type == "tip_sent" and
            t.inserted_at >= ^seven_days_ago,
        select: %{reference_id: t.reference_id, amount: t.amount}
      )

    sent_tips = Repo.all(sent_query)

    # For each recipient, check if they also sent tips back with similar amounts
    flagged_pairs =
      Enum.reduce(sent_tips, [], fn %{reference_id: recipient_id, amount: sent_amount}, acc ->
        if is_nil(recipient_id) do
          acc
        else
          received_back =
            from(t in NodeTransaction,
              where:
                t.user_id == ^recipient_id and
                  t.type == "tip_sent" and
                  t.reference_id == ^user_id and
                  t.inserted_at >= ^seven_days_ago,
              select: t.amount
            )
            |> Repo.all()

          matching =
            Enum.any?(received_back, fn received_amount ->
              abs_sent = abs(sent_amount)
              abs_received = abs(received_amount)
              abs_sent > 0 and abs(abs_sent - abs_received) / abs_sent <= 0.20
            end)

          if matching, do: [recipient_id | acc], else: acc
        end
      end)
      |> Enum.uniq()

    if Enum.any?(flagged_pairs) do
      details = %{pattern: "circular_tips", counterparties: flagged_pairs, window_days: 7}
      flag_suspicious(user_id, "circular_tips", details)
      {:flagged, details}
    else
      :clean
    end
  end

  @doc """
  Detects rapid transaction volume — more than 10 tip_sent in 1 hour.
  """
  @spec check_rapid_volume(String.t()) :: {:flagged, map()} | :clean
  def check_rapid_volume(user_id) do
    one_hour_ago = DateTime.utc_now() |> DateTime.add(-1, :hour)

    count =
      from(t in NodeTransaction,
        where:
          t.user_id == ^user_id and
            t.type == "tip_sent" and
            t.inserted_at >= ^one_hour_ago,
        select: count(t.id)
      )
      |> Repo.one()

    if count > 10 do
      details = %{pattern: "rapid_volume", tip_count: count, window_hours: 1}
      flag_suspicious(user_id, "rapid_volume", details)
      {:flagged, details}
    else
      :clean
    end
  end

  @doc """
  Detects structuring — tips with amounts between 900-999 Nodes
  (just below the 1000 reporting threshold). Flags if >3 in 30 days.
  """
  @spec check_structuring(String.t()) :: {:flagged, map()} | :clean
  def check_structuring(user_id) do
    thirty_days_ago = DateTime.utc_now() |> DateTime.add(-30, :day)

    count =
      from(t in NodeTransaction,
        where:
          t.user_id == ^user_id and
            t.type == "tip_sent" and
            t.inserted_at >= ^thirty_days_ago and
            fragment("ABS(?) BETWEEN 900 AND 999", t.amount),
        select: count(t.id)
      )
      |> Repo.one()

    if count > 3 do
      details = %{pattern: "structuring", near_threshold_count: count, window_days: 30}
      flag_suspicious(user_id, "structuring", details)
      {:flagged, details}
    else
      :clean
    end
  end

  # ── Flag Management ────────────────────────────────────────────

  @doc """
  Creates a suspicious activity flag for a user.
  """
  @spec flag_suspicious(String.t(), String.t(), map()) :: {:ok, AMLFlag.t()} | {:error, term()}
  def flag_suspicious(user_id, pattern_type, details) do
    severity = severity_for_pattern(pattern_type)

    %AMLFlag{}
    |> AMLFlag.changeset(%{
      user_id: user_id,
      pattern_type: pattern_type,
      details: details,
      severity: severity,
      status: "open"
    })
    |> Repo.insert()
  end

  @doc """
  Lists AML flags with optional status filter and pagination.
  """
  @spec list_flags(keyword()) :: [AMLFlag.t()]
  def list_flags(opts \\ []) do
    status = Keyword.get(opts, :status)
    limit = Keyword.get(opts, :limit, 50)
    offset = Keyword.get(opts, :offset, 0)

    query =
      from(f in AMLFlag,
        order_by: [desc: f.inserted_at],
        limit: ^limit,
        offset: ^offset
      )

    query = if status, do: where(query, [f], f.status == ^status), else: query

    Repo.all(query)
  end

  @doc """
  Reviews a flag — updates status and records the reviewer.
  """
  @spec review_flag(String.t(), String.t(), String.t()) ::
          {:ok, AMLFlag.t()} | {:error, term()}
  def review_flag(flag_id, admin_id, new_status) do
    case Repo.get(AMLFlag, flag_id) do
      nil ->
        {:error, :not_found}

      flag ->
        flag
        |> AMLFlag.changeset(%{
          status: new_status,
          reviewed_by: admin_id,
          reviewed_at: DateTime.utc_now() |> DateTime.truncate(:second)
        })
        |> Repo.update()
    end
  end

  # ── Private ────────────────────────────────────────────────────

  defp severity_for_pattern("circular_tips"), do: "high"
  defp severity_for_pattern("structuring"), do: "high"
  defp severity_for_pattern("rapid_volume"), do: "medium"
  defp severity_for_pattern(_other), do: "low"
end
