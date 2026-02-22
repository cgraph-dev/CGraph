defmodule CGraph.Encryption.Hashing do
  @moduledoc """
  Cryptographic hashing, HMAC, and secure comparison utilities.

  Provides SHA-256 hashing, keyed HMAC generation/verification,
  and timing-safe binary comparison.
  """

  alias CGraph.Encryption.KeyManagement

  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------

  @doc """
  Hash data using SHA-256.
  """
  @spec hash(binary()) :: String.t()
  def hash(data) when is_binary(data) do
    :crypto.hash(:sha256, data)
    |> Base.encode64()
  end

  @doc """
  Create a keyed hash (HMAC).
  """
  @spec hmac(binary(), binary() | nil) :: String.t()
  def hmac(data, key \\ nil) when is_binary(data) do
    key = key || KeyManagement.get_master_key()
    :crypto.mac(:hmac, :sha256, key, data)
    |> Base.encode64()
  end

  @doc """
  Verify a keyed hash.
  """
  @spec verify_hmac(binary(), String.t(), binary() | nil) :: boolean()
  def verify_hmac(data, expected_hmac, key \\ nil) do
    actual = hmac(data, key)
    secure_compare(actual, expected_hmac)
  end

  @doc """
  Timing-safe string comparison.
  """
  @spec secure_compare(binary(), binary()) :: boolean()
  def secure_compare(a, b) when is_binary(a) and is_binary(b) do
    if byte_size(a) == byte_size(b) do
      :crypto.hash_equals(a, b)
    else
      false
    end
  end

  def secure_compare(_, _), do: false
end
