defmodule CGraph.Security.TOTP.Algorithm do
  @moduledoc """
  Core TOTP algorithm implementation (RFC 6238/4226).

  Provides TOTP generation, validation, secret encryption/decryption,
  OTPAuth URI construction, and configuration accessors.
  """

  import Bitwise

  # TOTP configuration defaults
  @default_issuer "CGraph"
  @default_digits 6
  @default_period 30
  @default_drift 1

  # ---------------------------------------------------------------------------
  # Secret Generation
  # ---------------------------------------------------------------------------

  @doc """
  Generate a random 20-byte TOTP secret.
  """
  @spec generate_secret() :: binary()
  def generate_secret do
    :crypto.strong_rand_bytes(20)
  end

  # ---------------------------------------------------------------------------
  # TOTP Validation
  # ---------------------------------------------------------------------------

  @doc """
  Validate a TOTP code against a secret, allowing for clock drift.
  """
  @spec valid_totp?(binary(), String.t()) :: boolean()
  def valid_totp?(secret, code) when is_binary(code) do
    # Clean the code (remove spaces/dashes)
    clean_code = code |> String.replace(~r/[\s-]/, "") |> String.trim()

    # Get current time window
    current_window = div(System.system_time(:second), period())
    drift = drift_windows()

    # Check current window and drift windows
    Enum.any?(-drift..drift, fn offset ->
      expected = generate_totp(secret, current_window + offset)
      secure_compare(clean_code, expected)
    end)
  end

  @doc """
  Generate a TOTP code for a given secret and time counter.
  """
  @spec generate_totp(binary(), integer()) :: String.t()
  def generate_totp(secret, counter) do
    # HOTP algorithm (RFC 4226)
    counter_bytes = <<counter::unsigned-big-integer-size(64)>>

    hmac = :crypto.mac(:hmac, :sha, secret, counter_bytes)

    # Dynamic truncation
    offset = :binary.at(hmac, 19) &&& 0x0F

    <<_::binary-size(offset), code::unsigned-big-integer-size(32), _::binary>> = hmac

    # Mask to get 31-bit value and take modulo for digit count
    truncated = (code &&& 0x7FFFFFFF) |> rem(power_of_10(digits()))

    # Pad with zeros
    truncated
    |> Integer.to_string()
    |> String.pad_leading(digits(), "0")
  end

  # ---------------------------------------------------------------------------
  # Secret Encryption
  # ---------------------------------------------------------------------------

  @doc """
  Encrypt a TOTP secret for storage.
  """
  @spec encrypt_secret(binary()) :: String.t()
  def encrypt_secret(secret) do
    key = get_encryption_key()
    iv = :crypto.strong_rand_bytes(16)

    {ciphertext, tag} = :crypto.crypto_one_time_aead(
      :aes_256_gcm,
      key,
      iv,
      secret,
      "",
      true
    )

    # Combine IV + tag + ciphertext for storage
    Base.encode64(iv <> tag <> ciphertext)
  end

  @doc """
  Decrypt a stored TOTP secret.
  """
  @spec decrypt_secret(String.t()) :: binary()
  def decrypt_secret(encrypted_base64) do
    key = get_encryption_key()
    data = Base.decode64!(encrypted_base64)

    <<iv::binary-size(16), tag::binary-size(16), ciphertext::binary>> = data

    :crypto.crypto_one_time_aead(
      :aes_256_gcm,
      key,
      iv,
      ciphertext,
      "",
      tag,
      false
    )
  end

  # ---------------------------------------------------------------------------
  # OTPAuth URI
  # ---------------------------------------------------------------------------

  @doc """
  Build an otpauth:// URI for authenticator app setup.
  """
  @spec build_otpauth_uri(struct(), binary()) :: String.t()
  def build_otpauth_uri(user, secret) do
    issuer = config()[:issuer] || @default_issuer
    label = "#{issuer}:#{user.email}"
    secret_base32 = Base.encode32(secret, padding: false)

    params = URI.encode_query(%{
      "secret" => secret_base32,
      "issuer" => issuer,
      "algorithm" => "SHA1",
      "digits" => digits(),
      "period" => period()
    })

    "otpauth://totp/#{URI.encode(label)}?#{params}"
  end

  # ---------------------------------------------------------------------------
  # Configuration
  # ---------------------------------------------------------------------------

  @doc "Get TOTP configuration."
  @spec config() :: keyword()
  def config, do: Application.get_env(:cgraph, CGraph.Security.TOTP, [])

  @doc "Get configured digit count."
  @spec digits() :: pos_integer()
  def digits, do: config()[:digits] || @default_digits

  @doc "Get configured period in seconds."
  @spec period() :: pos_integer()
  def period, do: config()[:period] || @default_period

  @doc "Get configured drift window count."
  @spec drift_windows() :: non_neg_integer()
  def drift_windows, do: config()[:drift] || @default_drift

  # ---------------------------------------------------------------------------
  # Private Helpers
  # ---------------------------------------------------------------------------

  defp power_of_10(n), do: :math.pow(10, n) |> round()

  defp secure_compare(a, b) when byte_size(a) != byte_size(b), do: false
  defp secure_compare(a, b) do
    # Constant-time comparison
    :crypto.hash_equals(a, b)
  end

  defp get_encryption_key do
    # Derive from application secret
    secret = Application.get_env(:cgraph, CGraphWeb.Endpoint)[:secret_key_base]

    :crypto.hash(:sha256, "totp_encryption:" <> secret)
  end
end
