defmodule CGraph.Discovery.CommunityHealth do
  @moduledoc """
  Community health scoring — backend-only, never exposed to API.

  Five-factor formula:
  - positive_ratio (30%): positive reactions / total reactions
  - new_voice_ratio (25%): posts by newer members / total posts
  - reply_depth (25%): avg reply depth normalized to target of 3
  - mod_action_penalty (10%): removal rate scaled
  - dominance_penalty (10%): top-poster concentration scaled

  Cached in ETS with 15-minute TTL.
  Used internally by Discovery.Feed to boost healthy community content.
  """

  import Ecto.Query, warn: false

  alias CGraph.ReadRepo

  @cache_table :community_health_cache
  @ttl_ms :timer.minutes(15)

  @doc "Initializes the ETS cache table. Call from Application supervision tree."
  @spec init_cache() :: :ok
  def init_cache do
    case :ets.info(@cache_table) do
      :undefined ->
        :ets.new(@cache_table, [:named_table, :set, :public, read_concurrency: true])

      _ ->
        :ok
    end

    :ok
  end

  @doc "Computes (or returns cached) community health score for a forum."
  @spec compute(binary()) :: float()
  def compute(forum_id) when is_binary(forum_id) do
    init_cache()

    case get_cached(forum_id) do
      {:ok, score} -> score
      :miss -> compute_and_cache(forum_id)
    end
  end

  # ---------------------------------------------------------------------------
  # Cache
  # ---------------------------------------------------------------------------

  defp get_cached(forum_id) do
    case :ets.lookup(@cache_table, forum_id) do
      [{^forum_id, score, expires_at}] ->
        if System.monotonic_time(:millisecond) < expires_at do
          {:ok, score}
        else
          :miss
        end

      [] ->
        :miss
    end
  end

  defp compute_and_cache(forum_id) do
    score = compute_score(forum_id)
    expires_at = System.monotonic_time(:millisecond) + @ttl_ms
    :ets.insert(@cache_table, {forum_id, score, expires_at})
    score
  end

  # ---------------------------------------------------------------------------
  # Score Computation
  # ---------------------------------------------------------------------------

  defp compute_score(forum_id) do
    positive_ratio = compute_positive_ratio(forum_id)
    new_voice_ratio = compute_new_voice_ratio(forum_id)
    reply_depth = compute_reply_depth(forum_id)
    mod_penalty = compute_mod_penalty(forum_id)
    dominance_penalty = compute_dominance_penalty(forum_id)

    score =
      positive_ratio * 0.30 +
        new_voice_ratio * 0.25 +
        min(1.0, reply_depth / 3.0) * 0.25 -
        mod_penalty * 0.10 -
        dominance_penalty * 0.10

    max(0.0, min(1.0, score))
  end

  defp compute_positive_ratio(forum_id) do
    result =
      ReadRepo.one(
        from(v in "thread_votes",
          join: t in "threads",
          on: v.thread_id == t.id,
          join: b in "boards",
          on: b.id == t.board_id,
          where: b.forum_id == ^forum_id,
          select: %{
            positive: count(fragment("CASE WHEN ? > 0 THEN 1 END", v.value)),
            total: count()
          }
        )
      )

    case result do
      %{total: 0} -> 0.5
      %{positive: pos, total: total} -> pos / max(total, 1)
      _ -> 0.5
    end
  end

  defp compute_new_voice_ratio(forum_id) do
    ninety_days_ago = DateTime.utc_now() |> DateTime.add(-90 * 86_400, :second)

    result =
      ReadRepo.one(
        from(tp in "thread_posts",
          join: t in "threads",
          on: tp.thread_id == t.id,
          join: b in "boards",
          on: b.id == t.board_id,
          join: u in "users",
          on: u.id == tp.author_id,
          where: b.forum_id == ^forum_id,
          select: %{
            new_voices:
              count(fragment("CASE WHEN ? > ? THEN 1 END", u.inserted_at, ^ninety_days_ago)),
            total: count()
          }
        )
      )

    case result do
      %{total: 0} -> 0.5
      %{new_voices: nv, total: total} -> nv / max(total, 1)
      _ -> 0.5
    end
  end

  defp compute_reply_depth(forum_id) do
    result =
      ReadRepo.one(
        from(tp in "thread_posts",
          join: t in "threads",
          on: tp.thread_id == t.id,
          join: b in "boards",
          on: b.id == t.board_id,
          where: b.forum_id == ^forum_id,
          select: avg(coalesce(tp.depth, 0))
        )
      )

    case result do
      nil -> 0.0
      val -> Decimal.to_float(val)
    end
  end

  defp compute_mod_penalty(forum_id) do
    result =
      ReadRepo.one(
        from(t in "threads",
          join: b in "boards",
          on: b.id == t.board_id,
          where: b.forum_id == ^forum_id,
          select: %{
            removed: count(fragment("CASE WHEN ? = true THEN 1 END", t.is_hidden)),
            total: count()
          }
        )
      )

    case result do
      %{total: 0} -> 0.0
      %{removed: rem, total: total} -> min(1.0, rem / max(total, 1) * 5)
      _ -> 0.0
    end
  end

  defp compute_dominance_penalty(forum_id) do
    total_posts =
      ReadRepo.one(
        from(tp in "thread_posts",
          join: t in "threads",
          on: tp.thread_id == t.id,
          join: b in "boards",
          on: b.id == t.board_id,
          where: b.forum_id == ^forum_id,
          select: count()
        )
      ) || 0

    if total_posts == 0 do
      0.0
    else
      top_poster_count =
        ReadRepo.one(
          from(tp in "thread_posts",
            join: t in "threads",
            on: tp.thread_id == t.id,
            join: b in "boards",
            on: b.id == t.board_id,
            where: b.forum_id == ^forum_id,
            group_by: tp.author_id,
            order_by: [desc: count()],
            limit: 1,
            select: count()
          )
        ) || 0

      min(1.0, top_poster_count / max(total_posts, 1) * 2)
    end
  end
end
