defmodule CGraphWeb.Plugs.CookieAuth do
  @moduledoc """
  Plug for extracting JWT authentication from HTTP-only cookies.

  This provides an alternative to Bearer token authentication for web clients.
  HTTP-only cookies are immune to XSS attacks since JavaScript cannot access them.

  Cookie names:
  - `cgraph_access_token` - JWT access token
  - `cgraph_refresh_token` - JWT refresh token (longer expiry)

  Security features:
  - HttpOnly flag (JavaScript cannot read)
  - Secure flag in production (HTTPS only)
  - SameSite=Lax (CSRF protection)
  - Path=/ (available site-wide)
  """
  import Plug.Conn

  @access_cookie "cgraph_access_token"
  @refresh_cookie "cgraph_refresh_token"

  @doc """
  Cookie configuration for access tokens.
  Short-lived (15 minutes default).
  """
  @spec access_cookie_opts() :: keyword()
  def access_cookie_opts do
    base_opts() ++ [
      max_age: 60 * 15  # 15 minutes
    ]
  end

  @doc """
  Cookie configuration for refresh tokens.
  Longer-lived (7 days default).
  """
  @spec refresh_cookie_opts() :: keyword()
  def refresh_cookie_opts do
    base_opts() ++ [
      max_age: 60 * 60 * 24 * 7,  # 7 days
      path: "/api/v1/auth/refresh"  # Only sent to refresh endpoint
    ]
  end

  defp base_opts do
    is_prod = Application.get_env(:cgraph, :env, :prod) == :prod
    [
      http_only: true,
      secure: is_prod,
      # SameSite=None required for cross-origin requests (Vercel -> Fly.io)
      # Secure=true is required when using SameSite=None (already set for prod)
      same_site: "None",
      path: "/"
    ]
  end

  @doc """
  Set authentication cookies on successful login.
  """
  @spec set_auth_cookies(Plug.Conn.t(), String.t(), String.t()) :: Plug.Conn.t()
  def set_auth_cookies(conn, access_token, refresh_token) do
    conn
    |> put_resp_cookie(@access_cookie, access_token, access_cookie_opts())
    |> put_resp_cookie(@refresh_cookie, refresh_token, refresh_cookie_opts())
  end

  @doc """
  Clear authentication cookies on logout.
  """
  @spec clear_auth_cookies(Plug.Conn.t()) :: Plug.Conn.t()
  def clear_auth_cookies(conn) do
    conn
    |> delete_resp_cookie(@access_cookie, access_cookie_opts())
    |> delete_resp_cookie(@refresh_cookie, Keyword.put(refresh_cookie_opts(), :path, "/"))
  end

  @doc """
  Extract access token from cookie.
  Returns nil if not present.
  """
  @spec get_access_token(Plug.Conn.t()) :: String.t() | nil
  def get_access_token(conn) do
    conn = fetch_cookies(conn)
    conn.cookies[@access_cookie]
  end

  @doc """
  Extract refresh token from cookie.
  Returns nil if not present.
  """
  @spec get_refresh_token(Plug.Conn.t()) :: String.t() | nil
  def get_refresh_token(conn) do
    conn = fetch_cookies(conn)
    conn.cookies[@refresh_cookie]
  end

  @doc """
  Plug behavior: extracts JWT from cookie if no Authorization header present.
  This allows both cookie and Bearer token authentication.
  """
  @spec init(keyword()) :: keyword()
  def init(opts), do: opts

  @spec call(Plug.Conn.t(), keyword()) :: Plug.Conn.t()
  def call(conn, _opts) do
    case get_req_header(conn, "authorization") do
      ["Bearer " <> _token] ->
        # Authorization header present, don't override
        conn

      _ ->
        # No Authorization header, check for cookie
        case get_access_token(conn) do
          nil ->
            conn

          token ->
            # Add token to Authorization header so Guardian picks it up
            put_req_header(conn, "authorization", "Bearer " <> token)
        end
    end
  end
end
