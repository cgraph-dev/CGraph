defmodule CGraphWeb.API.V1.QrAuthJSON do
  @moduledoc """
  JSON rendering for QR code authentication responses.
  """

  @doc """
  Renders the QR session creation response.
  """
  @spec qr_session(map()) :: map()
  def qr_session(%{session_id: session_id, qr_payload: qr_payload, expires_in: expires_in}) do
    %{
      session_id: session_id,
      qr_payload: qr_payload,
      expires_in: expires_in
    }
  end

  @doc """
  Renders the login approval success response.
  """
  @spec login_approved(map()) :: map()
  def login_approved(%{message: message}) do
    %{
      message: message,
      status: "approved"
    }
  end
end
