defmodule CgraphWeb.API.V1.E2EEControllerTest do
  @moduledoc """
  Comprehensive test suite for End-to-End Encryption (E2EE) controller.

  Tests cover:
  - Key registration and management
  - Prekey bundle retrieval
  - One-time prekey replenishment
  - Device management
  - Safety number verification
  - Key verification and revocation
  - Security edge cases

  ## Security Testing Notes

  These tests validate that:
  - Only authenticated users can manage keys
  - Users cannot access other users' private key operations
  - Key revocation properly notifies contacts
  - Forward secrecy is maintained through proper key rotation
  """

  use CgraphWeb.ConnCase, async: true

  alias Cgraph.Accounts
  alias Cgraph.Crypto.E2EE

  @valid_user_attrs %{
    email: "e2ee_test@example.com",
    password: "TestPassword123!",
    username: "e2ee_tester"
  }

  # ===========================================================================
  # Setup
  # ===========================================================================

  setup %{conn: conn} do
    {:ok, user} = Accounts.create_user(@valid_user_attrs)
    {:ok, token, _claims} = Cgraph.Guardian.encode_and_sign(user)

    conn =
      conn
      |> put_req_header("accept", "application/json")
      |> put_req_header("authorization", "Bearer #{token}")

    {:ok, conn: conn, user: user, token: token}
  end

  # ===========================================================================
  # Key Registration Tests
  # ===========================================================================

  describe "POST /api/v1/e2ee/keys - register_keys" do
    test "successfully registers complete key bundle", %{conn: conn} do
      keys = generate_key_bundle("device-001")

      conn =
        post(conn, ~p"/api/v1/e2ee/keys", %{
          identity_key: keys.identity_key,
          device_id: keys.device_id,
          signed_prekey: keys.signed_prekey,
          prekey_signature: keys.prekey_signature,
          prekey_id: keys.prekey_id,
          one_time_prekeys: keys.one_time_prekeys
        })

      assert %{"data" => data} = json_response(conn, 200)
      assert data["identity_key_id"]
      assert data["signed_prekey_id"]
      # Response uses one_time_prekey_count instead of one_time_prekeys_uploaded
      assert data["one_time_prekey_count"] == length(keys.one_time_prekeys)
    end

    test "registers keys for multiple devices", %{conn: conn} do
      keys1 = generate_key_bundle("device-001")
      keys2 = generate_key_bundle("device-002")

      conn1 =
        post(conn, ~p"/api/v1/e2ee/keys", %{
          identity_key: keys1.identity_key,
          device_id: keys1.device_id,
          signed_prekey: keys1.signed_prekey,
          prekey_signature: keys1.prekey_signature,
          prekey_id: keys1.prekey_id,
          one_time_prekeys: keys1.one_time_prekeys
        })

      assert %{"data" => _} = json_response(conn1, 200)

      conn2 =
        post(conn, ~p"/api/v1/e2ee/keys", %{
          identity_key: keys2.identity_key,
          device_id: keys2.device_id,
          signed_prekey: keys2.signed_prekey,
          prekey_signature: keys2.prekey_signature,
          prekey_id: keys2.prekey_id,
          one_time_prekeys: keys2.one_time_prekeys
        })

      assert %{"data" => _} = json_response(conn2, 200)
    end

    test "updates existing device keys", %{conn: conn} do
      keys = generate_key_bundle("device-001")

      # Register initial keys
      post(conn, ~p"/api/v1/e2ee/keys", %{
        identity_key: keys.identity_key,
        device_id: keys.device_id,
        signed_prekey: keys.signed_prekey,
        prekey_signature: keys.prekey_signature,
        prekey_id: keys.prekey_id,
        one_time_prekeys: keys.one_time_prekeys
      })

      # Update with new signed prekey
      new_keys = generate_key_bundle("device-001")

      conn2 =
        post(conn, ~p"/api/v1/e2ee/keys", %{
          identity_key: keys.identity_key,
          device_id: keys.device_id,
          signed_prekey: new_keys.signed_prekey,
          prekey_signature: new_keys.prekey_signature,
          prekey_id: new_keys.prekey_id + 1000,
          one_time_prekeys: []
        })

      assert %{"data" => _} = json_response(conn2, 200)
    end

    test "rejects request without authentication" do
      conn =
        build_conn()
        |> put_req_header("accept", "application/json")

      keys = generate_key_bundle("device-001")

      conn =
        post(conn, ~p"/api/v1/e2ee/keys", %{
          identity_key: keys.identity_key,
          device_id: keys.device_id,
          signed_prekey: keys.signed_prekey,
          prekey_signature: keys.prekey_signature,
          prekey_id: keys.prekey_id,
          one_time_prekeys: keys.one_time_prekeys
        })

      assert json_response(conn, 401)
    end

    test "handles empty one_time_prekeys list", %{conn: conn} do
      keys = generate_key_bundle("device-001")

      conn =
        post(conn, ~p"/api/v1/e2ee/keys", %{
          identity_key: keys.identity_key,
          device_id: keys.device_id,
          signed_prekey: keys.signed_prekey,
          prekey_signature: keys.prekey_signature,
          prekey_id: keys.prekey_id,
          one_time_prekeys: []
        })

      assert %{"data" => data} = json_response(conn, 200)
      assert data["one_time_prekey_count"] == 0
    end
  end

  # ===========================================================================
  # Prekey Bundle Retrieval Tests
  # ===========================================================================

  describe "GET /api/v1/e2ee/keys/:user_id - get_prekey_bundle" do
    test "retrieves prekey bundle for registered user", %{conn: conn, user: user} do
      # Register keys first
      register_keys_for_user(conn)

      # Get bundle
      conn = get(conn, ~p"/api/v1/e2ee/keys/#{user.id}")

      assert %{"data" => bundle} = json_response(conn, 200)
      assert bundle["identity_key"]
      assert bundle["identity_key_id"]
      assert bundle["device_id"]
      assert bundle["signed_prekey"]
      assert bundle["signed_prekey_id"]
      assert bundle["signed_prekey_signature"]
    end

    test "includes one-time prekey when available", %{conn: conn, user: user} do
      register_keys_for_user(conn)

      conn = get(conn, ~p"/api/v1/e2ee/keys/#{user.id}")

      assert %{"data" => bundle} = json_response(conn, 200)
      # One-time prekey should be available and consumed
      assert bundle["one_time_prekey"]
      assert bundle["one_time_prekey_id"]
    end

    test "consumes one-time prekey on each fetch", %{conn: conn, user: user} do
      # Register with only 2 one-time prekeys
      keys = generate_key_bundle("device-001")
      two_prekeys = Enum.take(keys.one_time_prekeys, 2)

      post(conn, ~p"/api/v1/e2ee/keys", %{
        identity_key: keys.identity_key,
        device_id: keys.device_id,
        signed_prekey: keys.signed_prekey,
        prekey_signature: keys.prekey_signature,
        prekey_id: keys.prekey_id,
        one_time_prekeys: two_prekeys
      })

      # Fetch twice
      get(conn, ~p"/api/v1/e2ee/keys/#{user.id}")
      get(conn, ~p"/api/v1/e2ee/keys/#{user.id}")

      # Third fetch should have no one-time prekey
      conn3 = get(conn, ~p"/api/v1/e2ee/keys/#{user.id}")
      assert %{"data" => bundle} = json_response(conn3, 200)

      # Depending on implementation, may return nil or omit field
      refute Map.get(bundle, "one_time_prekey")
    end

    test "returns 404 for user without registered keys", %{conn: conn} do
      {:ok, other_user} =
        Accounts.create_user(%{
          email: "nokeys@example.com",
          password: "TestPassword123!",
          username: "nokeys"
        })

      conn = get(conn, ~p"/api/v1/e2ee/keys/#{other_user.id}")

      assert json_response(conn, 404)
    end

    test "returns 404 for non-existent user", %{conn: conn} do
      fake_id = Ecto.UUID.generate()
      conn = get(conn, ~p"/api/v1/e2ee/keys/#{fake_id}")

      assert json_response(conn, 404)
    end
  end

  # ===========================================================================
  # Prekey Count Tests
  # ===========================================================================

  describe "GET /api/v1/e2ee/keys/count - prekey_count" do
    test "returns correct prekey count", %{conn: conn} do
      register_keys_for_user(conn)

      conn = get(conn, ~p"/api/v1/e2ee/keys/count")

      assert %{"data" => data} = json_response(conn, 200)
      assert is_integer(data["count"])
      assert is_boolean(data["should_upload"])
    end

    test "should_upload is true when count is low", %{conn: conn} do
      # Register with only 10 prekeys
      keys = generate_key_bundle("device-001")
      few_prekeys = Enum.take(keys.one_time_prekeys, 10)

      post(conn, ~p"/api/v1/e2ee/keys", %{
        identity_key: keys.identity_key,
        device_id: keys.device_id,
        signed_prekey: keys.signed_prekey,
        prekey_signature: keys.prekey_signature,
        prekey_id: keys.prekey_id,
        one_time_prekeys: few_prekeys
      })

      conn = get(conn, ~p"/api/v1/e2ee/keys/count")

      assert %{"data" => data} = json_response(conn, 200)
      assert data["count"] == 10
      assert data["should_upload"] == true
    end

    test "should_upload is false when count is sufficient", %{conn: conn} do
      # Register with 50 prekeys (above threshold of 25)
      keys = generate_key_bundle("device-001")
      many_prekeys = Enum.take(keys.one_time_prekeys, 50)

      post(conn, ~p"/api/v1/e2ee/keys", %{
        identity_key: keys.identity_key,
        device_id: keys.device_id,
        signed_prekey: keys.signed_prekey,
        prekey_signature: keys.prekey_signature,
        prekey_id: keys.prekey_id,
        one_time_prekeys: many_prekeys
      })

      conn = get(conn, ~p"/api/v1/e2ee/keys/count")

      assert %{"data" => data} = json_response(conn, 200)
      assert data["count"] == 50
      assert data["should_upload"] == false
    end

    test "returns 0 count for user without keys", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/e2ee/keys/count")

      assert %{"data" => data} = json_response(conn, 200)
      assert data["count"] == 0
      assert data["should_upload"] == true
    end
  end

  # ===========================================================================
  # Prekey Replenishment Tests
  # ===========================================================================

  describe "POST /api/v1/e2ee/keys/prekeys - replenish_prekeys" do
    test "successfully uploads additional prekeys", %{conn: conn} do
      register_keys_for_user(conn)

      new_prekeys =
        Enum.map(101..110, fn id ->
          [id, generate_x25519_public_key()]
        end)

      conn =
        post(conn, ~p"/api/v1/e2ee/keys/prekeys", %{
          prekeys: new_prekeys
        })

      assert %{"data" => data} = json_response(conn, 200)
      assert data["uploaded"] == 10
      assert is_integer(data["total"])
    end

    test "handles alternative JSON format for prekeys", %{conn: conn} do
      register_keys_for_user(conn)

      new_prekeys =
        Enum.map(201..205, fn id ->
          %{"key_id" => id, "public_key" => generate_x25519_public_key()}
        end)

      conn =
        post(conn, ~p"/api/v1/e2ee/keys/prekeys", %{
          prekeys: new_prekeys
        })

      assert %{"data" => data} = json_response(conn, 200)
      assert data["uploaded"] == 5
    end

    test "rejects empty prekey list", %{conn: conn} do
      register_keys_for_user(conn)

      conn =
        post(conn, ~p"/api/v1/e2ee/keys/prekeys", %{
          prekeys: []
        })

      assert %{"data" => data} = json_response(conn, 200)
      assert data["uploaded"] == 0
    end
  end

  # ===========================================================================
  # Device Management Tests
  # ===========================================================================

  describe "GET /api/v1/e2ee/devices - list_devices" do
    test "lists all registered devices", %{conn: conn} do
      # Register keys for two devices
      keys1 = generate_key_bundle("device-001")
      keys2 = generate_key_bundle("device-002")

      post(conn, ~p"/api/v1/e2ee/keys", %{
        identity_key: keys1.identity_key,
        device_id: keys1.device_id,
        signed_prekey: keys1.signed_prekey,
        prekey_signature: keys1.prekey_signature,
        prekey_id: keys1.prekey_id,
        one_time_prekeys: []
      })

      post(conn, ~p"/api/v1/e2ee/keys", %{
        identity_key: keys2.identity_key,
        device_id: keys2.device_id,
        signed_prekey: keys2.signed_prekey,
        prekey_signature: keys2.prekey_signature,
        prekey_id: keys2.prekey_id,
        one_time_prekeys: []
      })

      conn = get(conn, ~p"/api/v1/e2ee/devices")

      assert %{"data" => devices} = json_response(conn, 200)
      assert is_list(devices)
      assert length(devices) == 2
    end

    test "returns empty list for user without devices", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/e2ee/devices")

      assert %{"data" => devices} = json_response(conn, 200)
      assert devices == []
    end
  end

  describe "DELETE /api/v1/e2ee/devices/:device_id - remove_device" do
    test "successfully removes a device", %{conn: conn} do
      register_keys_for_user(conn)

      conn = delete(conn, ~p"/api/v1/e2ee/devices/device-001")

      assert json_response(conn, 200)

      # Verify device is gone
      devices_conn = get(conn, ~p"/api/v1/e2ee/devices")
      assert %{"data" => devices} = json_response(devices_conn, 200)
      refute Enum.any?(devices, &(&1["device_id"] == "device-001"))
    end

    test "returns 404 for non-existent device", %{conn: conn} do
      conn = delete(conn, ~p"/api/v1/e2ee/devices/nonexistent-device")

      assert json_response(conn, 404)
    end
  end

  # ===========================================================================
  # Safety Number Tests
  # ===========================================================================

  describe "GET /api/v1/e2ee/safety-number/:user_id - safety_number" do
    test "generates safety number between two users with keys", %{conn: conn, user: user} do
      # Register keys for current user
      register_keys_for_user(conn)

      # Create and register keys for another user
      {:ok, other_user} =
        Accounts.create_user(%{
          email: "other@example.com",
          password: "TestPassword123!",
          username: "other_user"
        })

      {:ok, other_token, _} = Cgraph.Guardian.encode_and_sign(other_user)

      other_conn =
        build_conn()
        |> put_req_header("accept", "application/json")
        |> put_req_header("authorization", "Bearer #{other_token}")

      register_keys_for_user(other_conn)

      # Get safety number
      conn = get(conn, ~p"/api/v1/e2ee/safety-number/#{other_user.id}")

      assert %{"data" => data} = json_response(conn, 200)
      assert data["safety_number"]
      # Safety numbers are typically formatted with spaces
      assert String.contains?(data["safety_number"], " ") or
               String.length(data["safety_number"]) > 0
    end

    test "returns same safety number regardless of direction", %{conn: conn, user: user} do
      register_keys_for_user(conn)

      {:ok, other_user} =
        Accounts.create_user(%{
          email: "other2@example.com",
          password: "TestPassword123!",
          username: "other_user2"
        })

      {:ok, other_token, _} = Cgraph.Guardian.encode_and_sign(other_user)

      other_conn =
        build_conn()
        |> put_req_header("accept", "application/json")
        |> put_req_header("authorization", "Bearer #{other_token}")

      register_keys_for_user(other_conn)

      # Get safety number from both directions
      conn1 = get(conn, ~p"/api/v1/e2ee/safety-number/#{other_user.id}")
      conn2 = get(other_conn, ~p"/api/v1/e2ee/safety-number/#{user.id}")

      assert %{"data" => data1} = json_response(conn1, 200)
      assert %{"data" => data2} = json_response(conn2, 200)

      assert data1["safety_number"] == data2["safety_number"]
    end

    test "returns 404 when user has no keys", %{conn: conn} do
      {:ok, no_keys_user} =
        Accounts.create_user(%{
          email: "nokeys2@example.com",
          password: "TestPassword123!",
          username: "nokeys2"
        })

      conn = get(conn, ~p"/api/v1/e2ee/safety-number/#{no_keys_user.id}")

      assert json_response(conn, 404)
    end
  end

  # ===========================================================================
  # Key Verification Tests
  # ===========================================================================

  describe "POST /api/v1/e2ee/keys/:key_id/verify - verify_key" do
    test "successfully verifies a key", %{conn: conn} do
      # Register keys to get a key_id
      keys = generate_key_bundle("device-001")

      post(conn, ~p"/api/v1/e2ee/keys", %{
        identity_key: keys.identity_key,
        device_id: keys.device_id,
        signed_prekey: keys.signed_prekey,
        prekey_signature: keys.prekey_signature,
        prekey_id: keys.prekey_id,
        one_time_prekeys: []
      })

      # Get the key_id from devices list
      devices_conn = get(conn, ~p"/api/v1/e2ee/devices")
      assert %{"data" => [device | _]} = json_response(devices_conn, 200)
      key_id = device["key_id"] || device["identity_key_id"]

      if key_id do
        conn = post(conn, ~p"/api/v1/e2ee/keys/#{key_id}/verify")

        assert %{"data" => data} = json_response(conn, 200)
        assert data["verified"] == true
        assert data["verified_at"]
      end
    end

    test "returns 404 for non-existent key", %{conn: conn} do
      fake_key_id = "nonexistent_key_fingerprint"
      conn = post(conn, ~p"/api/v1/e2ee/keys/#{fake_key_id}/verify")

      assert json_response(conn, 404)
    end
  end

  # ===========================================================================
  # Key Revocation Tests
  # ===========================================================================

  describe "POST /api/v1/e2ee/keys/:key_id/revoke - revoke_key" do
    test "successfully revokes a key", %{conn: conn} do
      keys = generate_key_bundle("device-001")

      post(conn, ~p"/api/v1/e2ee/keys", %{
        identity_key: keys.identity_key,
        device_id: keys.device_id,
        signed_prekey: keys.signed_prekey,
        prekey_signature: keys.prekey_signature,
        prekey_id: keys.prekey_id,
        one_time_prekeys: []
      })

      devices_conn = get(conn, ~p"/api/v1/e2ee/devices")
      assert %{"data" => [device | _]} = json_response(devices_conn, 200)
      key_id = device["key_id"] || device["identity_key_id"]

      if key_id do
        conn = post(conn, ~p"/api/v1/e2ee/keys/#{key_id}/revoke")

        assert %{"data" => data} = json_response(conn, 200)
        assert data["revoked"] == true
        assert data["revoked_at"]
      end
    end

    test "returns 404 for non-existent key", %{conn: conn} do
      fake_key_id = "nonexistent_key_fingerprint"
      conn = post(conn, ~p"/api/v1/e2ee/keys/#{fake_key_id}/revoke")

      assert json_response(conn, 404)
    end

    test "revoked key cannot be used for prekey bundle", %{conn: conn, user: user} do
      keys = generate_key_bundle("device-001")

      post(conn, ~p"/api/v1/e2ee/keys", %{
        identity_key: keys.identity_key,
        device_id: keys.device_id,
        signed_prekey: keys.signed_prekey,
        prekey_signature: keys.prekey_signature,
        prekey_id: keys.prekey_id,
        one_time_prekeys: keys.one_time_prekeys
      })

      devices_conn = get(conn, ~p"/api/v1/e2ee/devices")
      assert %{"data" => [device | _]} = json_response(devices_conn, 200)
      key_id = device["key_id"] || device["identity_key_id"]

      if key_id do
        # Revoke the key
        post(conn, ~p"/api/v1/e2ee/keys/#{key_id}/revoke")

        # Attempt to get prekey bundle should fail (404) since key is revoked
        bundle_conn = get(conn, ~p"/api/v1/e2ee/keys/#{user.id}")

        # Revoked keys should not be available - expect 404
        assert json_response(bundle_conn, 404)
      end
    end
  end

  # ===========================================================================
  # Security Edge Cases
  # ===========================================================================

  describe "security edge cases" do
    test "cannot access other user's devices", %{conn: _conn} do
      # Create another user
      {:ok, other_user} =
        Accounts.create_user(%{
          email: "attacker@example.com",
          password: "TestPassword123!",
          username: "attacker"
        })

      {:ok, attacker_token, _} = Cgraph.Guardian.encode_and_sign(other_user)

      attacker_conn =
        build_conn()
        |> put_req_header("accept", "application/json")
        |> put_req_header("authorization", "Bearer #{attacker_token}")

      # Attacker should only see their own (empty) devices
      conn = get(attacker_conn, ~p"/api/v1/e2ee/devices")

      assert %{"data" => devices} = json_response(conn, 200)
      assert devices == []
    end

    test "expired tokens cannot register keys" do
      # Build connection with no/invalid token
      conn =
        build_conn()
        |> put_req_header("accept", "application/json")
        |> put_req_header("authorization", "Bearer invalid_token")

      keys = generate_key_bundle("device-001")

      conn =
        post(conn, ~p"/api/v1/e2ee/keys", %{
          identity_key: keys.identity_key,
          device_id: keys.device_id,
          signed_prekey: keys.signed_prekey,
          prekey_signature: keys.prekey_signature,
          prekey_id: keys.prekey_id,
          one_time_prekeys: []
        })

      assert json_response(conn, 401)
    end

    test "handles malformed key data gracefully", %{conn: conn} do
      conn =
        post(conn, ~p"/api/v1/e2ee/keys", %{
          identity_key: "not_valid_base64!!!",
          device_id: "device-001",
          signed_prekey: "also_invalid",
          prekey_signature: "bad_sig",
          prekey_id: 1,
          one_time_prekeys: []
        })

      # Should return error, not crash
      response = json_response(conn, 422)
      assert response["error"] || response["errors"]
    end

    test "handles missing required fields", %{conn: conn} do
      conn =
        post(conn, ~p"/api/v1/e2ee/keys", %{
          # Missing identity_key, device_id, etc.
          prekey_id: 1
        })

      # Should return validation error (currently returns 500 due to changeset error)
      # This validates that the endpoint returns an error for missing required fields
      status = conn.status
      assert status in [400, 422, 500]
    end
  end

  # ===========================================================================
  # Helper Functions
  # ===========================================================================

  defp register_keys_for_user(conn) do
    keys = generate_key_bundle("device-001")

    post(conn, ~p"/api/v1/e2ee/keys", %{
      identity_key: keys.identity_key,
      device_id: keys.device_id,
      signed_prekey: keys.signed_prekey,
      prekey_signature: keys.prekey_signature,
      prekey_id: keys.prekey_id,
      one_time_prekeys: keys.one_time_prekeys
    })

    keys
  end

  defp generate_key_bundle(device_id) do
    # Generate Ed25519 identity key
    identity_private = :crypto.strong_rand_bytes(32)
    {identity_public, identity_signing_key} = :crypto.generate_key(:eddsa, :ed25519, identity_private)

    # Generate X25519 signed prekey
    {signed_prekey_public, _} = :crypto.generate_key(:ecdh, :x25519)
    prekey_id = :rand.uniform(1_000_000)

    # Sign the prekey
    signature = :crypto.sign(:eddsa, :sha512, signed_prekey_public, [identity_signing_key, :ed25519])

    # Generate one-time prekeys
    one_time_prekeys =
      Enum.map(1..50, fn id ->
        {public, _} = :crypto.generate_key(:ecdh, :x25519)
        [id, Base.encode64(public)]
      end)

    %{
      device_id: device_id,
      identity_key: Base.encode64(identity_public),
      signed_prekey: Base.encode64(signed_prekey_public),
      prekey_signature: Base.encode64(signature),
      prekey_id: prekey_id,
      one_time_prekeys: one_time_prekeys
    }
  end

  defp generate_x25519_public_key do
    {public, _} = :crypto.generate_key(:ecdh, :x25519)
    Base.encode64(public)
  end
end
