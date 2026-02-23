defmodule CGraph.Accounts.WalletAuth do
  @moduledoc """
  Handles anonymous wallet-based authentication.

  Wallet authentication provides a privacy-first login method where users
  are identified by a cryptographic wallet address instead of email/password.

  ## Credential Format

  - Wallet Address: `0x` + 24 hexadecimal characters (e.g., `0x4A7F3C9E2D1B8E4F6C5A2B9D`)
  - Crypto Alias: `word-word-XXXXXX` format (e.g., `quantum-cipher-ABC123`)
  - PIN: 4-6 digit numeric code for authentication

  ## Submodules

  - `WalletAuth.Credentials` — address/alias generation, PIN management
  - `WalletAuth.Recovery` — recovery codes, file encryption, account recovery
  - `WalletAuth.AccountManager` — registration, authentication, linking
  """

  alias CGraph.Accounts.WalletAuth.{AccountManager, Credentials, Recovery}

  # =============================================================================
  # Credentials — Wallet Address, Crypto Alias, PIN
  # =============================================================================

  defdelegate generate_wallet_address(), to: Credentials
  defdelegate valid_wallet_address?(address), to: Credentials
  defdelegate generate_crypto_alias(), to: Credentials
  defdelegate validate_pin_strength(pin), to: Credentials
  defdelegate hash_pin(pin), to: Credentials
  defdelegate verify_pin(pin, hash), to: Credentials

  # =============================================================================
  # Recovery — Codes, Files, Account Recovery
  # =============================================================================

  @doc """
  Generates single-use recovery codes. Defaults to 8 codes.
  """
  @spec generate_recovery_codes(pos_integer()) :: [String.t()]
  def generate_recovery_codes(count \\ 8), do: Recovery.generate_recovery_codes(count)

  defdelegate hash_recovery_codes(codes), to: Recovery
  defdelegate verify_recovery_code(input_code, hashed_codes), to: Recovery
  defdelegate generate_recovery_file(wallet_address, crypto_alias, pin), to: Recovery
  defdelegate decrypt_recovery_file(encrypted_content, pin), to: Recovery
  defdelegate recover_with_code(wallet_address, recovery_code, new_pin), to: Recovery
  defdelegate recover_with_file(file_content, old_pin, new_pin), to: Recovery

  # =============================================================================
  # Account Management — Registration, Auth, Linking
  # =============================================================================

  @doc """
  Creates a new wallet-authenticated user. Defaults recovery_method to :backup_codes.
  """
  @spec create_wallet_user(String.t(), String.t(), String.t(), atom()) :: {:ok, term()} | {:error, term()}
  def create_wallet_user(wallet_address, crypto_alias, pin, recovery_method \\ :backup_codes) do
    AccountManager.create_wallet_user(wallet_address, crypto_alias, pin, recovery_method)
  end

  defdelegate authenticate_wallet(wallet_address, pin), to: AccountManager
  defdelegate authenticate_alias(crypto_alias, pin), to: AccountManager
  defdelegate update_pin(user, current_pin, new_pin), to: AccountManager
  defdelegate link_wallet_to_user(user, pin), to: AccountManager
  defdelegate link_email_to_wallet_user(user, email, password), to: AccountManager
  defdelegate unlink_wallet(user), to: AccountManager
end
