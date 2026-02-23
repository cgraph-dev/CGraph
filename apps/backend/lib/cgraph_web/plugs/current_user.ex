defmodule CGraphWeb.Plugs.CurrentUser do
  @moduledoc """
  Plug to assign the current user to the connection.
  """
  import Plug.Conn

  @doc "Initializes plug options."
  @spec init(keyword()) :: keyword()
  def init(opts), do: opts

  @doc "Processes the connection through this plug."
  @spec call(Plug.Conn.t(), keyword()) :: Plug.Conn.t()
  def call(conn, _opts) do
    case Guardian.Plug.current_resource(conn) do
      nil -> conn
      user -> assign(conn, :current_user, user)
    end
  end
end
