defmodule CGraph.Auth.QrLogin do
  @moduledoc """
  QR code login protocol for cross-device authentication.

  Allows authenticated mobile users to log into web sessions by scanning
  a QR code. Protocol flow:

  1. Web requests QR session → creates session in Redis (5min TTL)
  2. Web displays QR + subscribes to `qr_auth:{session_id}` channel
  3. Mobile scans QR → decodes session_id + challenge
  4. Mobile POSTs signed challenge (HMAC-SHA256) to /api/v1/auth/qr-login
  5. Backend verifies → generates tokens → broadcasts on channel → web authenticated

  ## Security

  - Sessions expire after 5 minutes (300s TTL)
  - Challenge is signed with HMAC-SHA256 using user_id as key
  - Each session is single-use (deleted after completion)
  - Session data stored only in Redis (ephemeral)
  """

  require Logger

  alias CGraph.Auth.TokenManager
  alias CGraph.Redis

  @session_ttl 300
  @redis_prefix "qr_auth:"

  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------

  @doc """
  Create a new QR login session.

  Generates a UUID session_id and a 32-byte random challenge,
  stores them in Redis with a 300-second TTL.

  Returns `{:ok, %{session_id: String.t(), challenge: String.t()}}`.
  """
  @spec create_session() :: {:ok, map()} | {:error, term()}
  def create_session do
    session_id = Ecto.UUID.generate()
    challenge = :crypto.strong_rand_bytes(32) |> Base.url_encode64(padding: false)

    key = redis_key(session_id)

    case Redis.command([
           "SET",
           key,
           Jason.encode!(%{
             session_id: session_id,
             challenge: challenge,
             status: "pending",
             created_at: DateTime.utc_now() |> DateTime.to_iso8601()
           }),
           "EX",
           Integer.to_string(@session_ttl)
         ]) do
      {:ok, "OK"} ->
        Logger.info("qr_login_session_created", session_id: session_id)
        {:ok, %{session_id: session_id, challenge: challenge}}

      {:error, reason} ->
        Logger.error("qr_login_session_create_failed", reason: inspect(reason))
        {:error, :redis_error}
    end
  end

  @doc """
  Fetch a QR login session from Redis.

  Returns `{:ok, session_map}` or `{:error, :not_found}`.
  """
  @spec get_session(String.t()) :: {:ok, map()} | {:error, :not_found | term()}
  def get_session(session_id) do
    key = redis_key(session_id)

    case Redis.command(["GET", key]) do
      {:ok, nil} ->
        {:error, :not_found}

      {:ok, data} when is_binary(data) ->
        {:ok, Jason.decode!(data, keys: :atoms!)}

      {:error, reason} ->
        Logger.error("qr_login_session_get_failed",
          session_id: session_id,
          reason: inspect(reason)
        )

        {:error, :redis_error}
    end
  end

  @doc """
  Verify the HMAC-SHA256 signature and complete the QR login session.

  - `session_id`: The QR session to complete
  - `signature`: HMAC-SHA256(challenge, user_id) from mobile client
  - `user`: The authenticated user from mobile

  On success, generates tokens and returns them.
  """
  @spec verify_and_complete(String.t(), String.t(), map()) ::
          {:ok, map()} | {:error, atom()}
  def verify_and_complete(session_id, signature, user) do
    with {:ok, session} <- get_session(session_id),
         :ok <- verify_status(session),
         :ok <- verify_signature(session.challenge, signature, user.id) do
      # Generate tokens for the web session
      case TokenManager.generate_tokens(user) do
        {:ok, tokens} ->
          # Mark session completed then delete
          delete_session(session_id)

          Logger.info("qr_login_completed",
            session_id: session_id,
            user_id: user.id
          )

          {:ok, %{tokens: tokens, user: user}}

        {:error, reason} ->
          Logger.error("qr_login_token_generation_failed",
            session_id: session_id,
            reason: inspect(reason)
          )

          {:error, :token_generation_failed}
      end
    end
  end

  @doc """
  Delete a QR login session from Redis.
  """
  @spec delete_session(String.t()) :: :ok | {:error, term()}
  def delete_session(session_id) do
    key = redis_key(session_id)

    case Redis.command(["DEL", key]) do
      {:ok, _} -> :ok
      {:error, reason} -> {:error, reason}
    end
  end

  # ---------------------------------------------------------------------------
  # Private helpers
  # ---------------------------------------------------------------------------

  defp redis_key(session_id), do: @redis_prefix <> session_id

  defp verify_status(%{status: "pending"}), do: :ok
  defp verify_status(%{status: "completed"}), do: {:error, :session_already_used}
  defp verify_status(_), do: {:error, :invalid_session}

  defp verify_signature(challenge, signature, user_id) do
    # The mobile client computes: HMAC-SHA256(challenge, to_string(user_id))
    expected =
      :crypto.mac(:hmac, :sha256, to_string(user_id), challenge)
      |> Base.url_encode64(padding: false)

    if Plug.Crypto.secure_compare(expected, signature) do
      :ok
    else
      Logger.warning("qr_login_signature_mismatch", user_id: user_id)
      {:error, :invalid_signature}
    end
  end
end
