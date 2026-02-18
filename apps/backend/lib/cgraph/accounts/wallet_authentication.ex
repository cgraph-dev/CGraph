defmodule CGraph.Accounts.WalletAuthentication do
  @moduledoc """
  Wallet signature-based authentication (EIP-191 personal sign).

  Handles challenge nonce generation and Ethereum signature verification
  for Web3 wallet login flows.
  """

  alias CGraph.Accounts.User
  alias CGraph.Accounts.WalletChallenge
  alias CGraph.Repo

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
  Verify a wallet signature and authenticate/register user.
  Deletes the challenge nonce after successful verification to prevent replay attacks.
  """
  @spec verify_wallet_signature(String.t(), String.t()) :: {:ok, User.t()} | {:error, atom() | String.t()}
  def verify_wallet_signature(wallet_address, signature) do
    normalized_address = String.downcase(wallet_address)

    with {:ok, wallet_challenge} <- get_wallet_challenge(normalized_address),
         message <- build_sign_message(wallet_challenge.nonce),
         :ok <- verify_signature(message, signature, normalized_address) do
      # Delete the challenge to prevent replay attacks
      Repo.delete(wallet_challenge)

      # Get or create user for this wallet
      case get_user_by_wallet(normalized_address) do
        {:ok, user} -> {:ok, user}
        {:error, :not_found} -> create_wallet_user(normalized_address)
      end
    end
  end

  # Private helpers

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

  defp build_sign_message(nonce) do
    "Sign this message to authenticate with CGraph.\n\nNonce: #{nonce}"
  end

  defp verify_signature(message, signature, expected_address) do
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
