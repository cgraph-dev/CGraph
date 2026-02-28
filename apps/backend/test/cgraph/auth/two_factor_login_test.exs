defmodule CGraphWeb.Auth.TwoFactorLoginTest do
  @moduledoc """
  Integration tests for 2FA login gate.

  Validates:
  - Login with correct password for 2FA-enabled user returns 2fa_required, NOT tokens
  - Login for user without 2FA returns tokens directly (regression guard)
  - verify_login_2fa with valid TOTP code returns tokens
  - verify_login_2fa with invalid TOTP code returns error
  - verify_login_2fa with expired/invalid temp token returns error
  - verify_login_2fa with backup code returns tokens
  - 2FA temp token is single-use
  """
  use CgraphWeb.ConnCase, async: false

  alias CGraph.Security.TOTP
  alias CGraph.Security.TOTP.{Algorithm, BackupCodes}

  import CgraphWeb.UserFixtures

  @password "ValidPassword123!"

  setup %{conn: conn} do
    # Create a user with 2FA enabled
    user = user_fixture(%{password: @password, password_confirmation: @password})

    # Generate real TOTP secret and backup codes
    secret = NimbleTOTP.secret()
    encrypted_secret = Algorithm.encrypt_secret(secret)
    backup_codes = BackupCodes.generate_backup_codes()
    hashed_backup_codes = BackupCodes.hash_backup_codes(backup_codes)

    # Enable 2FA on the user
    {:ok, totp_user} =
      user
      |> CGraph.Accounts.User.totp_changeset(%{
        totp_enabled: true,
        totp_secret: encrypted_secret,
        totp_backup_codes: hashed_backup_codes,
        totp_enabled_at: DateTime.utc_now()
      })
      |> CGraph.Repo.update()

    # Also create a user without 2FA
    non_2fa_user = user_fixture(%{password: @password, password_confirmation: @password})

    %{
      conn: put_req_header(conn, "content-type", "application/json"),
      totp_user: totp_user,
      non_2fa_user: non_2fa_user,
      secret: secret,
      backup_codes: backup_codes
    }
  end

  describe "login with 2FA-enabled user" do
    test "returns 2fa_required status instead of tokens", %{conn: conn, totp_user: user} do
      conn =
        post(conn, ~p"/api/v1/auth/login", %{
          identifier: user.email,
          password: @password
        })

      response = json_response(conn, 200)

      assert response["status"] == "2fa_required"
      assert is_binary(response["two_factor_token"])
      refute Map.has_key?(response, "tokens")
      refute Map.has_key?(response, "user")
    end
  end

  describe "login with non-2FA user" do
    test "returns tokens directly (regression guard)", %{conn: conn, non_2fa_user: user} do
      conn =
        post(conn, ~p"/api/v1/auth/login", %{
          identifier: user.email,
          password: @password
        })

      response = json_response(conn, 200)

      assert response["tokens"]["access_token"]
      assert response["tokens"]["refresh_token"]
      assert response["user"]
    end
  end

  describe "verify_login_2fa" do
    test "with valid TOTP code returns tokens", %{conn: conn, totp_user: user, secret: secret} do
      # First, login to get the 2fa temp token
      login_conn =
        post(conn, ~p"/api/v1/auth/login", %{
          identifier: user.email,
          password: @password
        })

      login_response = json_response(login_conn, 200)
      two_factor_token = login_response["two_factor_token"]

      # Generate a valid TOTP code
      valid_code = NimbleTOTP.verification_code(secret)

      # Verify with valid code
      verify_conn =
        post(conn, ~p"/api/v1/auth/login/2fa", %{
          two_factor_token: two_factor_token,
          code: valid_code
        })

      response = json_response(verify_conn, 200)

      assert response["tokens"]["access_token"]
      assert response["tokens"]["refresh_token"]
      assert response["user"]
    end

    test "with invalid TOTP code returns error", %{conn: conn, totp_user: user} do
      # First, login to get the 2fa temp token
      login_conn =
        post(conn, ~p"/api/v1/auth/login", %{
          identifier: user.email,
          password: @password
        })

      login_response = json_response(login_conn, 200)
      two_factor_token = login_response["two_factor_token"]

      # Try with an invalid code
      verify_conn =
        post(conn, ~p"/api/v1/auth/login/2fa", %{
          two_factor_token: two_factor_token,
          code: "000000"
        })

      assert json_response(verify_conn, 401)["error"]
    end

    test "with expired/invalid temp token returns error", %{conn: conn} do
      # Use a completely invalid token
      verify_conn =
        post(conn, ~p"/api/v1/auth/login/2fa", %{
          two_factor_token: "invalid-token-that-does-not-exist",
          code: "123456"
        })

      assert json_response(verify_conn, 401)["error"]
    end

    test "with backup code returns tokens", %{
      conn: conn,
      totp_user: user,
      backup_codes: backup_codes
    } do
      # First, login to get the 2fa temp token
      login_conn =
        post(conn, ~p"/api/v1/auth/login", %{
          identifier: user.email,
          password: @password
        })

      login_response = json_response(login_conn, 200)
      two_factor_token = login_response["two_factor_token"]

      # Use first backup code
      backup_code = List.first(backup_codes)

      verify_conn =
        post(conn, ~p"/api/v1/auth/login/2fa", %{
          two_factor_token: two_factor_token,
          code: backup_code
        })

      response = json_response(verify_conn, 200)

      assert response["tokens"]["access_token"]
      assert response["tokens"]["refresh_token"]
      assert response["user"]
    end

    test "temp token is single-use", %{conn: conn, totp_user: user, secret: secret} do
      # First, login to get the 2fa temp token
      login_conn =
        post(conn, ~p"/api/v1/auth/login", %{
          identifier: user.email,
          password: @password
        })

      login_response = json_response(login_conn, 200)
      two_factor_token = login_response["two_factor_token"]

      # Generate a valid TOTP code
      valid_code = NimbleTOTP.verification_code(secret)

      # First verify succeeds
      verify_conn1 =
        post(conn, ~p"/api/v1/auth/login/2fa", %{
          two_factor_token: two_factor_token,
          code: valid_code
        })

      assert json_response(verify_conn1, 200)["tokens"]

      # Second verify with same token fails
      verify_conn2 =
        post(conn, ~p"/api/v1/auth/login/2fa", %{
          two_factor_token: two_factor_token,
          code: valid_code
        })

      assert json_response(verify_conn2, 401)["error"]
    end
  end
end
