defmodule CGraphWeb.Plugs.RequireAdmin do
  @moduledoc """
  Authorization plug that restricts access to admin users only.

  Use this plug in admin-only routes to ensure proper authorization.
  Must be used after authentication plug (RequireAuthenticated or api_auth pipeline).

  ## Usage

      # In router.ex
      scope "/api/v1/admin", CGraphWeb.API.V1 do
        pipe_through [:api, :api_auth]
        plug CGraphWeb.Plugs.RequireAdmin

        get "/metrics", AdminController, :metrics
        # ...
      end

  ## Security

  This plug fails closed - if `current_user` is not set or `is_admin` is not true,
  access is denied with a 403 Forbidden response.
  """

  import Plug.Conn

  require Logger

  def init(opts), do: opts

  def call(conn, _opts) do
    user = conn.assigns[:current_user]

    cond do
      is_nil(user) ->
        Logger.warning("Admin access attempted without authentication")
        deny_access(conn, "Authentication required")

      user.is_admin != true ->
        Logger.warning("Non-admin user #{user.id} attempted admin access to #{conn.request_path}")
        deny_access(conn, "Admin access required")

      true ->
        # User is authenticated and is admin
        conn
    end
  end

  defp deny_access(conn, message) do
    conn
    |> put_status(:forbidden)
    |> Phoenix.Controller.put_view(json: CGraphWeb.ErrorJSON)
    |> Phoenix.Controller.render(:error, %{error: message})
    |> halt()
  end
end
