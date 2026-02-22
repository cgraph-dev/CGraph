defmodule CGraph.Encryption.KeyManagement do
  @moduledoc """
  Encryption key generation, derivation, and management.

  Handles master key retrieval from configuration/environment,
  PBKDF2 key derivation, and random key/salt generation.
  """

  require Logger

  @aes_key_size 32

  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------

  @doc """
  Generate a new encryption key (base64 encoded).
  """
  @spec generate_key() :: String.t()
  def generate_key do
    key = :crypto.strong_rand_bytes(@aes_key_size)
    Base.encode64(key)
  end

  @doc """
  Derive a key from a password using PBKDF2.
  """
  @spec derive_key(binary(), binary(), keyword()) :: binary()
  def derive_key(password, salt, opts \\ []) when is_binary(password) do
    iterations = Keyword.get(opts, :iterations, 100_000)
    key_length = Keyword.get(opts, :length, @aes_key_size)

    :crypto.pbkdf2_hmac(:sha256, password, salt, iterations, key_length)
  end

  @doc """
  Generate a random salt.
  """
  @spec generate_salt(pos_integer()) :: binary()
  def generate_salt(size \\ 16) do
    :crypto.strong_rand_bytes(size)
  end

  @doc """
  Retrieve the master encryption key.

  Loaded from application config or `ENCRYPTION_KEY` environment variable.
  Raises in production if not configured.
  """
  @spec get_master_key() :: binary()
  def get_master_key do
    case Application.get_env(:cgraph, :encryption_key) do
      nil -> get_key_from_env()
      encoded when is_binary(encoded) -> decode_key(encoded, "encryption_key")
    end
  end

  # ---------------------------------------------------------------------------
  # Private Helpers
  # ---------------------------------------------------------------------------

  defp get_key_from_env do
    case System.get_env("ENCRYPTION_KEY") do
      nil -> handle_missing_key()
      "" -> handle_missing_key()
      encoded -> decode_key(encoded, "ENCRYPTION_KEY")
    end
  end

  defp handle_missing_key do
    env = Application.get_env(:cgraph, :env, :prod)
    if env == :prod do
      raise """
      ENCRYPTION_KEY environment variable is required in production!

      Generate one with: mix phx.gen.secret 32 | base64

      This key encrypts sensitive data at rest (TOTP secrets, encrypted fields).
      Without a stable key, encrypted data becomes unrecoverable after restarts.
      """
    else
      Logger.warning("[DEV ONLY] No ENCRYPTION_KEY set, using ephemeral key - DO NOT USE IN PRODUCTION")
      :crypto.strong_rand_bytes(@aes_key_size)
    end
  end

  defp decode_key(encoded, source) do
    case Base.decode64(encoded) do
      {:ok, key} when byte_size(key) == @aes_key_size -> key
      _ -> raise "Invalid #{source} format"
    end
  end
end
