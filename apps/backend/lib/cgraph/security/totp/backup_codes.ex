defmodule CGraph.Security.TOTP.BackupCodes do
  @moduledoc """
  Backup code generation, hashing, and management for TOTP 2FA.

  Backup codes provide account recovery when an authenticator app
  is unavailable. Each code can only be used once.
  """

  @backup_codes_count 10
  @backup_code_length 8

  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------

  @doc """
  Generate a set of random backup codes.
  """
  @spec generate_backup_codes() :: [String.t()]
  def generate_backup_codes do
    Enum.map(1..@backup_codes_count, fn _ ->
      :crypto.strong_rand_bytes(@backup_code_length)
      |> Base.encode32(case: :lower, padding: false)
      |> String.slice(0, @backup_code_length)
      |> format_backup_code()
    end)
  end

  @doc """
  Normalize a backup code by uppercasing and stripping separators.
  """
  @spec normalize_backup_code(String.t()) :: String.t()
  def normalize_backup_code(code) do
    code
    |> String.upcase()
    |> String.replace(~r/[\s-]/, "")
  end

  @doc """
  Hash a single backup code (one-way).
  """
  @spec hash_backup_code(String.t()) :: String.t()
  def hash_backup_code(code) do
    :crypto.hash(:sha256, code)
    |> Base.encode64()
  end

  @doc """
  Hash a list of backup codes after normalizing each.
  """
  @spec hash_backup_codes([String.t()]) :: [String.t()]
  def hash_backup_codes(codes) do
    Enum.map(codes, fn code ->
      normalized = normalize_backup_code(code)
      hash_backup_code(normalized)
    end)
  end

  @doc """
  Find and remove a matching backup code hash from the list.

  Returns `{:ok, remaining_codes}` or `:not_found`.
  """
  @spec find_and_remove_backup_code([String.t()], String.t()) ::
    {:ok, [String.t()]} | :not_found
  def find_and_remove_backup_code(hashed_codes, target_hash) do
    if target_hash in hashed_codes do
      {:ok, List.delete(hashed_codes, target_hash)}
    else
      :not_found
    end
  end

  # ---------------------------------------------------------------------------
  # Private Helpers
  # ---------------------------------------------------------------------------

  defp format_backup_code(code) do
    # Format as XXXX-XXXX for readability
    code
    |> String.upcase()
    |> String.slice(0, 8)
    |> String.split_at(4)
    |> then(fn {a, b} -> "#{a}-#{b}" end)
  end
end
