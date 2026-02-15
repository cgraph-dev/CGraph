defmodule CGraph.Auth.TokenManager.Store do
  @moduledoc """
  Storage backend for TokenManager.

  Uses Redis as the primary distributed store with ETS as local cache/fallback.
  When Redis is unavailable (dev/test or connection failure), all operations
  degrade gracefully to ETS-only mode.

  ## Redis Key Schema

  - `tm:rt:{jti}`             — Refresh token data (TTL = token expiration)
  - `tm:fam:{family_id}`      — Token family data (TTL = 30 days)
  - `tm:rev:{jti}`            — Revoked token marker (TTL = 24h)
  - `tm:user_tokens:{user_id}` — Set of active JTIs per user
  - `tm:user_fams:{user_id}`  — Set of family IDs per user
  """

  require Logger

  @redis_prefix "tm:"
  @family_ttl 30 * 86_400      # 30 days
  @revocation_ttl 86_400       # 24 hours

  # ---------------------------------------------------------------------------
  # Refresh Tokens
  # ---------------------------------------------------------------------------

  @doc "Store refresh token metadata in Redis (primary) and ETS (local cache)."
  def store_refresh_token(token_data) do
    jti = token_data.jti
    user_id = token_data.user_id

    # ETS — always write for local cache
    :ets.insert(:refresh_tokens, {jti, token_data})

    # Redis — primary distributed store
    with_redis(fn ->
      ttl = compute_ttl(token_data.expires_at)
      encoded = serialize(token_data)
      redis_cmd(["SETEX", key(:rt, jti), to_string(ttl), encoded])
      redis_cmd(["SADD", key(:user_tokens, user_id), jti])
    end)
  end

  @doc "Retrieve refresh token by JTI. Tries Redis first, falls back to ETS."
  def get_refresh_token(jti) do
    case redis_get(key(:rt, jti)) do
      {:ok, data} when is_binary(data) ->
        {:ok, deserialize(data)}

      _ ->
        case :ets.lookup(:refresh_tokens, jti) do
          [{^jti, token_data}] -> {:ok, token_data}
          [] -> {:error, :token_not_found}
        end
    end
  end

  @doc "Mark a refresh token as used (one-time use enforcement)."
  def mark_token_used(jti) do
    case get_refresh_token(jti) do
      {:ok, token_data} ->
        updated = Map.merge(token_data, %{used: true, used_at: DateTime.utc_now()})
        :ets.insert(:refresh_tokens, {jti, updated})

        with_redis(fn ->
          ttl = compute_ttl(updated.expires_at)
          redis_cmd(["SETEX", key(:rt, jti), to_string(ttl), serialize(updated)])
        end)

      _ ->
        :ok
    end
  end

  # ---------------------------------------------------------------------------
  # Token Families
  # ---------------------------------------------------------------------------

  @doc "Store token family data."
  def store_family(family_data) do
    family_id = family_data.family_id
    user_id = family_data.user_id

    :ets.insert(:token_families, {family_id, family_data})

    with_redis(fn ->
      redis_cmd(["SETEX", key(:fam, family_id), to_string(@family_ttl), serialize(family_data)])
      redis_cmd(["SADD", key(:user_fams, user_id), family_id])
    end)
  end

  @doc "Get token family by ID."
  def get_family(family_id) do
    case redis_get(key(:fam, family_id)) do
      {:ok, data} when is_binary(data) ->
        {:ok, deserialize(data)}

      _ ->
        case :ets.lookup(:token_families, family_id) do
          [{^family_id, data}] -> {:ok, data}
          [] -> {:error, :not_found}
        end
    end
  end

  @doc "Revoke an entire token family (used on token theft detection)."
  def revoke_family(family_id) do
    case get_family(family_id) do
      {:ok, family_data} ->
        updated = Map.merge(family_data, %{revoked: true, revoked_at: DateTime.utc_now()})
        :ets.insert(:token_families, {family_id, updated})

        with_redis(fn ->
          redis_cmd(["SETEX", key(:fam, family_id), to_string(@family_ttl), serialize(updated)])
        end)

      {:error, _} ->
        :ok
    end
  end

  @doc "Check if a token family has been revoked."
  def family_revoked?(family_id) do
    case get_family(family_id) do
      {:ok, %{revoked: true}} -> true
      _ -> false
    end
  end

  # ---------------------------------------------------------------------------
  # JTI Revocation
  # ---------------------------------------------------------------------------

  @doc "Revoke a specific token by JTI."
  def revoke_by_jti(jti) do
    :ets.insert(:revoked_tokens, {jti, DateTime.utc_now()})

    with_redis(fn ->
      redis_cmd(["SETEX", key(:rev, jti), to_string(@revocation_ttl), "1"])
    end)
  end

  @doc "Check if a specific JTI has been revoked."
  def token_revoked?(jti) do
    case redis_get(key(:rev, jti)) do
      {:ok, val} when is_binary(val) -> true
      _ ->
        case :ets.lookup(:revoked_tokens, jti) do
          [{^jti, _}] -> true
          [] -> false
        end
    end
  end

  # ---------------------------------------------------------------------------
  # User-Scoped Operations
  # ---------------------------------------------------------------------------

  @doc "Get all active JTIs for a user."
  def get_user_token_jtis(user_id) do
    case redis_cmd_safe(["SMEMBERS", key(:user_tokens, user_id)]) do
      {:ok, jtis} when is_list(jtis) and jtis != [] ->
        jtis

      _ ->
        :ets.match_object(:refresh_tokens, {:_, %{user_id: user_id}})
        |> Enum.map(fn {jti, _} -> jti end)
    end
  end

  @doc "Get all family IDs for a user."
  def get_user_family_ids(user_id) do
    case redis_cmd_safe(["SMEMBERS", key(:user_fams, user_id)]) do
      {:ok, ids} when is_list(ids) and ids != [] ->
        ids

      _ ->
        :ets.match_object(:token_families, {:_, %{user_id: user_id}})
        |> Enum.map(fn {id, _} -> id end)
    end
  end

  @doc "Delete all refresh tokens for a user."
  def delete_user_tokens(user_id) do
    # ETS cleanup
    :ets.match_delete(:refresh_tokens, {:_, %{user_id: user_id}})

    # Redis cleanup
    with_redis(fn ->
      case redis_cmd_safe(["SMEMBERS", key(:user_tokens, user_id)]) do
        {:ok, jtis} when is_list(jtis) ->
          Enum.each(jtis, fn jti ->
            redis_cmd(["DEL", key(:rt, jti)])
          end)

          redis_cmd(["DEL", key(:user_tokens, user_id)])

        _ ->
          :ok
      end
    end)
  end

  # ---------------------------------------------------------------------------
  # Cleanup
  # ---------------------------------------------------------------------------

  @doc """
  Clean up expired tokens from ETS.

  Redis handles its own expiration via key TTLs, so this only
  cleans the local ETS cache.
  """
  def cleanup_expired do
    now = DateTime.utc_now()

    :ets.foldl(
      fn {jti, token}, acc ->
        if DateTime.compare(token.expires_at, now) == :lt do
          :ets.delete(:refresh_tokens, jti)
          :ets.delete(:revoked_tokens, jti)
        end

        acc
      end,
      nil,
      :refresh_tokens
    )

    Logger.debug("Token cleanup completed")
  end

  # ---------------------------------------------------------------------------
  # Redis Helpers
  # ---------------------------------------------------------------------------

  defp key(:rt, id), do: "#{@redis_prefix}rt:#{id}"
  defp key(:fam, id), do: "#{@redis_prefix}fam:#{id}"
  defp key(:rev, id), do: "#{@redis_prefix}rev:#{id}"
  defp key(:user_tokens, id), do: "#{@redis_prefix}user_tokens:#{id}"
  defp key(:user_fams, id), do: "#{@redis_prefix}user_fams:#{id}"

  defp with_redis(fun) do
    if redis_available?() do
      try do
        fun.()
      rescue
        error ->
          Logger.warning("Redis operation failed, ETS fallback active",
            error: inspect(error)
          )
      end
    end
  end

  defp redis_available? do
    Process.whereis(:redix) != nil
  end

  defp redis_cmd(args) do
    Redix.command(:redix, args)
  end

  defp redis_cmd_safe(args) do
    if redis_available?() do
      try do
        Redix.command(:redix, args)
      rescue
        _ -> {:error, :redis_unavailable}
      end
    else
      {:error, :redis_unavailable}
    end
  end

  defp redis_get(redis_key) do
    redis_cmd_safe(["GET", redis_key])
  end

  defp compute_ttl(expires_at) do
    diff = DateTime.diff(expires_at, DateTime.utc_now())
    max(diff, 60)
  end

  # ---------------------------------------------------------------------------
  # Serialization (Erlang term format - safe for internal Elixir-to-Elixir use)
  # ---------------------------------------------------------------------------

  defp serialize(data) when is_map(data) do
    :erlang.term_to_binary(data, [:compressed])
  end

  defp deserialize(binary) when is_binary(binary) do
    :erlang.binary_to_term(binary, [:safe])
  end
end
