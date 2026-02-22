defmodule CGraph.Accounts.WalletAuth.Credentials do
  @moduledoc """
  Handles wallet address generation, crypto alias generation, and PIN management.

  This module provides the low-level credential primitives used by the wallet
  authentication system, including:

  - Wallet address generation and validation (`0x` + 24 hex chars)
  - Crypto alias generation (`word-word-XXXXXX` format)
  - PIN strength validation, hashing, and verification
  """

  import Ecto.Query

  alias CGraph.Accounts.User
  alias CGraph.Repo

  @wallet_prefix "0x"
  @wallet_hex_length 24
  @alias_words_first ~w(quantum stellar cosmic neural atomic digital cyber crystal shadow phantom
                        arctic blazing cosmic digital ethereal frozen golden hidden iron jade
                        lunar mystic neon obsidian plasma radiant silent thunder ultra violet)
  @alias_words_second ~w(cipher nexus pulse vortex matrix shield beacon prism nova flux
                         forge spark drift echo flame ghost haven iris knight lotus
                         nexus omega phoenix quasar raven storm titan unity wave zenith)

  # =============================================================================
  # Wallet Address Generation
  # =============================================================================

  @doc """
  Generates a new unique wallet address.

  Format: 0x + 24 hexadecimal characters
  Example: 0x4A7F3C9E2D1B8E4F6C5A2B9D

  Returns `{:ok, address}` or `{:error, reason}` if generation fails.
  """
  @spec generate_wallet_address() :: {:ok, String.t()}
  def generate_wallet_address do
    address = do_generate_address()

    # Ensure uniqueness
    if wallet_address_exists?(address) do
      generate_wallet_address()
    else
      {:ok, address}
    end
  end

  defp do_generate_address do
    random_hex =
      :crypto.strong_rand_bytes(div(@wallet_hex_length, 2))
      |> Base.encode16()
      |> binary_part(0, @wallet_hex_length)

    @wallet_prefix <> random_hex
  end

  @doc """
  Validates wallet address format.
  """
  @spec valid_wallet_address?(any()) :: boolean()
  def valid_wallet_address?(address) when is_binary(address) do
    case address do
      <<@wallet_prefix, hex::binary-size(@wallet_hex_length)>> ->
        String.match?(hex, ~r/^[0-9A-Fa-f]+$/)
      _ ->
        false
    end
  end

  def valid_wallet_address?(_), do: false

  defp wallet_address_exists?(address) do
    Repo.exists?(from u in User, where: u.wallet_address == ^address)
  end

  # =============================================================================
  # Crypto Alias Generation
  # =============================================================================

  @doc """
  Generates a unique crypto alias.

  Format: word-word-XXXXXX (where X is alphanumeric)
  Example: quantum-cipher-ABC123
  """
  @spec generate_crypto_alias() :: {:ok, String.t()}
  def generate_crypto_alias do
    alias_str = do_generate_alias()

    if crypto_alias_exists?(alias_str) do
      generate_crypto_alias()
    else
      {:ok, alias_str}
    end
  end

  defp do_generate_alias do
    word1 = Enum.random(@alias_words_first)
    word2 = Enum.random(@alias_words_second)
    suffix = generate_alphanumeric_suffix(6)

    "#{word1}-#{word2}-#{suffix}"
  end

  defp generate_alphanumeric_suffix(length) do
    chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    chars_len = String.length(chars)

    :crypto.strong_rand_bytes(length)
    |> :binary.bin_to_list()
    |> Enum.map(fn byte -> String.at(chars, rem(byte, chars_len)) end)
    |> Enum.join()
  end

  defp crypto_alias_exists?(alias_str) do
    Repo.exists?(from u in User, where: u.crypto_alias == ^alias_str)
  end

  # =============================================================================
  # PIN Management
  # =============================================================================

  @doc """
  Validates PIN strength.

  Returns:
  - `{:ok, :excellent}` for 6 digits
  - `{:ok, :good}` for 5 digits
  - `{:error, :too_short}` for 4 digits (minimum allowed but weak)
  - `{:error, :invalid}` for less than 4 or non-numeric
  """
  @spec validate_pin_strength(any()) :: {:ok, :minimum | :good | :excellent} | {:error, atom()}
  def validate_pin_strength(pin) when is_binary(pin) do
    cond do
      not String.match?(pin, ~r/^\d+$/) ->
        {:error, :invalid_format}

      String.length(pin) < 4 ->
        {:error, :too_short}

      String.length(pin) == 4 ->
        {:ok, :minimum}

      String.length(pin) == 5 ->
        {:ok, :good}

      String.length(pin) >= 6 ->
        {:ok, :excellent}

      true ->
        {:error, :invalid}
    end
  end

  def validate_pin_strength(_), do: {:error, :invalid}

  @doc """
  Hashes a PIN for storage.
  Uses Argon2 for secure hashing.
  """
  @spec hash_pin(String.t()) :: String.t()
  def hash_pin(pin) do
    Argon2.hash_pwd_salt(pin)
  end

  @doc """
  Verifies a PIN against its hash.
  """
  @spec verify_pin(String.t(), String.t()) :: boolean()
  def verify_pin(pin, hash) do
    Argon2.verify_pass(pin, hash)
  end
end
