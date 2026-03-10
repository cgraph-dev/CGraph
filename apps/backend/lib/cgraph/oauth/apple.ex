defmodule CGraph.OAuth.Apple do
  @moduledoc """
  Apple Sign In specific logic.

  Handles Apple ID token verification using JWKS, JWT claims validation,
  and client secret generation for the Apple OAuth flow.
  """

  require Logger

  @apple_jwks_url "https://appleid.apple.com/auth/keys"
  @apple_issuer "https://appleid.apple.com"

  # ============================================================================
  # Public API
  # ============================================================================

  @doc """
  Verify an Apple ID token using Apple's JWKS.

  This function validates the token's signature and claims
  to ensure the token was issued by Apple for your application.

  ## Parameters

  - `id_token` - The Apple ID token (JWT)
  - `config` - The Apple OAuth configuration

  ## Returns

  - `{:ok, claims}` - The verified token claims
  - `{:error, reason}` - If verification failed
  """
  @spec verify_token(String.t(), Keyword.t()) :: {:ok, map()} | {:error, term()}
  def verify_token(id_token, config) do
    verify_id_token(id_token, config)
  end

  @doc """
  Verify an Apple ID token (alias used internally by Providers module).
  """
  @spec verify_id_token(String.t(), Keyword.t()) :: {:ok, map()} | {:error, term()}
  def verify_id_token(id_token, config) do
    with {:ok, jwks} <- fetch_apple_jwks(),
         {:ok, claims} <- verify_jwt_with_jwks(id_token, jwks),
         :ok <- validate_apple_claims(claims, config) do
      {:ok, claims}
    end
  end

  @doc """
  Generate an Apple client secret JWT.

  Apple requires a JWT signed with your private key as the client_secret.
  This JWT is valid for up to 6 months.

  ## Parameters

  - `config` - The Apple OAuth configuration (must include `:team_id`,
    `:client_id`, `:key_id`, and `:private_key`)

  ## Returns

  The signed JWT string, or an empty string if the private key is not configured.
  """
  @spec generate_client_secret(Keyword.t()) :: String.t()
  def generate_client_secret(config) do
    now = System.system_time(:second)

    claims = %{
      "iss" => config[:team_id],
      "iat" => now,
      "exp" => now + 86_400 * 180,
      "aud" => "https://appleid.apple.com",
      "sub" => config[:client_id]
    }

    case config[:private_key] do
      key when is_binary(key) and key != "" ->
        signer = JOSE.JWK.from_pem(key)

        header = %{
          "alg" => "ES256",
          "kid" => config[:key_id]
        }

        {_, jwt} = JOSE.JWT.sign(signer, header, claims) |> JOSE.JWS.compact()
        jwt

      _ ->
        Logger.error("Apple private key not configured")
        ""
    end
  end

  # ============================================================================
  # Private Functions - JWKS Fetching
  # ============================================================================

  defp fetch_apple_jwks do
    cache_key = "apple_jwks"

    case get_cached_jwks(cache_key) do
      {:ok, nil} -> fetch_and_cache_jwks(cache_key)
      {:ok, jwks} when not is_nil(jwks) -> {:ok, jwks}
      {:error, _} -> fetch_jwks_directly()
    end
  end

  defp get_cached_jwks(cache_key) do
    Cachex.get(:oauth_cache, cache_key)
  catch
    :exit, _ -> {:ok, nil}
  end

  defp fetch_and_cache_jwks(cache_key) do
    case fetch_jwks_from_apple() do
      {:ok, jwks} ->
        try do
          Cachex.put(:oauth_cache, cache_key, jwks, ttl: :timer.hours(24))
        catch
          :exit, _ -> :ok
        end
        {:ok, jwks}
      error -> error
    end
  end

  defp fetch_jwks_directly do
    fetch_jwks_from_apple()
  end

  defp fetch_jwks_from_apple do
    case Finch.build(:get, @apple_jwks_url) |> Finch.request(CGraph.Finch, receive_timeout: 10_000) do
      {:ok, %Finch.Response{status: 200, body: body}} ->
        {:ok, Jason.decode!(body)}
      {:ok, %Finch.Response{status: status}} ->
        {:error, {:jwks_fetch_failed, status}}
      {:error, reason} ->
        {:error, {:jwks_fetch_failed, reason}}
    end
  end

  # ============================================================================
  # Private Functions - JWT Verification
  # ============================================================================

  defp verify_jwt_with_jwks(token, %{"keys" => keys}) do
    with [header_b64 | _] <- String.split(token, "."),
         {:ok, header_json} <- Base.url_decode64(header_b64, padding: false),
         {:ok, header} <- Jason.decode(header_json),
         kid when is_binary(kid) <- header["kid"] do

      find_and_verify_key(keys, kid, header["alg"], token)
    else
      _ -> {:error, :invalid_token_format}
    end
  end

  defp find_and_verify_key(keys, kid, alg, token) do
    case Enum.find(keys, fn key -> key["kid"] == kid end) do
      nil ->
        {:error, :key_not_found}
      key ->
        verify_token_with_key(key, alg, token)
    end
  end

  defp verify_token_with_key(key, alg, token) do
    jwk = JOSE.JWK.from_map(key)

    case JOSE.JWT.verify_strict(jwk, [alg], token) do
      {true, %JOSE.JWT{fields: claims}, _} -> {:ok, claims}
      {false, _, _} -> {:error, :signature_invalid}
    end
  end

  defp validate_apple_claims(claims, config) do
    now = System.system_time(:second)
    client_id = config[:client_id]

    cond do
      claims["iss"] != @apple_issuer ->
        {:error, :invalid_issuer}
      claims["aud"] != client_id ->
        {:error, :invalid_audience}
      claims["exp"] && claims["exp"] < now ->
        {:error, :token_expired}
      claims["iat"] && claims["iat"] > now + 300 ->
        {:error, :token_not_yet_valid}
      true ->
        :ok
    end
  end
end
