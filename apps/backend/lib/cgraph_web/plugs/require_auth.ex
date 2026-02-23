defmodule CGraphWeb.Plugs.RequireAuth do
  @moduledoc """
  Authentication plug that verifies Bearer tokens and loads the current user.

  Composes Guardian's verification, authentication, and resource-loading steps
  into a single plug for use in authenticated API pipelines.

  ## Usage

      # In router.ex
      pipeline :api_auth do
        plug CGraphWeb.Plugs.RequireAuth
      end

  ## Behavior

  1. Verifies the Bearer token from the Authorization header via Guardian.
  2. Ensures the token is valid and not expired.
  3. Loads the associated user resource.
  4. Assigns `:current_user` on the connection.

  On failure at any step, returns a 401 Unauthorized JSON response and halts.
  """

  @behaviour Plug

  import Plug.Conn

  require Logger

  @doc "Initializes plug options."
  @spec init(keyword()) :: keyword()
  @impl Plug
  def init(opts), do: opts

  @doc "Processes the connection through this plug."
  @spec call(Plug.Conn.t(), keyword()) :: Plug.Conn.t()
  @impl Plug
  def call(conn, _opts) do
    conn
    |> Guardian.Plug.VerifyHeader.call(verify_header_opts())
    |> maybe_ensure_authenticated()
    |> maybe_load_resource()
    |> maybe_assign_current_user()
  end

  # Guardian VerifyHeader options — initialized once at compile time
  @verify_header_opts Guardian.Plug.VerifyHeader.init(
    module: CGraph.Guardian,
    error_handler: CGraphWeb.Plugs.AuthErrorHandler,
    scheme: "Bearer"
  )

  defp verify_header_opts, do: @verify_header_opts

  @ensure_auth_opts Guardian.Plug.EnsureAuthenticated.init(
    module: CGraph.Guardian,
    error_handler: CGraphWeb.Plugs.AuthErrorHandler
  )

  defp maybe_ensure_authenticated(%{halted: true} = conn), do: conn
  defp maybe_ensure_authenticated(conn) do
    Guardian.Plug.EnsureAuthenticated.call(conn, @ensure_auth_opts)
  end

  @load_resource_opts Guardian.Plug.LoadResource.init(
    module: CGraph.Guardian,
    error_handler: CGraphWeb.Plugs.AuthErrorHandler,
    allow_blank: false
  )

  defp maybe_load_resource(%{halted: true} = conn), do: conn
  defp maybe_load_resource(conn) do
    Guardian.Plug.LoadResource.call(conn, @load_resource_opts)
  end

  defp maybe_assign_current_user(%{halted: true} = conn), do: conn
  defp maybe_assign_current_user(conn) do
    case Guardian.Plug.current_resource(conn) do
      nil ->
        Logger.warning("RequireAuth: Token valid but no resource loaded")
        deny_access(conn)

      user ->
        assign(conn, :current_user, user)
    end
  end

  defp deny_access(conn) do
    body = Jason.encode!(%{
      error: "Unauthorized",
      message: "Authentication required"
    })

    conn
    |> put_resp_content_type("application/json")
    |> send_resp(401, body)
    |> halt()
  end
end
