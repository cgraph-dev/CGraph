defmodule CGraph.Security.TokenBlacklist.Helpers do
  @moduledoc """
  Helper utilities for the token blacklist system.

  Provides token decoding, hashing, and revocation time parsing functions
  used by the revocation and storage layers.
  """
  @spec extract_jti(String.t()) :: String.t() | nil
  def extract_jti(token) do
    case decode_token_claims(token) do
      {:ok, %{"jti" => jti}} -> jti
      _ -> nil
    end
  end

  @doc "Decode claims from a JWT token without full verification."
  @spec decode_token_claims(String.t()) :: {:ok, map()} | {:error, term()}
  def decode_token_claims(token) do
    # Decode without verification to extract claims
    case CGraph.Guardian.decode_and_verify(token, %{}) do
      {:ok, claims} -> {:ok, claims}
      {:error, _} ->
        # Try base64 decode for expired tokens
        try do
          [_, payload, _] = String.split(token, ".")
          {:ok, decoded} = Base.url_decode64(payload, padding: false)
          {:ok, Jason.decode!(decoded)}
        rescue
          _ -> {:error, :invalid_token}
        end
    end
  end

  @doc "Create a SHA-256 hash of a token (first 32 hex chars)."
  @spec hash_token(String.t()) :: String.t()
  def hash_token(token) do
    :crypto.hash(:sha256, token)
    |> Base.encode16(case: :lower)
    |> binary_part(0, 32)
  end

  @doc "Parse a revocation timestamp from stored data."
  @spec parse_revocation_time(map()) :: DateTime.t()
  def parse_revocation_time(%{"revoked_before" => timestamp}) do
    {:ok, dt, _} = DateTime.from_iso8601(timestamp)
    dt
  end

  def parse_revocation_time(data) when is_map(data) do
    DateTime.utc_now()
  end
end
