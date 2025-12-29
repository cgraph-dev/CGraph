defmodule CgraphWeb.API.V1.AuthControllerTest do
  use CgraphWeb.ConnCase, async: true

  describe "POST /api/v1/auth/register" do
    test "creates user with valid data", %{conn: conn} do
      user_params = %{
        username: "newuser",
        email: "newuser@example.com",
        password: "ValidPassword123!",
        password_confirmation: "ValidPassword123!",
        display_name: "New User"
      }

      conn = post(conn, ~p"/api/v1/auth/register", user: user_params)
      
      # API returns %{user: ..., tokens: %{access_token: ..., refresh_token: ...}}
      response = json_response(conn, 201)
      assert response["user"]["username"] == "newuser"
      assert response["tokens"]["access_token"] != nil
      assert response["tokens"]["refresh_token"] != nil
    end

    test "returns errors with invalid data", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/auth/register", user: %{})
      response = json_response(conn, 422)
      # Error format is %{error: %{details: ..., message: ...}}
      assert response["error"] != nil
    end

    test "returns error when email already exists", %{conn: conn} do
      user = CgraphWeb.UserFixtures.user_fixture()
      
      user_params = %{
        username: "different",
        email: user.email,
        password: "ValidPassword123!",
        password_confirmation: "ValidPassword123!"
      }

      conn = post(conn, ~p"/api/v1/auth/register", user: user_params)
      response = json_response(conn, 422)
      assert response["error"]["details"]["email"] != nil
    end

    test "returns error when username already exists", %{conn: conn} do
      user = CgraphWeb.UserFixtures.user_fixture()
      
      user_params = %{
        username: user.username,
        email: "different@example.com",
        password: "ValidPassword123!",
        password_confirmation: "ValidPassword123!"
      }

      conn = post(conn, ~p"/api/v1/auth/register", user: user_params)
      response = json_response(conn, 422)
      assert response["error"]["details"]["username"] != nil
    end
  end

  describe "POST /api/v1/auth/login" do
    test "returns token with valid credentials", %{conn: conn} do
      password = "ValidPassword123!"
      user = CgraphWeb.UserFixtures.user_fixture(%{password: password, password_confirmation: password})

      conn = post(conn, ~p"/api/v1/auth/login", %{
        email: user.email,
        password: password
      })

      response = json_response(conn, 200)
      assert response["user"]["id"] != nil
      assert response["tokens"]["access_token"] != nil
    end

    test "returns 401 with invalid credentials", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/auth/login", %{
        email: "nonexistent@example.com",
        password: "wrongpassword"
      })

      assert json_response(conn, 401)["error"]
    end

    test "returns 401 with wrong password", %{conn: conn} do
      user = CgraphWeb.UserFixtures.user_fixture()

      conn = post(conn, ~p"/api/v1/auth/login", %{
        email: user.email,
        password: "wrongpassword"
      })

      assert json_response(conn, 401)["error"]
    end
  end

  describe "POST /api/v1/auth/refresh" do
    test "returns new token with valid refresh token", %{conn: conn} do
      password = "ValidPassword123!"
      user = CgraphWeb.UserFixtures.user_fixture(%{password: password, password_confirmation: password})

      # First login to get a refresh token
      login_conn = post(conn, ~p"/api/v1/auth/login", %{
        email: user.email,
        password: password
      })

      response = json_response(login_conn, 200)
      refresh_token = response["tokens"]["refresh_token"]
      
      # Use refresh token to get new access token
      refresh_conn = post(conn, ~p"/api/v1/auth/refresh", %{refresh_token: refresh_token})
      
      refresh_response = json_response(refresh_conn, 200)
      # Refresh may return tokens or just access_token depending on implementation
      assert refresh_response["tokens"] != nil || refresh_response["access_token"] != nil
    end

    test "returns error with invalid refresh token", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/auth/refresh", %{refresh_token: "invalid"})
      assert json_response(conn, 401)["error"]
    end
  end

  describe "POST /api/v1/auth/forgot-password" do
    test "returns success for existing email", %{conn: conn} do
      user = CgraphWeb.UserFixtures.user_fixture()
      
      conn = post(conn, ~p"/api/v1/auth/forgot-password", %{email: user.email})
      
      # Should return success (200 or 202)
      assert conn.status in [200, 202]
    end

    test "returns success even for non-existent email", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/auth/forgot-password", %{email: "nonexistent@example.com"})
      
      # Should return success to prevent email enumeration
      assert conn.status in [200, 202]
    end
  end
end
