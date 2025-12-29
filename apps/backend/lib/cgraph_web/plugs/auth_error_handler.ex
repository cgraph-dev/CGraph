defmodule CgraphWeb.Plugs.AuthErrorHandler do
  @moduledoc """
  Error handler for Guardian authentication failures.
  """
  import Plug.Conn

  @behaviour Guardian.Plug.ErrorHandler

  @impl Guardian.Plug.ErrorHandler
  def auth_error(conn, {type, _reason}, _opts) do
    body = Jason.encode!(%{
      error: "Unauthorized",
      message: error_message(type)
    })

    conn
    |> put_resp_content_type("application/json")
    |> send_resp(401, body)
  end

  defp error_message(:unauthenticated), do: "Authentication required"
  defp error_message(:invalid_token), do: "Invalid or expired token"
  defp error_message(:no_resource_found), do: "User not found"
  defp error_message(_), do: "Authentication failed"
end
