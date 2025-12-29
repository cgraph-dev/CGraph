defmodule CgraphWeb.UserAuth do
  @moduledoc """
  User authentication helper functions for routers and controllers.
  
  Provides plugs and helpers for managing user sessions and authentication.
  """

  import Plug.Conn
  import Phoenix.Controller

  alias Cgraph.Accounts

  @doc """
  Fetches the current user from the session or token.
  """
  def fetch_current_user(conn, _opts) do
    case get_session(conn, :user_token) do
      nil ->
        assign(conn, :current_user, nil)

      user_token ->
        case Accounts.get_user_by_session_token(user_token) do
          {:ok, user} -> assign(conn, :current_user, user)
          _ -> assign(conn, :current_user, nil)
        end
    end
  end

  @doc """
  Authenticates the user by looking into the session.
  """
  def require_authenticated_user(conn, _opts) do
    if conn.assigns[:current_user] do
      conn
    else
      conn
      |> put_flash(:error, "You must log in to access this page.")
      |> redirect(to: "/login")
      |> halt()
    end
  end

  @doc """
  Redirects authenticated users (for login/register pages).
  """
  def redirect_if_user_is_authenticated(conn, _opts) do
    if conn.assigns[:current_user] do
      conn
      |> redirect(to: "/")
      |> halt()
    else
      conn
    end
  end

  @doc """
  Logs the user in by putting the user token in the session.
  """
  def log_in_user(conn, user, _opts \\ []) do
    token = Accounts.generate_session_token(user)

    conn
    |> renew_session()
    |> put_session(:user_token, token)
    |> put_session(:live_socket_id, "users_sessions:#{Base.url_encode64(token)}")
    |> redirect(to: "/")
  end

  @doc """
  Logs the user out by clearing the session.
  """
  def log_out_user(conn) do
    if token = get_session(conn, :user_token) do
      Accounts.delete_session_token(token)
    end

    if live_socket_id = get_session(conn, :live_socket_id) do
      CgraphWeb.Endpoint.broadcast(live_socket_id, "disconnect", %{})
    end

    conn
    |> renew_session()
    |> redirect(to: "/")
  end

  defp renew_session(conn) do
    conn
    |> configure_session(renew: true)
    |> clear_session()
  end
end
