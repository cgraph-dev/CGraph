defmodule CgraphWeb.API.V1.TwoFactorControllerTest do
  @moduledoc """
  Comprehensive tests for the two-factor authentication endpoints.

  Tests cover:
  - 2FA setup flow
  - TOTP code verification
  - 2FA enable/disable
  - Backup codes generation and usage
  - Status checks
  - Security edge cases
  """
  use CgraphWeb.ConnCase, async: false

  alias CGraph.Guardian
  alias CGraph.Security.TOTP

  import CgraphWeb.UserFixtures

  setup do
    user = user_fixture()
    {:ok, token, _claims} = Guardian.encode_and_sign(user)
    conn = build_conn() |> put_req_header("authorization", "Bearer #{token}")

    %{conn: conn, user: user}
  end

  # ===========================================================================
  # 2FA Setup
  # ===========================================================================

  describe "POST /api/v1/auth/2fa/setup" do
    test "generates secret and QR code for new user", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/auth/2fa/setup")

      assert %{
               "secret" => secret,
               "qr_code_uri" => qr_uri,
               "backup_codes" => backup_codes
             } = json_response(conn, 200)

      assert is_binary(secret)
      assert byte_size(secret) > 0
      assert String.starts_with?(qr_uri, "otpauth://totp/")
      assert is_list(backup_codes)
      assert length(backup_codes) >= 8
    end

    test "returns conflict if 2FA already enabled", %{conn: conn, user: user} do
      # First enable 2FA
      enable_2fa_for_user(user)

      # Try setup again
      conn = post(conn, ~p"/api/v1/auth/2fa/setup")

      assert %{"error" => _} = json_response(conn, 409)
    end

    test "requires authentication", %{conn: _conn} do
      conn = build_conn() |> post(~p"/api/v1/auth/2fa/setup")
      assert json_response(conn, 401)
    end
  end

  # ===========================================================================
  # 2FA Enable
  # ===========================================================================

  describe "POST /api/v1/auth/2fa/enable" do
    test "enables 2FA with valid code", %{conn: conn, user: user} do
      # Setup 2FA first
      {:ok, setup_data} = TOTP.setup_2fa(user)

      # Generate a valid TOTP code
      code = generate_totp_code(setup_data.secret)

      conn =
        post(conn, ~p"/api/v1/auth/2fa/enable", %{
          code: code,
          secret: setup_data.secret,
          backup_codes: setup_data.backup_codes
        })

      response = json_response(conn, 200)
      assert response["enabled"] == true
      assert response["message"] =~ "enabled"
    end

    test "rejects invalid code", %{conn: conn, user: user} do
      {:ok, setup_data} = TOTP.setup_2fa(user)

      conn =
        post(conn, ~p"/api/v1/auth/2fa/enable", %{
          code: "000000",
          secret: setup_data.secret,
          backup_codes: setup_data.backup_codes
        })

      assert %{"error" => _} = json_response(conn, 422)
    end

    test "requires all parameters", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/auth/2fa/enable", %{code: "123456"})
      assert %{"error" => _} = json_response(conn, 400)
    end
  end

  # ===========================================================================
  # 2FA Verify
  # ===========================================================================

  describe "POST /api/v1/auth/2fa/verify" do
    setup %{user: user} do
      setup_data = enable_2fa_for_user(user)
      %{setup_data: setup_data}
    end

    test "verifies valid TOTP code", %{conn: conn, setup_data: setup_data} do
      code = generate_totp_code(setup_data.secret)

      conn = post(conn, ~p"/api/v1/auth/2fa/verify", %{code: code})

      response = json_response(conn, 200)
      assert response["valid"] == true
    end

    test "rejects invalid code", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/auth/2fa/verify", %{code: "000000"})

      response = json_response(conn, 422)
      assert response["valid"] == false
    end

    test "requires code parameter", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/auth/2fa/verify", %{})
      assert %{"error" => _} = json_response(conn, 400)
    end
  end

  describe "POST /api/v1/auth/2fa/verify without 2FA enabled" do
    test "returns error when 2FA not enabled", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/auth/2fa/verify", %{code: "123456"})
      assert %{"error" => _} = json_response(conn, 400)
    end
  end

  # ===========================================================================
  # 2FA Disable
  # ===========================================================================

  describe "POST /api/v1/auth/2fa/disable" do
    setup %{user: user} do
      setup_data = enable_2fa_for_user(user)
      %{setup_data: setup_data}
    end

    test "disables 2FA with valid TOTP code", %{conn: conn, setup_data: setup_data} do
      code = generate_totp_code(setup_data.secret)

      conn = post(conn, ~p"/api/v1/auth/2fa/disable", %{code: code})

      response = json_response(conn, 200)
      assert response["enabled"] == false
    end

    test "disables 2FA with valid backup code", %{conn: conn, setup_data: setup_data} do
      backup_code = hd(setup_data.backup_codes)

      conn = post(conn, ~p"/api/v1/auth/2fa/disable", %{code: backup_code})

      response = json_response(conn, 200)
      assert response["enabled"] == false
    end

    test "rejects invalid code", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/auth/2fa/disable", %{code: "000000"})
      assert %{"error" => _} = json_response(conn, 422)
    end

    test "requires code parameter", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/auth/2fa/disable", %{})
      assert %{"error" => _} = json_response(conn, 400)
    end
  end

  # ===========================================================================
  # 2FA Status
  # ===========================================================================

  describe "GET /api/v1/auth/2fa/status" do
    test "returns disabled status for new user", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/auth/2fa/status")

      response = json_response(conn, 200)
      assert response["enabled"] == false
      assert response["backup_codes_remaining"] == 0
    end

    test "returns enabled status with backup code count", %{conn: conn, user: user} do
      enable_2fa_for_user(user)

      conn = get(conn, ~p"/api/v1/auth/2fa/status")

      response = json_response(conn, 200)
      assert response["enabled"] == true
      assert response["backup_codes_remaining"] >= 8
    end
  end

  # ===========================================================================
  # Backup Codes
  # ===========================================================================

  describe "POST /api/v1/auth/2fa/backup-codes" do
    setup %{user: user} do
      setup_data = enable_2fa_for_user(user)
      %{setup_data: setup_data}
    end

    test "regenerates backup codes with valid TOTP code", %{conn: conn, setup_data: setup_data} do
      code = generate_totp_code(setup_data.secret)

      conn = post(conn, ~p"/api/v1/auth/2fa/backup-codes", %{code: code})

      response = json_response(conn, 200)
      assert is_list(response["backup_codes"])
      assert response["count"] >= 8
    end

    test "rejects invalid code", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/auth/2fa/backup-codes", %{code: "000000"})
      assert %{"error" => _} = json_response(conn, 422)
    end
  end

  describe "POST /api/v1/auth/2fa/backup-codes/use" do
    setup %{user: user} do
      setup_data = enable_2fa_for_user(user)
      %{setup_data: setup_data}
    end

    test "uses valid backup code", %{conn: conn, setup_data: setup_data} do
      backup_code = hd(setup_data.backup_codes)

      conn = post(conn, ~p"/api/v1/auth/2fa/backup-codes/use", %{code: backup_code})

      response = json_response(conn, 200)
      assert response["valid"] == true
      assert is_integer(response["backup_codes_remaining"])
    end

    test "rejects already used backup code", %{conn: conn, setup_data: setup_data} do
      backup_code = hd(setup_data.backup_codes)

      # Use it once
      post(conn, ~p"/api/v1/auth/2fa/backup-codes/use", %{code: backup_code})

      # Try to use again
      conn2 = post(conn, ~p"/api/v1/auth/2fa/backup-codes/use", %{code: backup_code})

      response = json_response(conn2, 422)
      assert response["valid"] == false
    end

    test "rejects invalid backup code", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/auth/2fa/backup-codes/use", %{code: "INVALID-CODE"})

      response = json_response(conn, 422)
      assert response["valid"] == false
    end
  end

  # ===========================================================================
  # Security Edge Cases
  # ===========================================================================

  describe "security" do
    test "all endpoints require authentication" do
      conn = build_conn()

      endpoints = [
        {:post, "/api/v1/auth/2fa/setup"},
        {:post, "/api/v1/auth/2fa/enable"},
        {:post, "/api/v1/auth/2fa/verify"},
        {:post, "/api/v1/auth/2fa/disable"},
        {:get, "/api/v1/auth/2fa/status"},
        {:post, "/api/v1/auth/2fa/backup-codes"},
        {:post, "/api/v1/auth/2fa/backup-codes/use"}
      ]

      for {method, path} <- endpoints do
        resp =
          case method do
            :get -> get(conn, path)
            :post -> post(conn, path, %{})
          end

        assert resp.status == 401,
               "Expected 401 for #{method} #{path}, got #{resp.status}"
      end
    end

    test "backup codes are single-use", %{conn: conn, user: user} do
      setup_data = enable_2fa_for_user(user)
      backup_code = hd(setup_data.backup_codes)

      # First use should succeed
      conn1 = post(conn, ~p"/api/v1/auth/2fa/backup-codes/use", %{code: backup_code})
      assert json_response(conn1, 200)["valid"] == true

      # Second use should fail
      conn2 = post(conn, ~p"/api/v1/auth/2fa/backup-codes/use", %{code: backup_code})
      assert json_response(conn2, 422)["valid"] == false
    end
  end

  # ===========================================================================
  # Helper Functions
  # ===========================================================================

  defp enable_2fa_for_user(user) do
    {:ok, setup_data} = TOTP.setup_2fa(user)
    code = generate_totp_code(setup_data.secret)
    {:ok, _user} = TOTP.verify_and_enable(user, code, setup_data.secret, setup_data.backup_codes)
    setup_data
  end

  defp generate_totp_code(secret_base64) do
    # Decode the base64 secret
    secret = Base.decode64!(secret_base64)

    # Calculate current time step (30 second windows)
    time_step = div(System.system_time(:second), 30)

    # Generate HMAC-SHA1
    time_bytes = <<time_step::big-unsigned-integer-size(64)>>
    hmac = :crypto.mac(:hmac, :sha, secret, time_bytes)
    hmac_bytes = :binary.bin_to_list(hmac)

    # Dynamic truncation - get offset from last nibble
    offset = Enum.at(hmac_bytes, 19) |> Bitwise.band(0x0F)

    # Extract 4 bytes starting at offset
    code_int =
      (Enum.at(hmac_bytes, offset) |> Bitwise.band(0x7F)) * 0x1000000 +
        Enum.at(hmac_bytes, offset + 1) * 0x10000 +
        Enum.at(hmac_bytes, offset + 2) * 0x100 +
        Enum.at(hmac_bytes, offset + 3)

    # Format as 6 digits with leading zeros
    code_int
    |> rem(1_000_000)
    |> Integer.to_string()
    |> String.pad_leading(6, "0")
  end
end
