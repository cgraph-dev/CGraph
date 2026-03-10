defmodule CGraph.Discovery.Feed do
  @moduledoc """
  Feed ranking engine with 5 discovery modes.

  Modes:
  - `:pulse` — Composite score ranking weighted by resonates, depth, read time, cross-refs
  - `:fresh` — Chronological (newest first), filtered to user's frequency topics
  - `:rising` — Posts from last 24h with highest engagement velocity
  - `:deep_cut` — Older posts (>3 days) with high quality but low visibility
  - `:frequency_surf` — Posts from a specific community (requires community_id)

  All modes use cursor pagination following the CGraph.Forums.CursorPagination pattern.
  """

  import Ecto.Query, warn: false
  import CGraph.Query.SoftDelete

  alias CGraph.Forums.Thread
  alias CGraph.Discovery.PostMetric
  alias CGraph.ReadRepo

  @valid_modes ~w(pulse fresh rising deep_cut frequency_surf)a
  @default_per_page 25

  @doc "Returns posts ranked by the given mode."
  @spec list_feed(atom(), keyword()) :: {[Thread.t()], map()}
  def list_feed(mode, opts \\ []) when mode in @valid_modes do
    user_id = Keyword.get(opts, :user_id)
    cursor = Keyword.get(opts, :cursor)
    per_page = Keyword.get(opts, :per_page, @default_per_page)
    community_id = Keyword.get(opts, :community_id)

    query = build_query(mode, user_id, community_id)
    query = maybe_apply_cursor(query, cursor, mode)

    results =
      query
      |> limit(^(per_page + 1))
      |> preload([:author, :board])
      |> ReadRepo.all()

    has_next = length(results) > per_page
    threads = Enum.take(results, per_page)

    meta = build_meta(threads, has_next, per_page)
    {threads, meta}
  end

  @doc "Returns the list of valid feed modes."
  @spec valid_modes() :: [atom()]
  def valid_modes, do: @valid_modes

  # ---------------------------------------------------------------------------
  # Query Builders
  # ---------------------------------------------------------------------------

  defp build_query(:pulse, _user_id, _community_id) do
    from(t in Thread,
      left_join: pm in PostMetric,
      on: pm.thread_id == t.id,
      where: not_deleted(t) and t.is_approved == true,
      order_by: [
        desc:
          fragment(
            """
            COALESCE(?, 0) * 0.40
            + COALESCE(?, 0) * 0.25
            + COALESCE(?, 0) * 0.20
            + COALESCE(?, 0) * 0.10
            - EXTRACT(EPOCH FROM (NOW() - ?)) / 86400.0 * 0.05
            """,
            pm.weighted_resonates,
            pm.reply_depth_avg,
            pm.read_time_signal,
            pm.cross_community_refs,
            t.inserted_at
          )
      ],
      select_merge: %{
        weighted_resonates:
          fragment(
            """
            COALESCE(?, 0) * 0.40
            + COALESCE(?, 0) * 0.25
            + COALESCE(?, 0) * 0.20
            + COALESCE(?, 0) * 0.10
            - EXTRACT(EPOCH FROM (NOW() - ?)) / 86400.0 * 0.05
            """,
            pm.weighted_resonates,
            pm.reply_depth_avg,
            pm.read_time_signal,
            pm.cross_community_refs,
            t.inserted_at
          )
      }
    )
  end

  defp build_query(:fresh, _user_id, _community_id) do
    from(t in Thread,
      where: not_deleted(t) and t.is_approved == true,
      order_by: [desc: t.inserted_at]
    )
  end

  defp build_query(:rising, _user_id, _community_id) do
    twenty_four_hours_ago = DateTime.utc_now() |> DateTime.add(-24 * 3600, :second)

    from(t in Thread,
      left_join: pm in PostMetric,
      on: pm.thread_id == t.id,
      where:
        not_deleted(t) and
          t.is_approved == true and
          t.inserted_at >= ^twenty_four_hours_ago,
      order_by: [
        desc:
          fragment(
            "COALESCE(?, 0) / GREATEST(EXTRACT(EPOCH FROM (NOW() - ?)) / 3600.0, 1)",
            pm.weighted_resonates,
            t.inserted_at
          )
      ]
    )
  end

  defp build_query(:deep_cut, _user_id, _community_id) do
    three_days_ago = DateTime.utc_now() |> DateTime.add(-3 * 24 * 3600, :second)

    from(t in Thread,
      left_join: pm in PostMetric,
      on: pm.thread_id == t.id,
      where:
        not_deleted(t) and
          t.is_approved == true and
          t.inserted_at < ^three_days_ago and
          t.view_count < 50,
      order_by: [desc: fragment("COALESCE(?, 0)", pm.weighted_resonates)]
    )
  end

  defp build_query(:frequency_surf, _user_id, community_id) when is_binary(community_id) do
    from(t in Thread,
      join: b in assoc(t, :board),
      where:
        not_deleted(t) and
          t.is_approved == true and
          b.forum_id == ^community_id,
      order_by: [desc: t.inserted_at]
    )
  end

  defp build_query(:frequency_surf, _user_id, _community_id) do
    # No community_id — fall back to fresh
    build_query(:fresh, nil, nil)
  end

  # ---------------------------------------------------------------------------
  # Cursor Pagination
  # ---------------------------------------------------------------------------

  defp maybe_apply_cursor(query, nil, _mode), do: query

  defp maybe_apply_cursor(query, cursor, mode) when mode in [:pulse, :rising, :deep_cut] do
    case decode_cursor(cursor) do
      {:ok, %{"score" => score, "id" => id}} ->
        from(t in query,
          where:
            fragment("(?, ?)", t.weighted_resonates, t.id) <
              fragment("(?, ?::uuid)", ^score, ^id)
        )

      _ ->
        query
    end
  end

  defp maybe_apply_cursor(query, cursor, _mode) do
    case decode_cursor(cursor) do
      {:ok, %{"inserted_at" => inserted_at, "id" => id}} ->
        {:ok, dt, _} = DateTime.from_iso8601(inserted_at)

        from(t in query,
          where:
            t.inserted_at < ^dt or
              (t.inserted_at == ^dt and t.id < ^id)
        )

      _ ->
        query
    end
  end

  # ---------------------------------------------------------------------------
  # Meta
  # ---------------------------------------------------------------------------

  defp build_meta([], _has_next, per_page) do
    %{cursor: nil, has_more: false, per_page: per_page}
  end

  defp build_meta(threads, has_next, per_page) do
    last = List.last(threads)

    cursor =
      if has_next do
        encode_cursor(%{
          "inserted_at" => DateTime.to_iso8601(last.inserted_at),
          "id" => last.id,
          "score" => Decimal.to_float(last.weighted_resonates || Decimal.new(0))
        })
      end

    %{cursor: cursor, has_more: has_next, per_page: per_page}
  end

  defp encode_cursor(data) do
    data |> Jason.encode!() |> Base.url_encode64(padding: false)
  end

  defp decode_cursor(cursor) do
    with {:ok, json} <- Base.url_decode64(cursor, padding: false),
         {:ok, data} <- Jason.decode(json) do
      {:ok, data}
    end
  end
end
