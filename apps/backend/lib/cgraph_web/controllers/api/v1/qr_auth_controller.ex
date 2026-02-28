defmodule CGraphWeb.API.V1.QrAuthController do
  @moduledoc """
  Controller for QR code login protocol.

  Provides two endpoints:
  - `create_session/2` (public): Creates a QR login session for web display
  - `approve_login/2` (authenticated): Mobile approves QR login after scanning
  """
  use CGraphWeb, :controller

  alias CGraph.Auth.QrLogin

  action_fallback CGraphWeb.FallbackController

  @doc """
  Create a new QR login session (unauthenticated).

  The web client calls this to get a session_id and challenge to encode
  into a QR code. The client then subscribes to the `qr_auth:{session_id}`
  WebSocket channel to await approval.

  ## Response

      %{
        session_id: "uuid",
        qr_payload: "base64-encoded JSON",
        expires_in: 300
      }
  """
  @spec create_session(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def create_session(conn, _params) do
    case QrLogin.create_session() do
      {:ok, %{session_id: session_id, challenge: challenge}} ->
        # Build QR payload: Base64-encoded JSON with session info
        server_url = CGraphWeb.Endpoint.url()

        qr_data =
          Jason.encode!(%{
            sid: session_id,
            ch: challenge,
            srv: server_url
          })

        qr_payload = Base.url_encode64(qr_data, padding: false)

        conn
        |> put_status(:created)
        |> render(:qr_session, %{
          session_id: session_id,
          qr_payload: qr_payload,
          expires_in: 300
        })

      {:error, _reason} ->
        conn
        |> put_status(:service_unavailable)
        |> json(%{error: "Unable to create QR session. Please try again."})
    end
  end

  @doc """
  Approve a QR login from an authenticated mobile session.

  The mobile client scans the QR code, extracts the session_id and challenge,
  computes HMAC-SHA256(challenge, user_id), and sends it here.

  On success, broadcasts `auth_complete` on the `qr_auth:{session_id}` channel
  so the web client receives the tokens.

  ## Parameters

  - `session_id`: The QR session ID from the QR code
  - `signature`: HMAC-SHA256(challenge, user_id) computed by mobile
  """
  @spec approve_login(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def approve_login(conn, %{"session_id" => session_id, "signature" => signature}) do
    user = conn.assigns.current_user

    case QrLogin.verify_and_complete(session_id, signature, user) do
      {:ok, %{tokens: tokens, user: authenticated_user}} ->
        # Broadcast to the web client via the QR auth channel
        CGraphWeb.Endpoint.broadcast("qr_auth:#{session_id}", "auth_complete", %{
          tokens: tokens,
          user: render_user(authenticated_user)
        })

        conn
        |> put_status(:ok)
        |> render(:login_approved, %{message: "Login approved"})

      {:error, :not_found} ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "QR session not found or expired"})

      {:error, :session_already_used} ->
        conn
        |> put_status(:conflict)
        |> json(%{error: "QR session has already been used"})

      {:error, :invalid_signature} ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "Invalid QR login signature"})

      {:error, _reason} ->
        conn
        |> put_status(:internal_server_error)
        |> json(%{error: "QR login failed. Please try again."})
    end
  end

  def approve_login(conn, _params) do
    conn
    |> put_status(:bad_request)
    |> json(%{error: "Missing required parameters: session_id, signature"})
  end

  # ---------------------------------------------------------------------------
  # Private
  # ---------------------------------------------------------------------------

  defp render_user(user) do
    %{
      id: user.id,
      email: user.email,
      username: user.username,
      display_name: user.display_name,
      avatar_url: user.avatar_url
    }
  end
end
