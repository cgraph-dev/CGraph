defmodule CGraphWeb.API.V1.ForumLeaderboardController do
  @moduledoc """
  Controller for forum-specific leaderboard endpoints.

  Endpoints:
  - `GET  /forums/:id/leaderboard`          — Unified leaderboard with period filter
  - `GET  /forums/:id/leaderboard/my-rank`  — Current user's rank + progress
  - `GET  /forums/:id/ranks`                — List configured ranks
  - `PUT  /forums/:id/ranks`                — Update ranks (admin)
  - `POST /forums/:id/leaderboard/refresh`  — Trigger ranking recalculation (admin)
  """

  use CGraphWeb, :controller

  alias CGraph.Forums.{ForumRank, RankingEngine, UserLeaderboard}
  alias CGraph.Workers.RankingUpdateWorker

  action_fallback CGraphWeb.FallbackController

  @valid_periods ~w(all_time monthly weekly daily)

  # ── GET /forums/:id/leaderboard ──────────────────────────────────────

  @doc "Unified forum leaderboard with period filter."
  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, %{"forum_id" => forum_id} = params) do
    period = parse_period(params["period"])
    limit = parse_limit(params["limit"])

    {entries, _meta} = UserLeaderboard.get_forum_user_leaderboard(forum_id,
      period: period,
      per_page: limit
    )

    # Build response with score change indicators
    entries_json = Enum.map(entries, fn entry ->
      %{
        position: entry.position,
        user: %{
          id: entry.user_id,
          username: entry.username,
          display_name: entry.display_name,
          avatar_url: entry.avatar_url,
          level: entry.level,
          is_verified: entry[:is_verified] || false,
          is_premium: entry[:is_premium] || false
        },
        score: entry.score,
        forum_karma: entry.forum_karma,
        xp: entry.xp,
        rank: entry.rank,
        change: %{
          direction: "same",
          amount: 0,
          previous_rank: nil
        }
      }
    end)

    conn
    |> put_status(:ok)
    |> json(%{
      data: entries_json,
      meta: %{
        period: Atom.to_string(period),
        limit: limit,
        has_more: length(entries) >= limit,
        last_updated: DateTime.to_iso8601(DateTime.utc_now())
      }
    })
  end

  # ── GET /forums/:id/leaderboard/my-rank ──────────────────────────────

  @doc "Current user's rank, score, and progress to next rank."
  @spec my_rank(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def my_rank(conn, %{"forum_id" => forum_id}) do
    user = conn.assigns.current_user
    score = RankingEngine.calculate_unified_score(forum_id, user.id)
    score_int = trunc(score)

    current_rank = ForumRank.get_rank_for_score(forum_id, score_int)
    ranks = ForumRank.list_ranks(forum_id)

    # Find next rank
    next_rank =
      ranks
      |> Enum.filter(fn r -> r.min_score > score_int end)
      |> Enum.sort_by(& &1.min_score)
      |> List.first()

    # Find position in leaderboard
    {entries, _meta} = UserLeaderboard.get_forum_user_leaderboard(forum_id, per_page: 10_000)
    position =
      Enum.find_index(entries, fn e -> e.user_id == user.id end)
      |> then(fn
        nil -> length(entries) + 1
        idx -> idx + 1
      end)

    progress = build_progress(current_rank, next_rank, score)

    conn
    |> put_status(:ok)
    |> json(%{
      data: %{
        position: position,
        score: score,
        forum_karma: score,
        xp: user.xp || 0,
        rank: rank_to_json(current_rank),
        progress: progress,
        change: %{direction: "same", amount: 0, previous_rank: nil}
      }
    })
  end

  # ── GET /forums/:id/ranks ────────────────────────────────────────────

  @doc "List configured ranks for a forum."
  @spec list_ranks(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def list_ranks(conn, %{"forum_id" => forum_id}) do
    ranks = ForumRank.list_ranks(forum_id)

    # If no ranks configured, seed defaults
    ranks =
      if ranks == [] do
        ForumRank.seed_default_ranks(forum_id)
        ForumRank.list_ranks(forum_id)
      else
        ranks
      end

    conn
    |> put_status(:ok)
    |> json(%{
      data: %{
        ranks: Enum.map(ranks, &rank_to_json/1),
        karma_label: "Karma"
      }
    })
  end

  # ── PUT /forums/:id/ranks ────────────────────────────────────────────

  @doc "Update ranks for a forum (admin)."
  @spec update_ranks(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def update_ranks(conn, %{"forum_id" => forum_id, "ranks" => ranks_params}) when is_list(ranks_params) do
    # Delete existing ranks and recreate
    existing = ForumRank.list_ranks(forum_id)
    Enum.each(existing, &ForumRank.delete_rank/1)

    results =
      ranks_params
      |> Enum.with_index()
      |> Enum.map(fn {rank_params, idx} ->
        attrs = %{
          name: rank_params["name"],
          min_score: rank_params["min_score"],
          max_score: rank_params["max_score"],
          image_url: rank_params["image_url"],
          color: rank_params["color"] || "#9CA3AF",
          position: rank_params["position"] || idx,
          is_default: rank_params["is_default"] || false
        }

        ForumRank.create_rank(forum_id, attrs)
      end)

    created = Enum.filter(results, &match?({:ok, _}, &1)) |> Enum.map(fn {:ok, r} -> r end)

    conn
    |> put_status(:ok)
    |> json(%{data: %{ranks: Enum.map(created, &rank_to_json/1)}})
  end

  def update_ranks(conn, _params) do
    conn |> put_status(:bad_request) |> json(%{error: "ranks must be an array"})
  end

  # ── POST /forums/:id/leaderboard/refresh ─────────────────────────────

  @doc "Trigger ranking recalculation (admin)."
  @spec refresh(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def refresh(conn, %{"forum_id" => forum_id}) do
    {:ok, _job} = RankingUpdateWorker.enqueue_ranking_update(forum_id)

    conn
    |> put_status(:accepted)
    |> json(%{data: %{message: "Ranking recalculation queued", forum_id: forum_id}})
  end

  # ── Private ──────────────────────────────────────────────────────────

  defp parse_period(nil), do: :all_time
  defp parse_period(p) when p in @valid_periods, do: String.to_existing_atom(p)
  defp parse_period(_), do: :all_time

  defp parse_limit(nil), do: 50
  defp parse_limit(l) when is_binary(l) do
    case Integer.parse(l) do
      {n, _} -> min(max(n, 1), 200)
      _ -> 50
    end
  end
  defp parse_limit(l) when is_integer(l), do: min(max(l, 1), 200)
  defp parse_limit(_), do: 50

  defp rank_to_json(nil), do: nil
  defp rank_to_json(rank) do
    %{
      id: rank.id,
      name: rank.name,
      min_score: rank.min_score,
      max_score: rank.max_score,
      image_url: rank.image_url,
      color: rank.color,
      position: rank.position,
      is_default: rank.is_default
    }
  end

  defp build_progress(current_rank, next_rank, score) do
    progress_percent =
      if next_rank do
        range = next_rank.min_score - (current_rank && current_rank.min_score || 0)
        if range > 0, do: min(((score - (current_rank && current_rank.min_score || 0)) / range * 100) |> trunc(), 100), else: 100
      else
        100
      end

    %{
      current_rank: rank_to_json(current_rank),
      next_rank: rank_to_json(next_rank),
      current_score: score,
      score_to_next_rank: if(next_rank, do: next_rank.min_score - trunc(score), else: nil),
      progress_percent: progress_percent
    }
  end
end
