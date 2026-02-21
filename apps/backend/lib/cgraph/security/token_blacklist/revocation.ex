defmodule CGraph.Security.TokenBlacklist.Revocation do
  @moduledoc """
  Token revocation and checking operations.

  Handles revoking individual tokens, JTIs, and user-wide revocations,
  as well as checking revocation status across all storage tiers.
  """

  require Logger

  alias CGraph.Audit
  alias CGraph.Security.TokenBlacklist.{Storage, Helpers}

  @user_revocation_prefix "user_token_revocation:"

  # ---------------------------------------------------------------------------
  # Revocation Operations
  # ---------------------------------------------------------------------------

  @doc "Revoke a token by adding it to all storage tiers."
  @spec revoke_token(String.t(), keyword()) :: :ok | {:error, term()}
  def revoke_token(token, opts) do
    jti = Helpers.extract_jti(token) || Helpers.hash_token(token)
    ttl = Keyword.get(opts, :ttl, Storage.default_ttl_seconds())
    reason = Keyword.get(opts, :reason, :logout)
    user_id = Keyword.get(opts, :user_id)

    revocation_data = %{
      revoked_at: DateTime.utc_now() |> DateTime.to_iso8601(),
      reason: reason,
      user_id: user_id
    }

    # Store in all tiers
    with :ok <- Storage.store_in_cachex(jti, revocation_data, ttl),
         :ok <- Storage.store_in_ets(jti),
         :ok <- Storage.store_in_redis(jti, revocation_data, ttl) do

      # Emit telemetry
      :telemetry.execute(
        [:cgraph, :security, :token_revoked],
        %{count: 1},
        %{reason: reason, user_id: user_id}
      )

      # Audit log if user_id provided
      if user_id do
        log_revocation_audit(user_id, reason, opts)
      end

      :ok
    end
  end

  @doc "Revoke a token by its JTI claim."
  @spec revoke_jti(String.t(), keyword()) :: :ok | {:error, term()}
  def revoke_jti(jti, opts) do
    ttl = Keyword.get(opts, :ttl, Storage.default_ttl_seconds())
    reason = Keyword.get(opts, :reason, :logout)
    user_id = Keyword.get(opts, :user_id)

    revocation_data = %{
      revoked_at: DateTime.utc_now() |> DateTime.to_iso8601(),
      reason: reason,
      user_id: user_id
    }

    with :ok <- Storage.store_in_cachex(jti, revocation_data, ttl),
         :ok <- Storage.store_in_ets(jti),
         :ok <- Storage.store_in_redis(jti, revocation_data, ttl) do

      :telemetry.execute(
        [:cgraph, :security, :token_revoked],
        %{count: 1},
        %{reason: reason, user_id: user_id, by_jti: true}
      )

      :ok
    end
  end

  @doc "Revoke all tokens for a user by setting a revocation timestamp."
  @spec revoke_all_for_user(String.t(), keyword()) :: :ok | {:error, term()}
  def revoke_all_for_user(user_id, opts) do
    reason = Keyword.get(opts, :reason, :security_breach)
    revocation_time = DateTime.utc_now()

    revocation_data = %{
      revoked_before: DateTime.to_iso8601(revocation_time),
      reason: reason
    }

    key = "#{@user_revocation_prefix}#{user_id}"

    # Store user-level revocation with long TTL (matches refresh token)
    with :ok <- Storage.store_in_cachex(key, revocation_data, Storage.default_ttl_seconds()),
         :ok <- Storage.store_in_redis(key, revocation_data, Storage.default_ttl_seconds()) do

      :telemetry.execute(
        [:cgraph, :security, :mass_revocation],
        %{count: 1},
        %{reason: reason, user_id: user_id}
      )

      log_mass_revocation_audit(user_id, reason, opts)

      Logger.info("revoked_all_tokens_for_user", user_id: user_id, reason: reason)
      :ok
    end
  end

  # ---------------------------------------------------------------------------
  # Check Operations
  # ---------------------------------------------------------------------------

  @doc "Check if a token has been revoked."
  @spec check_revoked(String.t(), keyword()) :: boolean()
  def check_revoked(token, opts) do
    jti = Helpers.extract_jti(token) || Helpers.hash_token(token)
    check_user = Keyword.get(opts, :check_user_revocation, true)
    start_time = System.monotonic_time()

    result = check_token_revocation_cascade(jti, token, check_user)

    duration = System.monotonic_time() - start_time
    :telemetry.execute(
      [:cgraph, :security, :token_check],
      %{duration: duration},
      %{revoked: result}
    )

    result
  end

  @doc "Check if a token is revoked by its JTI."
  @spec check_revoked_jti(String.t(), keyword()) :: boolean()
  def check_revoked_jti(jti, _opts) do
    cond do
      Storage.check_in_ets(jti) -> true
      ets_cachex_check(jti) == :found -> true
      redis_check_with_promotion(jti) == :found -> true
      true -> false
    end
  end

  @doc "Get the revocation timestamp for a user's tokens."
  @spec get_user_revocation_time(String.t()) :: {:ok, DateTime.t()} | :not_revoked
  def get_user_revocation_time(user_id) do
    key = "#{@user_revocation_prefix}#{user_id}"

    case Storage.check_in_cachex(key) do
      {:ok, data} -> {:ok, Helpers.parse_revocation_time(data)}
      _ ->
        case Storage.check_in_redis(key) do
          {:ok, data} -> {:ok, Helpers.parse_revocation_time(data)}
          _ -> :not_revoked
        end
    end
  end

  # ---------------------------------------------------------------------------
  # Private Helpers
  # ---------------------------------------------------------------------------

  defp check_token_revocation_cascade(jti, token, check_user) do
    cond do
      Storage.check_in_ets(jti) -> true
      ets_cachex_check(jti) == :found -> true
      redis_check_with_promotion(jti) == :found -> true
      check_user -> check_user_level_revocation(token)
      true -> false
    end
  end

  defp ets_cachex_check(jti) do
    case Storage.check_in_cachex(jti) do
      {:ok, _} -> :found
      _ -> :not_found
    end
  end

  defp redis_check_with_promotion(jti) do
    case Storage.check_in_redis(jti) do
      {:ok, _} ->
        Storage.store_in_ets(jti)
        :found
      _ ->
        :not_found
    end
  end

  defp check_user_level_revocation(token) do
    # Extract user_id and issued_at from token
    with {:ok, claims} <- Helpers.decode_token_claims(token),
         user_id when is_binary(user_id) <- Map.get(claims, "sub"),
         iat when is_integer(iat) <- Map.get(claims, "iat") do

      case get_user_revocation_time(user_id) do
        {:ok, revoked_before} ->
          token_issued_at = DateTime.from_unix!(iat)
          DateTime.compare(token_issued_at, revoked_before) == :lt
        :not_revoked ->
          false
      end
    else
      _ -> false
    end
  end

  defp log_revocation_audit(user_id, reason, opts) do
    metadata = Keyword.get(opts, :metadata, %{})

    Audit.log(:security, :token_revoked, %{
      user_id: user_id,
      reason: reason,
      metadata: metadata
    })
  rescue
    _ -> :ok  # Don't fail on audit errors
  end

  defp log_mass_revocation_audit(user_id, reason, opts) do
    metadata = Keyword.get(opts, :metadata, %{})

    Audit.log(:security, :mass_token_revocation, %{
      user_id: user_id,
      reason: reason,
      metadata: metadata
    })
  rescue
    _ -> :ok
  end
end
