defmodule CGraph.Gamification.Leaderboard do
  @moduledoc """
  Redis Sorted Set-backed leaderboard system.

  Uses ZADD/ZREVRANGE for O(log N) score updates and O(log N + M) range queries
  instead of full table scans. Scales to 10M+ users.

  Each leaderboard category has its own sorted set:
    leaderboard:xp, leaderboard:level, leaderboard:karma, etc.

  Scores are synced on every relevant user update. A periodic warm job
  ensures consistency with the database as source of truth.
  """

  alias CGraph.Redis

  @categories ~w(xp level streak karma messages posts friends)
  @key_prefix "leaderboard"
  @user_data_prefix "leaderboard:user"

  # ====================== SCORE UPDATES ======================

  @doc """
  Update a user's score in one or more leaderboard categories.
  Call this after XP awards, karma changes, etc.

  ## Examples

      sync_scores(user)
      sync_scores(user, [:xp, :level])
  """
  def sync_scores(%{id: user_id} = user, categories \\ nil) do
    cats = categories || @categories

    commands =
      cats
      |> Enum.map(fn cat ->
        score = get_score_for_category(user, cat)
        ["ZADD", key(cat), to_string(score), user_id]
      end)

    # Also cache minimal user data for rendering leaderboard entries
    user_data = encode_user_data(user)
    commands = commands ++ [["SET", user_key(user_id), user_data, "EX", "86400"]]

    case Redis.pipeline(commands) do
      {:ok, _results} -> :ok
      {:error, reason} ->
        require Logger
        Logger.warning("Leaderboard sync failed",
          user_id: user_id,
          reason: inspect(reason)
        )
        :error
    end
  end

  @doc """
  Update a single category score for a user by ID.
  Used when we don't have the full user struct (e.g., atomic karma updates).
  """
  def update_score(user_id, category, score) when category in @categories do
    case Redis.command(["ZADD", key(category), to_string(score), user_id]) do
      {:ok, _} -> :ok
      {:error, _} -> :error
    end
  end

  @doc """
  Increment a user's score in a category by a delta.
  Useful for atomic score changes like karma +1/-1.
  """
  def increment_score(user_id, category, delta) when category in @categories do
    case Redis.command(["ZINCRBY", key(category), to_string(delta), user_id]) do
      {:ok, _} -> :ok
      {:error, _} -> :error
    end
  end

  # ====================== QUERIES ======================

  @doc """
  Get leaderboard entries with O(log N + M) complexity using ZREVRANGE.
  Returns list of maps with :user_id, :score, :rank, plus cached user data.

  Falls back to database query if Redis is unavailable.
  """
  def get_top(category, limit \\ 100, offset \\ 0) when category in @categories do
    # ZREVRANGE returns highest-score-first
    case Redis.command(["ZREVRANGE", key(category), to_string(offset), to_string(offset + limit - 1), "WITHSCORES"]) do
      {:ok, nil} ->
        {:fallback, []}

      {:ok, results} when is_list(results) ->
        entries = parse_zrevrange_results(results, offset)
        # Batch-fetch user data
        entries_with_data = hydrate_entries(entries)
        {:ok, entries_with_data}

      {:error, _} ->
        {:fallback, []}
    end
  end

  @doc """
  Get a specific user's rank in a category. O(log N).
  """
  def get_rank(user_id, category) when category in @categories do
    case Redis.command(["ZREVRANK", key(category), user_id]) do
      {:ok, nil} -> {:ok, nil}
      {:ok, rank} -> {:ok, rank + 1}  # 0-indexed → 1-indexed
      {:error, _} -> {:error, :unavailable}
    end
  end

  @doc """
  Get a user's score in a category. O(1).
  """
  def get_score(user_id, category) when category in @categories do
    case Redis.command(["ZSCORE", key(category), user_id]) do
      {:ok, nil} -> {:ok, 0}
      {:ok, score} -> {:ok, parse_score(score)}
      {:error, _} -> {:error, :unavailable}
    end
  end

  @doc """
  Get total number of users in a leaderboard. O(1).
  """
  def count(category) when category in @categories do
    case Redis.command(["ZCARD", key(category)]) do
      {:ok, count} -> {:ok, count}
      {:error, _} -> {:error, :unavailable}
    end
  end

  # ====================== WARM / SYNC ======================

  @doc """
  Warm the Redis leaderboard from the database.
  Called on startup or periodically to ensure consistency.
  Processes in batches to avoid memory spikes.
  """
  def warm_from_db(category \\ "xp", batch_size \\ 1000) do
    import Ecto.Query
    alias CGraph.Accounts.User
    alias CGraph.ReadRepo

    stream =
      from(u in User,
        where: u.is_active == true,
        select: %{
          id: u.id,
          xp: u.xp,
          level: u.level,
          streak_days: u.streak_days,
          karma: u.karma,
          total_messages_sent: u.total_messages_sent,
          total_posts_created: u.total_posts_created,
          username: u.username,
          display_name: u.display_name,
          avatar_url: u.avatar_url,
          subscription_tier: u.subscription_tier,
          is_verified: u.is_verified
        }
      )
      |> ReadRepo.stream()

    ReadRepo.transaction(fn ->
      stream
      |> Stream.chunk_every(batch_size)
      |> Enum.each(fn batch ->
        commands =
          batch
          |> Enum.flat_map(fn user ->
            score = get_score_for_category(user, category)
            user_data = encode_user_data(user)
            [
              ["ZADD", key(category), to_string(score), user.id],
              ["SET", user_key(user.id), user_data, "EX", "86400"]
            ]
          end)

        Redis.pipeline(commands)
      end)
    end, timeout: :infinity)

    :ok
  end

  # ====================== INTERNAL ======================

  defp key(category), do: "#{@key_prefix}:#{category}"
  defp user_key(user_id), do: "#{@user_data_prefix}:#{user_id}"

  defp get_score_for_category(user, category) do
    case to_string(category) do
      "xp" -> Map.get(user, :xp, 0) || 0
      "level" -> Map.get(user, :level, 0) || 0
      "streak" -> Map.get(user, :streak_days, 0) || 0
      "karma" -> Map.get(user, :karma, 0) || 0
      "messages" -> Map.get(user, :total_messages_sent, 0) || 0
      "posts" -> Map.get(user, :total_posts_created, 0) || 0
      "friends" -> Map.get(user, :friend_count, 0) || 0
      _ -> 0
    end
  end

  defp encode_user_data(user) do
    %{
      id: Map.get(user, :id),
      username: Map.get(user, :username),
      display_name: Map.get(user, :display_name),
      avatar_url: Map.get(user, :avatar_url),
      level: Map.get(user, :level, 0),
      is_premium: Map.get(user, :subscription_tier) in ["premium", "premium_plus"],
      is_verified: Map.get(user, :is_verified, false)
    }
    |> Jason.encode!()
  end

  defp parse_zrevrange_results(results, offset) do
    results
    |> Enum.chunk_every(2)
    |> Enum.with_index(offset + 1)
    |> Enum.map(fn {[user_id, score], rank} ->
      %{
        user_id: user_id,
        score: parse_score(score),
        rank: rank
      }
    end)
  end

  defp parse_score(score) when is_binary(score) do
    case Integer.parse(score) do
      {int, _} -> int
      :error ->
        case Float.parse(score) do
          {f, _} -> round(f)
          :error -> 0
        end
    end
  end
  defp parse_score(score) when is_integer(score), do: score
  defp parse_score(score) when is_float(score), do: round(score)
  defp parse_score(_), do: 0

  defp hydrate_entries(entries) do
    user_ids = Enum.map(entries, & &1.user_id)

    # Batch fetch user data from Redis
    commands = Enum.map(user_ids, fn id -> ["GET", user_key(id)] end)

    user_data_map =
      case Redis.pipeline(commands) do
        {:ok, results} ->
          Enum.zip(user_ids, results)
          |> Enum.reduce(%{}, fn {id, data}, acc ->
            case data do
              nil -> acc
              json ->
                case Jason.decode(json) do
                  {:ok, parsed} -> Map.put(acc, id, parsed)
                  _ -> acc
                end
            end
          end)

        {:error, _} ->
          %{}
      end

    Enum.map(entries, fn entry ->
      case Map.get(user_data_map, entry.user_id) do
        nil ->
          # User data not cached, include minimal info
          Map.merge(entry, %{
            username: nil,
            display_name: nil,
            avatar_url: nil,
            level: 0,
            is_premium: false,
            is_verified: false,
            value: entry.score
          })

        data ->
          Map.merge(entry, %{
            id: entry.user_id,
            username: data["username"],
            display_name: data["display_name"],
            avatar_url: data["avatar_url"],
            level: data["level"] || 0,
            is_premium: data["is_premium"] || false,
            is_verified: data["is_verified"] || false,
            value: entry.score
          })
      end
    end)
  end
end
