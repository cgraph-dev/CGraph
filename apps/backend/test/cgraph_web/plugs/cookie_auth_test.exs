defmodule CgraphWeb.Plugs.CookieAuthTest do
  use CgraphWeb.ConnCase, async: true

  alias CgraphWeb.Plugs.CookieAuth

  describe "set_auth_cookies/3" do
    test "sets both access and refresh cookies", %{conn: conn} do
      conn = CookieAuth.set_auth_cookies(conn, "access_token_123", "refresh_token_456")

      # Verify cookies are set in response
      cookies = conn.resp_cookies

      assert cookies["cgraph_access_token"]
      assert cookies["cgraph_access_token"].value == "access_token_123"
      assert cookies["cgraph_access_token"].http_only == true

      assert cookies["cgraph_refresh_token"]
      assert cookies["cgraph_refresh_token"].value == "refresh_token_456"
      assert cookies["cgraph_refresh_token"].http_only == true
    end

    test "access cookie has correct max_age", %{conn: conn} do
      conn = CookieAuth.set_auth_cookies(conn, "access", "refresh")

      cookie = conn.resp_cookies["cgraph_access_token"]
      assert cookie.max_age == 60 * 15  # 15 minutes
    end

    test "refresh cookie has correct max_age", %{conn: conn} do
      conn = CookieAuth.set_auth_cookies(conn, "access", "refresh")

      cookie = conn.resp_cookies["cgraph_refresh_token"]
      assert cookie.max_age == 60 * 60 * 24 * 7  # 7 days
    end

    test "cookies have SameSite=Strict for security", %{conn: conn} do
      conn = CookieAuth.set_auth_cookies(conn, "access", "refresh")

      assert conn.resp_cookies["cgraph_access_token"].same_site == "Strict"
      assert conn.resp_cookies["cgraph_refresh_token"].same_site == "Strict"
    end
  end

  describe "clear_auth_cookies/1" do
    test "clears both cookies", %{conn: conn} do
      # First set cookies
      conn = CookieAuth.set_auth_cookies(conn, "access", "refresh")

      # Then clear them
      conn = CookieAuth.clear_auth_cookies(conn)

      # Cookies should be set to expire immediately
      access_cookie = conn.resp_cookies["cgraph_access_token"]
      refresh_cookie = conn.resp_cookies["cgraph_refresh_token"]

      assert access_cookie.max_age == 0
      assert refresh_cookie.max_age == 0
    end
  end

  describe "get_access_token/1" do
    test "returns nil when no cookie present", %{conn: conn} do
      assert CookieAuth.get_access_token(conn) == nil
    end

    test "returns token from cookie", %{conn: conn} do
      conn = conn
        |> put_req_cookie("cgraph_access_token", "test_token_value")
        |> fetch_cookies()

      assert CookieAuth.get_access_token(conn) == "test_token_value"
    end
  end

  describe "get_refresh_token/1" do
    test "returns nil when no cookie present", %{conn: conn} do
      assert CookieAuth.get_refresh_token(conn) == nil
    end

    test "returns token from cookie", %{conn: conn} do
      conn = conn
        |> put_req_cookie("cgraph_refresh_token", "refresh_token_value")
        |> fetch_cookies()

      assert CookieAuth.get_refresh_token(conn) == "refresh_token_value"
    end
  end

  describe "call/2 (plug behavior)" do
    test "does not override existing Authorization header", %{conn: conn} do
      conn = conn
        |> put_req_header("authorization", "Bearer existing_token")
        |> put_req_cookie("cgraph_access_token", "cookie_token")
        |> CookieAuth.call([])

      [auth_header] = get_req_header(conn, "authorization")
      assert auth_header == "Bearer existing_token"
    end

    test "adds Authorization header from cookie when none present", %{conn: conn} do
      conn = conn
        |> put_req_cookie("cgraph_access_token", "cookie_token")
        |> CookieAuth.call([])

      [auth_header] = get_req_header(conn, "authorization")
      assert auth_header == "Bearer cookie_token"
    end

    test "does nothing when no auth header and no cookie", %{conn: conn} do
      conn = CookieAuth.call(conn, [])

      assert get_req_header(conn, "authorization") == []
    end
  end

  describe "integration with auth endpoints" do
    test "login sets auth cookies", %{conn: conn} do
      password = "ValidPassword123!"
      user = CgraphWeb.UserFixtures.user_fixture(%{password: password, password_confirmation: password})

      conn = post(conn, ~p"/api/v1/auth/login", %{
        email: user.email,
        password: password
      })

      # Should have cookies set
      assert conn.resp_cookies["cgraph_access_token"]
      assert conn.resp_cookies["cgraph_refresh_token"]

      # Verify response also contains tokens in body
      response = json_response(conn, 200)
      assert response["tokens"]["access_token"]
      assert response["tokens"]["refresh_token"]
    end

    test "register sets auth cookies", %{conn: conn} do
      user_params = %{
        username: "cookieuser_#{System.unique_integer([:positive])}",
        email: "cookie_#{System.unique_integer([:positive])}@example.com",
        password: "ValidPassword123!",
        password_confirmation: "ValidPassword123!",
        display_name: "Cookie User"
      }

      conn = post(conn, ~p"/api/v1/auth/register", user: user_params)

      # Should have cookies set
      assert conn.resp_cookies["cgraph_access_token"]
      assert conn.resp_cookies["cgraph_refresh_token"]
    end

    test "logout clears auth cookies", %{conn: conn} do
      password = "ValidPassword123!"
      user = CgraphWeb.UserFixtures.user_fixture(%{password: password, password_confirmation: password})

      # Login first
      login_conn = post(conn, ~p"/api/v1/auth/login", %{
        email: user.email,
        password: password
      })

      access_token = login_conn.resp_cookies["cgraph_access_token"].value

      # Logout with cookie auth
      logout_conn = conn
        |> put_req_cookie("cgraph_access_token", access_token)
        |> post(~p"/api/v1/auth/logout")

      # Cookies should be cleared (max_age = 0)
      assert logout_conn.resp_cookies["cgraph_access_token"].max_age == 0
      assert logout_conn.resp_cookies["cgraph_refresh_token"].max_age == 0
    end

    test "cookie auth works for protected endpoints", %{conn: conn} do
      password = "ValidPassword123!"
      user = CgraphWeb.UserFixtures.user_fixture(%{password: password, password_confirmation: password})

      # Login to get cookie
      login_conn = post(conn, ~p"/api/v1/auth/login", %{
        email: user.email,
        password: password
      })

      access_token = login_conn.resp_cookies["cgraph_access_token"].value

      # Access protected endpoint using cookie
      me_conn = conn
        |> put_req_cookie("cgraph_access_token", access_token)
        |> get(~p"/api/v1/me")

      response = json_response(me_conn, 200)
      assert response["data"]["id"] == user.id
    end
  end
end
