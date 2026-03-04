defmodule CGraph.Accounts.WalletAuthentication do
  @moduledoc """
  Wallet signature-based authentication with SIWE (EIP-4361) + EIP-191 personal sign.

  Handles challenge nonce generation using SIWE-formatted messages and
  Ethereum signature verification for Web3 wallet login flows.

  ## SIWE Message Format (EIP-4361)

      web.cgraph.org wants you to sign in with your Ethereum account:
      0x1234...abcd

      Sign in to CGraph

      URI: https://web.cgraph.org
      Version: 1
      Chain ID: 1
      Nonce: <64-hex-chars>
      Issued At: 2026-03-03T12:00:00Z
      Expiration Time: 2026-03-03T12:05:00Z
  """

  alias CGraph.Accounts.User
  alias CGraph.Accounts.WalletChallenge
  alias CGraph.Repo

  @siwe_expiration_seconds 300
  @allowed_domains ["web.cgraph.org", "cgraph.org", "localhost"]
  @default_allowed_chain_ids [1]

  @doc """
  Get or create a wallet authentication challenge nonce.
  """
  @spec get_or_create_wallet_challenge(String.t()) :: {:ok, String.t()} | {:error, String.t()}
  def get_or_create_wallet_challenge(wallet_address) do
    normalized_address = String.downcase(wallet_address)

    case Repo.get_by(WalletChallenge, wallet_address: normalized_address) do
      nil -> create_new_wallet_challenge(normalized_address)
      wallet_challenge -> refresh_wallet_challenge_if_needed(wallet_challenge)
    end
  end

  @doc """
  Build a SIWE (EIP-4361) formatted message for wallet signing.

  ## Parameters
    - `nonce` - The challenge nonce
    - `address` - The Ethereum wallet address (checksummed or lowercase)
    - `domain` - The requesting domain (e.g., "web.cgraph.org")
  """
  @spec build_siwe_message(String.t(), String.t(), String.t()) :: String.t()
  def build_siwe_message(nonce, address, domain \\ "web.cgraph.org") do
    now = DateTime.utc_now() |> DateTime.truncate(:second)
    expiration = DateTime.add(now, @siwe_expiration_seconds, :second)

    """
    #{domain} wants you to sign in with your Ethereum account:
    #{address}

    Sign in to CGraph

    URI: https://#{domain}
    Version: 1
    Chain ID: 1
    Nonce: #{nonce}
    Issued At: #{DateTime.to_iso8601(now)}
    Expiration Time: #{DateTime.to_iso8601(expiration)}\
    """
  end

  @doc """
  Parse a SIWE-formatted message into its component fields.

  Returns a map with keys: `:domain`, `:address`, `:statement`, `:uri`,
  `:version`, `:chain_id`, `:nonce`, `:issued_at`, `:expiration_time`.
  """
  @spec parse_siwe_message(String.t()) :: {:ok, map()} | {:error, :invalid_siwe_format}
  def parse_siwe_message(message) do
    lines = String.split(message, "\n")

    with {:ok, domain} <- extract_domain(lines),
         {:ok, address} <- extract_address(lines),
         fields <- extract_siwe_fields(message) do
      if map_size(fields) >= 4 do
        {:ok,
         Map.merge(fields, %{
           domain: domain,
           address: String.downcase(address)
         })}
      else
        {:error, :invalid_siwe_format}
      end
    end
  end

  @doc """
  Verify a wallet signature and authenticate/register user.
  Supports both SIWE (EIP-4361) and legacy message formats.
  Deletes the challenge nonce after successful verification to prevent replay attacks.
  """
  @spec verify_wallet_signature(String.t(), String.t(), String.t()) ::
          {:ok, User.t()} | {:error, atom() | String.t()}
  def verify_wallet_signature(wallet_address, signature, message \\ nil) do
    normalized_address = String.downcase(wallet_address)

    result =
      with {:ok, wallet_challenge} <- get_wallet_challenge(normalized_address),
           sign_message <- message || build_legacy_sign_message(wallet_challenge.nonce),
           :ok <- validate_message(sign_message, wallet_challenge.nonce, normalized_address),
           :ok <- verify_eip191_signature(sign_message, signature, normalized_address) do
        # Delete the challenge to prevent replay attacks
        Repo.delete(wallet_challenge)

        # Get or create user for this wallet
        case get_user_by_wallet(normalized_address) do
          {:ok, user} -> {:ok, user}
          {:error, :not_found} -> create_wallet_user(normalized_address)
        end
      end

    case result do
      {:ok, user} ->
        CGraph.Audit.log(:auth, :wallet_login_success, %{
          wallet_address: normalized_address,
          user_id: user.id
        })

        {:ok, user}

      {:error, reason} ->
        CGraph.Audit.log(:auth, :wallet_login_failure, %{
          wallet_address: normalized_address,
          reason: reason
        })

        {:error, reason}
    end
  end

  # ── Message validation ──

  defp validate_message(message, expected_nonce, expected_address) do
    case parse_siwe_message(message) do
      {:ok, fields} ->
        validate_siwe_fields(fields, expected_nonce, expected_address)

      {:error, :invalid_siwe_format} ->
        # Legacy format: just verify it contains the nonce
        if String.contains?(message, expected_nonce) do
          :ok
        else
          {:error, :invalid_nonce}
        end
    end
  end

  defp validate_siwe_fields(fields, expected_nonce, expected_address) do
    with :ok <- validate_nonce(fields, expected_nonce),
         :ok <- validate_address(fields, expected_address),
         :ok <- validate_domain(fields),
         :ok <- validate_chain_id(fields),
         :ok <- validate_expiration(fields) do
      :ok
    end
  end

  defp validate_nonce(%{nonce: nonce}, expected_nonce) do
    if nonce == expected_nonce, do: :ok, else: {:error, :invalid_nonce}
  end

  defp validate_address(%{address: address}, expected_address) do
    if String.downcase(address) == String.downcase(expected_address),
      do: :ok,
      else: {:error, :address_mismatch}
  end

  defp validate_domain(%{domain: domain}) do
    if domain in @allowed_domains, do: :ok, else: {:error, :invalid_domain}
  end

  defp validate_chain_id(%{chain_id: chain_id_str}) do
    allowed =
      Application.get_env(:cgraph, :allowed_chain_ids, @default_allowed_chain_ids)

    case Integer.parse(chain_id_str) do
      {chain_id, ""} ->
        if chain_id in allowed, do: :ok, else: {:error, :invalid_chain_id}

      _ ->
        {:error, :invalid_chain_id}
    end
  end

  defp validate_chain_id(_fields), do: :ok

  defp validate_expiration(%{expiration_time: exp_str}) do
    case DateTime.from_iso8601(exp_str) do
      {:ok, expiration, _} ->
        now = DateTime.utc_now()
        if DateTime.compare(now, expiration) == :lt, do: :ok, else: {:error, :message_expired}

      _ ->
        {:error, :invalid_expiration}
    end
  end

  defp validate_expiration(_fields), do: :ok

  # ── SIWE parsing helpers ──

  defp extract_domain([first_line | _]) do
    case Regex.run(~r/^(.+) wants you to sign in/, first_line) do
      [_, domain] -> {:ok, String.trim(domain)}
      _ -> {:error, :invalid_siwe_format}
    end
  end

  defp extract_domain(_), do: {:error, :invalid_siwe_format}

  defp extract_address(lines) when length(lines) >= 2 do
    address = Enum.at(lines, 1) |> String.trim()

    if Regex.match?(~r/^0x[a-fA-F0-9]{40}$/, address) do
      {:ok, address}
    else
      {:error, :invalid_siwe_format}
    end
  end

  defp extract_address(_), do: {:error, :invalid_siwe_format}

  defp extract_siwe_fields(message) do
    field_patterns = [
      {:uri, ~r/URI:\s*(.+)/},
      {:version, ~r/Version:\s*(\d+)/},
      {:chain_id, ~r/Chain ID:\s*(\d+)/},
      {:nonce, ~r/Nonce:\s*([a-fA-F0-9]+)/},
      {:issued_at, ~r/Issued At:\s*(.+)/},
      {:expiration_time, ~r/Expiration Time:\s*(.+)/}
    ]

    Enum.reduce(field_patterns, %{}, fn {key, pattern}, acc ->
      case Regex.run(pattern, message) do
        [_, value] -> Map.put(acc, key, String.trim(value))
        _ -> acc
      end
    end)
  end

  # ── Challenge management ──

  defp create_new_wallet_challenge(normalized_address) do
    nonce = generate_nonce()

    %WalletChallenge{}
    |> WalletChallenge.changeset(%{wallet_address: normalized_address, nonce: nonce})
    |> Repo.insert()
    |> extract_nonce_from_result("Failed to create challenge")
  end

  defp refresh_wallet_challenge_if_needed(wallet_challenge) do
    if expired?(wallet_challenge.updated_at, 5 * 60) do
      regenerate_wallet_nonce(wallet_challenge)
    else
      {:ok, wallet_challenge.nonce}
    end
  end

  defp regenerate_wallet_nonce(wallet_challenge) do
    nonce = generate_nonce()

    wallet_challenge
    |> WalletChallenge.changeset(%{nonce: nonce})
    |> Repo.update()
    |> extract_nonce_from_result("Failed to update challenge")
  end

  defp extract_nonce_from_result({:ok, record}, _error_msg), do: {:ok, record.nonce}
  defp extract_nonce_from_result({:error, _}, error_msg), do: {:error, error_msg}

  defp get_wallet_challenge(address) do
    case Repo.get_by(WalletChallenge, wallet_address: address) do
      nil -> {:error, :no_challenge}
      wallet_challenge -> {:ok, wallet_challenge}
    end
  end

  @doc false
  defp build_legacy_sign_message(nonce) do
    "Sign this message to authenticate with CGraph.\n\nNonce: #{nonce}"
  end

  # ── EIP-191 signature verification ──

  defp verify_eip191_signature(message, signature, expected_address) do
    prefix = "\x19Ethereum Signed Message:\n#{byte_size(message)}"
    full_message = prefix <> message
    {:ok, hash} = ExKeccak.hash_256(full_message)

    with {:ok, sig_bytes} <- decode_signature(signature),
         {:ok, recovered_pubkey} <- recover_public_key(hash, sig_bytes),
         recovered_address <- pubkey_to_address(recovered_pubkey) do
      if recovered_address == expected_address do
        :ok
      else
        {:error, :invalid_signature}
      end
    end
  end

  defp decode_signature("0x" <> hex), do: decode_signature(hex)

  defp decode_signature(hex) when byte_size(hex) == 130 do
    {:ok, Base.decode16!(hex, case: :mixed)}
  end

  defp decode_signature(_), do: {:error, :invalid_signature}

  defp recover_public_key(hash, sig_bytes) do
    <<r::binary-size(32), s::binary-size(32), v::integer>> = sig_bytes
    recovery_id = if v >= 27, do: v - 27, else: v

    case ExSecp256k1.recover_compact(hash, r <> s, recovery_id) do
      {:ok, pubkey} -> {:ok, pubkey}
      _ -> {:error, :invalid_signature}
    end
  end

  defp pubkey_to_address(pubkey) do
    <<_::8, rest::binary>> = pubkey
    {:ok, hash} = ExKeccak.hash_256(rest)
    <<_::binary-size(12), address::binary-size(20)>> = hash
    "0x" <> Base.encode16(address, case: :lower)
  end

  defp get_user_by_wallet(address) do
    case Repo.get_by(User, wallet_address: address) do
      nil -> {:error, :not_found}
      user -> {:ok, user}
    end
  end

  defp create_wallet_user(wallet_address) do
    username = "wallet_" <> String.slice(wallet_address, 2, 8)

    %User{}
    |> User.wallet_registration_changeset(%{
      wallet_address: wallet_address,
      username: username,
      display_name: String.slice(wallet_address, 0, 10) <> "..."
    })
    |> Repo.insert()
  end

  defp generate_nonce do
    :crypto.strong_rand_bytes(32) |> Base.encode16(case: :lower)
  end

  defp expired?(datetime, seconds) do
    DateTime.diff(DateTime.truncate(DateTime.utc_now(), :second), datetime) > seconds
  end
end
