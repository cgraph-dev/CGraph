defmodule CgraphWeb.WalletAuthController do
  @moduledoc """
  Controller for wallet-based authentication endpoints.

  Provides anonymous wallet registration, authentication, and recovery flows.
  """

  use CgraphWeb, :controller

  alias Cgraph.Accounts.WalletAuth
  alias Cgraph.Guardian

  action_fallback CgraphWeb.FallbackController

  @doc """
  Generates new wallet credentials for display to user.

  POST /api/v1/auth/wallet/generate
  """
  def generate(conn, _params) do
    {:ok, wallet_address} = WalletAuth.generate_wallet_address()
    {:ok, crypto_alias} = WalletAuth.generate_crypto_alias()

    conn
    |> put_status(:ok)
    |> json(%{
      wallet_address: wallet_address,
      crypto_alias: crypto_alias
    })
  end

  @doc """
  Validates PIN strength without storing.

  POST /api/v1/auth/wallet/validate-pin
  Body: { "pin": "123456" }
  """
  def validate_pin(conn, %{"pin" => pin}) do
    case WalletAuth.validate_pin_strength(pin) do
      {:ok, strength} ->
        score = case strength do
          :minimum -> 25
          :good -> 55
          :excellent -> 100
        end

        conn
        |> put_status(:ok)
        |> json(%{
          valid: true,
          strength: strength,
          score: score
        })

      {:error, reason} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{
          valid: false,
          error: reason
        })
    end
  end

  @doc """
  Creates a new wallet-authenticated user.

  POST /api/v1/auth/wallet/register
  Body: {
    "wallet_address": "0x...",
    "crypto_alias": "quantum-cipher-ABC123",
    "pin": "123456",
    "recovery_method": "backup_codes" | "file"
  }
  """
  def register(conn, params) do
    %{
      "wallet_address" => wallet_address,
      "crypto_alias" => crypto_alias,
      "pin" => pin
    } = params

    recovery_method = case params["recovery_method"] do
      "file" -> :file
      _ -> :backup_codes
    end

    case WalletAuth.create_wallet_user(wallet_address, crypto_alias, pin, recovery_method) do
      {:ok, %{user: user, recovery_data: recovery_data}} ->
        {:ok, token, _claims} = Guardian.encode_and_sign(user, %{}, token_type: "access")
        {:ok, refresh_token, _claims} = Guardian.encode_and_sign(user, %{}, token_type: "refresh")

        response = %{
          user: %{
            id: user.id,
            wallet_address: user.wallet_address,
            crypto_alias: user.crypto_alias,
            display_name: user.display_name
          },
          tokens: %{
            access_token: token,
            refresh_token: refresh_token,
            token_type: "Bearer"
          },
          recovery: format_recovery_data(recovery_data)
        }

        conn
        |> put_status(:created)
        |> json(response)

      {:error, reason} when is_atom(reason) ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: reason})

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{errors: format_changeset_errors(changeset)})
    end
  end

  @doc """
  Authenticates with wallet address and PIN.

  POST /api/v1/auth/wallet/login
  Body: { "wallet_address": "0x...", "pin": "123456" }
  OR:   { "crypto_alias": "quantum-cipher-ABC123", "pin": "123456" }
  """
  def login(conn, %{"wallet_address" => wallet_address, "pin" => pin}) do
    case WalletAuth.authenticate_wallet(wallet_address, pin) do
      {:ok, user} ->
        issue_tokens(conn, user)

      {:error, reason} ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: reason})
    end
  end

  def login(conn, %{"crypto_alias" => crypto_alias, "pin" => pin}) do
    case WalletAuth.authenticate_alias(crypto_alias, pin) do
      {:ok, user} ->
        issue_tokens(conn, user)

      {:error, reason} ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: reason})
    end
  end

  @doc """
  Recovers account using backup code.

  POST /api/v1/auth/wallet/recover/code
  Body: {
    "wallet_address": "0x...",
    "recovery_code": "A3B7-K9M2-P5Q8-R1S4",
    "new_pin": "654321"
  }
  """
  def recover_with_code(conn, params) do
    %{
      "wallet_address" => wallet_address,
      "recovery_code" => recovery_code,
      "new_pin" => new_pin
    } = params

    case WalletAuth.recover_with_code(wallet_address, recovery_code, new_pin) do
      {:ok, {:ok, user}} ->
        # Generate remaining recovery codes count
        remaining = count_remaining_codes(user.id)

        conn
        |> put_status(:ok)
        |> json(%{
          success: true,
          message: "PIN has been reset successfully",
          remaining_recovery_codes: remaining
        })

      {:error, reason} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: reason})
    end
  end

  @doc """
  Recovers account using recovery file.

  POST /api/v1/auth/wallet/recover/file
  Body: {
    "file_content": "base64_encoded_file_content",
    "old_pin": "123456",
    "new_pin": "654321"
  }
  """
  def recover_with_file(conn, params) do
    %{
      "file_content" => file_content,
      "old_pin" => old_pin,
      "new_pin" => new_pin
    } = params

    case WalletAuth.recover_with_file(file_content, old_pin, new_pin) do
      {:ok, user} ->
        conn
        |> put_status(:ok)
        |> json(%{
          success: true,
          message: "PIN has been reset successfully",
          wallet_address: user.wallet_address
        })

      {:error, reason} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: reason})
    end
  end

  @doc """
  Links wallet to existing email account.

  POST /api/v1/auth/wallet/link
  Body: { "pin": "123456" }
  Requires: Authentication (Bearer token)
  """
  def link_wallet(conn, %{"pin" => pin}) do
    user = Guardian.Plug.current_resource(conn)

    case WalletAuth.link_wallet_to_user(user, pin) do
      {:ok, updated_user} ->
        conn
        |> put_status(:ok)
        |> json(%{
          success: true,
          wallet_address: updated_user.wallet_address,
          crypto_alias: updated_user.crypto_alias
        })

      {:error, reason} when is_atom(reason) ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: reason})

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{errors: format_changeset_errors(changeset)})
    end
  end

  @doc """
  Unlinks wallet from account (requires email to be linked).

  DELETE /api/v1/auth/wallet/unlink
  Requires: Authentication (Bearer token)
  """
  def unlink_wallet(conn, _params) do
    user = Guardian.Plug.current_resource(conn)

    case WalletAuth.unlink_wallet(user) do
      {:ok, _} ->
        conn
        |> put_status(:ok)
        |> json(%{success: true, message: "Wallet unlinked successfully"})

      {:error, :email_required} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: "Cannot unlink wallet without email linked"})
    end
  end

  # Private helpers

  defp issue_tokens(conn, user) do
    {:ok, token, _claims} = Guardian.encode_and_sign(user, %{}, token_type: "access")
    {:ok, refresh_token, _claims} = Guardian.encode_and_sign(user, %{}, token_type: "refresh")

    conn
    |> put_status(:ok)
    |> json(%{
      user: %{
        id: user.id,
        wallet_address: user.wallet_address,
        crypto_alias: user.crypto_alias,
        display_name: user.display_name,
        avatar_url: user.avatar_url
      },
      tokens: %{
        access_token: token,
        refresh_token: refresh_token,
        token_type: "Bearer"
      }
    })
  end

  defp format_recovery_data(%{type: :backup_codes, codes: codes}) do
    %{
      type: "backup_codes",
      codes: codes,
      instructions: "Save these codes in a safe place. Each code can only be used once."
    }
  end

  defp format_recovery_data(%{type: :file, content: content, filename: filename}) do
    %{
      type: "file",
      content: content,
      filename: filename,
      instructions: "Download this file and store it safely. You'll need your PIN to use it."
    }
  end

  defp format_changeset_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Enum.reduce(opts, msg, fn {key, value}, acc ->
        String.replace(acc, "%{#{key}}", to_string(value))
      end)
    end)
  end

  defp count_remaining_codes(user_id) do
    import Ecto.Query
    alias Cgraph.Repo
    alias Cgraph.Accounts.RecoveryCode

    Repo.one(
      from rc in RecoveryCode,
        where: rc.user_id == ^user_id and rc.used == false,
        select: count(rc.id)
    )
  end
end
