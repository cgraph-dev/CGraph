defmodule CGraph.Moderation.AuditLogs do
  @moduledoc """
  Context module for querying and creating moderation audit log entries.

  Provides convenience functions for logging AI decisions, human reviews,
  and appeal outcomes, as well as aggregation queries for dashboard stats.
  """

  import Ecto.Query, warn: false

  alias CGraph.Moderation.AuditLog
  alias CGraph.Repo

  # ---------------------------------------------------------------------------
  # Write Operations
  # ---------------------------------------------------------------------------

  @doc """
  Create a new audit log entry.

  ## Examples

      AuditLogs.log(%{
        target_type: "message",
        target_id: msg_id,
        action: "ai_block",
        ai_category: "spam",
        ai_confidence: 0.95,
        ai_action: "block",
        auto_actioned: true
      })
  """
  @spec log(map()) :: {:ok, AuditLog.t()} | {:error, Ecto.Changeset.t()}
  def log(attrs) do
    %AuditLog{}
    |> AuditLog.changeset(stringify_keys(attrs))
    |> Repo.insert()
  end

  # ---------------------------------------------------------------------------
  # Read Operations
  # ---------------------------------------------------------------------------

  @doc """
  Get audit trail for a specific target (message, post, user, etc.).
  """
  @spec for_target(String.t(), String.t()) :: [AuditLog.t()]
  def for_target(type, id) do
    AuditLog
    |> where([l], l.target_type == ^type and l.target_id == ^id)
    |> order_by([l], desc: l.inserted_at)
    |> Repo.all()
  end

  @doc """
  Get audit logs filtered by action within a date range.
  """
  @spec by_action(String.t(), non_neg_integer()) :: [AuditLog.t()]
  def by_action(action, days \\ 30) do
    cutoff = DateTime.utc_now() |> DateTime.add(-days * 86_400, :second)

    AuditLog
    |> where([l], l.action == ^action and l.inserted_at >= ^cutoff)
    |> order_by([l], desc: l.inserted_at)
    |> Repo.all()
  end

  @doc """
  Aggregate AI decisions by category, confidence, and action over a time range.

  Returns a list of maps with grouped counts for dashboard visualization.
  """
  @spec ai_stats(non_neg_integer()) :: [map()]
  def ai_stats(days \\ 30) do
    cutoff = DateTime.utc_now() |> DateTime.add(-days * 86_400, :second)

    AuditLog
    |> where([l], l.inserted_at >= ^cutoff and not is_nil(l.ai_action))
    |> group_by([l], [l.ai_action, l.auto_actioned])
    |> select([l], %{
      ai_action: l.ai_action,
      auto_actioned: l.auto_actioned,
      count: count(l.id)
    })
    |> Repo.all()
  end

  # ---------------------------------------------------------------------------
  # Private Helpers
  # ---------------------------------------------------------------------------

  defp stringify_keys(map) when is_map(map) do
    Map.new(map, fn
      {k, v} when is_atom(k) -> {Atom.to_string(k), v}
      {k, v} -> {k, v}
    end)
  end
end
