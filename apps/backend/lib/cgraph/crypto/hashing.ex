defmodule CGraph.Crypto.Hashing do
  @moduledoc """
  Cryptographic hashing, password hashing, and message authentication.

  Provides:
  - SHA-256/512 for integrity verification
  - HMAC-SHA256 for message authentication codes
  - Argon2id for password hashing and key derivation
  - Timing-safe comparison for verification
  """

  require Logger

  @aes_key_bytes 32
  @salt_bytes 16

  # Argon2 parameters (OWASP recommended)
  @argon2_time_cost 3
  @argon2_memory_cost 65_536  # 64 MiB
  @argon2_parallelism 4

  @type key :: binary()

  # ---------------------------------------------------------------------------
  # Hashing
  # ---------------------------------------------------------------------------

  @doc """
  Compute SHA-256 hash of data.

  ## Options

  - `:encoding` - Output encoding (`:raw`, `:hex`, `:base64`). Default: `:hex`
  """
  @spec hash(binary(), keyword()) :: binary()
  def hash(data, opts \\ []) do
    encoding = Keyword.get(opts, :encoding, :hex)
    digest = :crypto.hash(:sha256, data)
    encode_output(digest, encoding)
  end

  @doc """
  Compute SHA-512 hash of data.
  """
  @spec hash512(binary(), keyword()) :: binary()
  def hash512(data, opts \\ []) do
    encoding = Keyword.get(opts, :encoding, :hex)
    digest = :crypto.hash(:sha512, data)
    encode_output(digest, encoding)
  end

  @doc """
  Compute HMAC-SHA256.

  Used for message authentication codes.
  """
  @spec hmac(binary(), key(), keyword()) :: binary()
  def hmac(data, key, opts \\ []) do
    encoding = Keyword.get(opts, :encoding, :hex)
    mac = :crypto.mac(:hmac, :sha256, key, data)
    encode_output(mac, encoding)
  end

  # ---------------------------------------------------------------------------
  # Password Hashing
  # ---------------------------------------------------------------------------

  @doc """
  Hash a password for storage using Argon2id.
  """
  @spec hash_password(binary()) :: binary()
  def hash_password(password) when is_binary(password) do
    Argon2.hash_pwd_salt(password)
  end

  @doc """
  Verify a password against a stored hash.
  """
  @spec verify_password(binary(), binary()) :: boolean()
  def verify_password(password, hash) when is_binary(password) and is_binary(hash) do
    Argon2.verify_pass(password, hash)
  end

  # ---------------------------------------------------------------------------
  # Key Derivation
  # ---------------------------------------------------------------------------

  @doc """
  Derive an encryption key from a password using Argon2id.

  Uses OWASP-recommended parameters.

  ## Parameters

  - `password` - User password
  - `salt` - Salt for key derivation (generate with `CGraph.Crypto.generate_salt/0`)
  """
  @spec derive_key(binary(), binary()) :: {:ok, key()} | {:error, term()}
  def derive_key(password, salt) when is_binary(password) and byte_size(salt) >= @salt_bytes do
    key = Argon2.Base.hash_password(
      password,
      salt,
      t_cost: @argon2_time_cost,
      m_cost: @argon2_memory_cost,
      parallelism: @argon2_parallelism,
      hashlen: @aes_key_bytes,
      argon2_type: 2  # Argon2id
    )

    {:ok, key}
  rescue
    e ->
      Logger.error("key_derivation_failed", e: inspect(e))
      {:error, :key_derivation_failed}
  end

  # ---------------------------------------------------------------------------
  # Secure Comparison
  # ---------------------------------------------------------------------------

  @doc """
  Timing-safe comparison of two binaries.

  Prevents timing attacks by ensuring comparison takes constant time.
  """
  @spec secure_compare(binary(), binary()) :: boolean()
  def secure_compare(a, b) when is_binary(a) and is_binary(b) do
    byte_size(a) == byte_size(b) and :crypto.hash_equals(a, b)
  end

  # ---------------------------------------------------------------------------
  # Internal
  # ---------------------------------------------------------------------------

  defp encode_output(data, :raw), do: data
  defp encode_output(data, :hex), do: Base.encode16(data, case: :lower)
  defp encode_output(data, :base64), do: Base.encode64(data)
end
