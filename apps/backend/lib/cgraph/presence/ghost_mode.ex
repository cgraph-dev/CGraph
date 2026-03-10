defmodule CGraph.Presence.GhostMode do
  @moduledoc """
  Ghost mode for secret chat participants.

  When ghost mode is active, a user appears as "offline" to all presence
  queries, hiding their real online status. Implemented via Redis keys
  with automatic TTL-based expiry.

  ## Redis Keys

  - `ghost:{user_id}` — presence of this key means ghost mode is active
    TTL: 3600 seconds (1 hour) by default, auto-expires

  ## Integration

  Use `get_presence/2` to wrap presence lookups — ghost users are always
  returned as offline regardless of their actual Phoenix.Presence state.
  """

  require Logger

  alias CGraph.Redis

  @ghost_key_prefix "ghost"
  @default_ttl 3600

  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------

  @doc """
  Activate ghost mode for a user.

  Sets a Redis key with a 1-hour TTL. The user will appear offline
  to all presence queries while the key is active.

  ## Options

    * `:ttl` — TTL in seconds (default: 3600)
  """
  @spec activate(String.t(), keyword()) :: :ok | {:error, term()}
  def activate(user_id, opts \\ []) do
    ttl = Keyword.get(opts, :ttl, @default_ttl)
    key = ghost_key(user_id)

    case Redis.command(["SETEX", key, to_string(ttl), "1"]) do
      {:ok, "OK"} ->
        Logger.info("ghost_mode_activated", user_id: user_id, ttl: ttl)
        :ok

      {:error, reason} = error ->
        Logger.error("ghost_mode_activation_failed",
          user_id: user_id,
          reason: inspect(reason)
        )

        error
    end
  end

  @doc """
  Deactivate ghost mode for a user.

  Removes the Redis key, restoring normal presence visibility.
  """
  @spec deactivate(String.t()) :: :ok | {:error, term()}
  def deactivate(user_id) do
    key = ghost_key(user_id)

    case Redis.command(["DEL", key]) do
      {:ok, _} ->
        Logger.info("ghost_mode_deactivated", user_id: user_id)
        :ok

      {:error, reason} = error ->
        Logger.error("ghost_mode_deactivation_failed",
          user_id: user_id,
          reason: inspect(reason)
        )

        error
    end
  end

  @doc """
  Check if a user has ghost mode active.

  Returns `true` if the Redis ghost key exists for the user.
  """
  @spec is_ghost?(String.t()) :: boolean()
  def is_ghost?(user_id) do
    key = ghost_key(user_id)

    case Redis.command(["EXISTS", key]) do
      {:ok, 1} -> true
      {:ok, 0} -> false
      {:error, _} -> false
    end
  end

  @doc """
  Get presence for a user, respecting ghost mode.

  If the user has ghost mode active, returns a fake "offline" presence
  regardless of their actual state. Otherwise delegates to the provided
  fallback function.

  ## Parameters

    * `user_id` — the user to check
    * `fallback` — a 0-arity function that returns the real presence

  ## Examples

      GhostMode.get_presence(user_id, fn ->
        Presence.Queries.get_user_status(user_id)
      end)
  """
  @spec get_presence(String.t(), (-> term())) :: map()
  def get_presence(user_id, fallback) when is_function(fallback, 0) do
    if is_ghost?(user_id) do
      %{
        status: "offline",
        ghost: true,
        last_active: nil
      }
    else
      fallback.()
    end
  end

  @doc """
  Filter a list of user IDs, removing any that are in ghost mode.

  Useful for filtering online user lists — ghost users should not
  appear in "who's online" responses.
  """
  @spec filter_ghost_users([String.t()]) :: [String.t()]
  def filter_ghost_users(user_ids) when is_list(user_ids) do
    Enum.reject(user_ids, &is_ghost?/1)
  end

  @doc """
  Get remaining TTL for a user's ghost mode, in seconds.

  Returns `nil` if ghost mode is not active.
  """
  @spec ttl(String.t()) :: non_neg_integer() | nil
  def ttl(user_id) do
    key = ghost_key(user_id)

    case Redis.command(["TTL", key]) do
      {:ok, ttl} when ttl > 0 -> ttl
      _ -> nil
    end
  end

  # ---------------------------------------------------------------------------
  # Private Helpers
  # ---------------------------------------------------------------------------

  defp ghost_key(user_id), do: "#{@ghost_key_prefix}:#{user_id}"
end
