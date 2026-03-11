defmodule CGraph.Cosmetics.Evaluators.EventEvaluator do
  @moduledoc """
  Evaluator for time-limited event unlock conditions.

  Checks whether the current UTC time falls within the event window
  defined by `starts_at` / `ends_at` in the condition.

  ## Condition Shape

      %{
        "type"      => "event",
        "starts_at" => "2026-12-01T00:00:00Z",
        "ends_at"   => "2026-12-31T23:59:59Z",
        "event_id"  => "winter_2026"             # optional metadata
      }

  Pure function — no database access or side effects.
  """

  @behaviour CGraph.Cosmetics.UnlockEvaluator

  @impl true
  @spec evaluate(map(), map()) :: {:ok, boolean()} | {:error, term()}
  def evaluate(_user, condition) do
    now = DateTime.utc_now()

    with {:ok, starts_at} <- parse_datetime(condition["starts_at"]),
         {:ok, ends_at} <- parse_datetime(condition["ends_at"]) do
      in_window? =
        DateTime.compare(now, starts_at) != :lt &&
          DateTime.compare(now, ends_at) != :gt

      {:ok, in_window?}
    end
  end

  # ── Private ───────────────────────────────────────────────────────────────

  defp parse_datetime(nil), do: {:error, :missing_datetime}
  defp parse_datetime(%DateTime{} = dt), do: {:ok, dt}

  defp parse_datetime(str) when is_binary(str) do
    case DateTime.from_iso8601(str) do
      {:ok, dt, _offset} -> {:ok, dt}
      {:error, _} = err -> err
    end
  end
end
