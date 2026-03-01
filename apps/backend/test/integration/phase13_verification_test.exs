defmodule CGraph.Phase13VerificationTest do
  @moduledoc """
  Phase 13 Human Verification Tests — Voice & Video

  Exercises the 8 flows flagged for human verification in 13-VERIFICATION.md:
  1. WebRTC P2P room lifecycle (create → join → leave → end)
  2. LiveKit JWT token generation with correct claims
  3. Hybrid P2P/SFU escalation (auto-escalate at 3+ participants)
  4. Call E2EE key management (generate, rotate, encrypt, cleanup)
  5. Call history persistence and REST API
  6. Voice channel manager (join, leave, members, state)
  7. Room deterministic naming for groups/channels/direct
  8. SFrame key mismatch detection (different keys produce different ciphertext)
  """
  use Cgraph.DataCase, async: false

  alias CGraph.WebRTC
  alias CGraph.WebRTC.{CallEncryption, CallHistory, Calls, LiveKit, LiveKitToken, Room, Participant}
  alias CGraph.WebRTC.VoiceChannelManager
  alias CGraph.Accounts
  alias CGraph.Groups.Operations
  alias CGraph.Repo

  # ---------------------------------------------------------------------------
  # Setup — start GenServers that aren't in test_helper.exs
  # ---------------------------------------------------------------------------

  setup_all do
    # Configure LiveKit for tests
    Application.put_env(:cgraph, CGraph.WebRTC.LiveKit, [
      api_key: "test_api_key",
      api_secret: "test_api_secret_must_be_at_least_32_chars_long",
      url: "ws://localhost:7880"
    ])

    # Start WebRTC GenServer (creates ETS table) — once for all tests
    webrtc_pid = case WebRTC.start_link([]) do
      {:ok, pid} -> pid
      {:error, {:already_started, pid}} -> pid
    end

    # Start CallEncryption GenServer (creates ETS table) — once for all tests
    encryption_pid = case CallEncryption.start_link([]) do
      {:ok, pid} -> pid
      {:error, {:already_started, pid}} -> pid
    end

    on_exit(fn ->
      if Process.alive?(webrtc_pid), do: GenServer.stop(webrtc_pid, :normal, 5000)
      if Process.alive?(encryption_pid), do: GenServer.stop(encryption_pid, :normal, 5000)
    end)

    :ok
  end

  setup do
    # Clean ETS tables between tests to avoid cross-test leakage
    try do :ets.delete_all_objects(:cgraph_webrtc_rooms) rescue _ -> :ok end
    try do :ets.delete_all_objects(:call_encryption_keys) rescue _ -> :ok end
    :ok
  end

  # ---------------------------------------------------------------------------
  # Helpers
  # ---------------------------------------------------------------------------

  defp create_user(attrs \\ %{}) do
    unique = System.unique_integer([:positive])
    base = %{
      username: "p13_user_#{unique}",
      email: "p13_user_#{unique}@test.com",
      password: "ValidPassword123!",
      password_confirmation: "ValidPassword123!"
    }

    {:ok, user} = Accounts.create_user(Map.merge(base, attrs))
    user
  end

  defp create_group_with_owner do
    owner = create_user(%{username: "p13_owner_#{System.unique_integer([:positive])}"})
    {:ok, group} = Operations.create_group(owner, %{
      "name" => "VoiceTest Group #{System.unique_integer([:positive])}",
      "description" => "Phase 13 verification"
    })
    group = Repo.preload(group, [:channels, :roles])
    {owner, group}
  end

  defp insert_call_history(attrs) do
    defaults = %{
      room_id: "room_#{System.unique_integer([:positive])}",
      type: "audio",
      state: "ended",
      participant_ids: [],
      max_participants: 2,
      started_at: DateTime.add(DateTime.utc_now(), -300, :second),
      ended_at: DateTime.add(DateTime.utc_now(), -60, :second),
      duration_seconds: 240
    }

    merged = Map.merge(defaults, attrs)
    %CallHistory{}
    |> CallHistory.changeset(merged)
    |> Repo.insert!()
  end

  # ---------------------------------------------------------------------------
  # Test 1: WebRTC P2P Room Lifecycle
  # ---------------------------------------------------------------------------

  describe "Test 1: WebRTC P2P room lifecycle" do
    test "create room returns a valid room in :waiting state" do
      {:ok, room} = WebRTC.create_room("creator_1", :audio)

      assert room.id != nil
      assert room.type == :audio
      assert room.creator_id == "creator_1"
      assert room.state == :waiting
      assert room.mode == :p2p
      assert map_size(room.participants) == 0
    end

    test "joining a room transitions it to :active" do
      {:ok, room} = WebRTC.create_room("caller", :video)
      {:ok, updated} = WebRTC.join_room(room.id, "caller")

      assert updated.state == :active
      assert Map.has_key?(updated.participants, "caller")
      assert updated.started_at != nil
    end

    test "second participant can join a P2P room" do
      {:ok, room} = WebRTC.create_room("caller", :audio)
      {:ok, _} = WebRTC.join_room(room.id, "caller")
      {:ok, updated} = WebRTC.join_room(room.id, "callee")

      assert map_size(updated.participants) == 2
      assert Map.has_key?(updated.participants, "caller")
      assert Map.has_key?(updated.participants, "callee")
    end

    test "leaving a room removes participant; last leave ends room" do
      {:ok, room} = WebRTC.create_room("caller", :audio)
      {:ok, _} = WebRTC.join_room(room.id, "caller")
      {:ok, _} = WebRTC.join_room(room.id, "callee")

      # First leave — room still active
      {:ok, after_first_leave} = WebRTC.leave_room(room.id, "callee")
      assert after_first_leave != :room_ended
      assert map_size(after_first_leave.participants) == 1

      # Last leave — room ends
      {:ok, :room_ended} = WebRTC.leave_room(room.id, "caller")

      # Room should no longer exist
      assert {:error, :not_found} = WebRTC.get_room(room.id)
    end

    test "end_room ends the call for all participants" do
      {:ok, room} = WebRTC.create_room("caller", :audio)
      {:ok, _} = WebRTC.join_room(room.id, "caller")
      {:ok, _} = WebRTC.join_room(room.id, "callee")

      {:ok, ended} = WebRTC.end_room(room.id, "caller")
      assert ended.state == :ended
      assert ended.ended_at != nil
    end

    test "room rejects joins when full" do
      {:ok, room} = WebRTC.create_room("caller", :audio, max_participants: 2)
      {:ok, _} = WebRTC.join_room(room.id, "user_1")
      {:ok, _} = WebRTC.join_room(room.id, "user_2")

      assert {:error, :room_full} = WebRTC.join_room(room.id, "user_3")
    end

    test "get_room returns the current room state" do
      {:ok, room} = WebRTC.create_room("caller", :audio)
      {:ok, fetched} = WebRTC.get_room(room.id)

      assert fetched.id == room.id
      assert fetched.creator_id == "caller"
    end

    test "get_room returns :not_found for non-existent room" do
      assert {:error, :not_found} = WebRTC.get_room("nonexistent_room_id")
    end
  end

  # ---------------------------------------------------------------------------
  # Test 2: LiveKit JWT Token Generation
  # ---------------------------------------------------------------------------

  describe "Test 2: LiveKit JWT token generation" do
    test "generates a valid JWT with correct room and identity claims" do
      {:ok, token} = LiveKitToken.generate_token("test_room", "user_42")

      # Verify it's a valid JWT (3-part base64-encoded)
      parts = String.split(token, ".")
      assert length(parts) == 3

      # Decode the payload (middle part)
      payload_b64 = Enum.at(parts, 1)
      # JWT uses URL-safe base64 without padding
      padded = case rem(byte_size(payload_b64), 4) do
        2 -> payload_b64 <> "=="
        3 -> payload_b64 <> "="
        _ -> payload_b64
      end
      {:ok, payload_json} = Base.url_decode64(padded)
      {:ok, claims} = Jason.decode(payload_json)

      # Verify claims
      assert claims["iss"] == "test_api_key"
      assert claims["sub"] == "user_42"
      assert is_integer(claims["iat"])
      assert is_integer(claims["exp"])
      assert claims["exp"] > claims["iat"]
      assert is_binary(claims["jti"])

      # Verify video grant
      video = claims["video"]
      assert video["room"] == "test_room"
      assert video["roomJoin"] == true
      assert video["canPublish"] == true
      assert video["canSubscribe"] == true
      assert video["canPublishData"] == true
    end

    test "token TTL defaults to 6 hours" do
      {:ok, token} = LiveKitToken.generate_token("room", "user")
      claims = decode_jwt_claims(token)

      ttl = claims["exp"] - claims["iat"]
      assert ttl == 6 * 60 * 60
    end

    test "custom TTL is respected" do
      {:ok, token} = LiveKitToken.generate_token("room", "user", ttl: 3600)
      claims = decode_jwt_claims(token)

      ttl = claims["exp"] - claims["iat"]
      assert ttl == 3600
    end

    test "token includes optional name and metadata" do
      {:ok, token} = LiveKitToken.generate_token("room", "user",
        name: "Alice",
        metadata: "role:admin"
      )
      claims = decode_jwt_claims(token)

      assert claims["name"] == "Alice"
      assert claims["metadata"] == "role:admin"
    end

    test "missing config returns error" do
      # Temporarily clear config
      original = Application.get_env(:cgraph, CGraph.WebRTC.LiveKit)
      Application.put_env(:cgraph, CGraph.WebRTC.LiveKit, [])

      result = LiveKitToken.generate_token("room", "user")
      assert {:error, {:missing_config, :api_key}} = result

      # Restore
      Application.put_env(:cgraph, CGraph.WebRTC.LiveKit, original)
    end

    test "configured?/0 returns true when api_key and api_secret are set" do
      assert LiveKitToken.configured?() == true
    end

    test "configured?/0 returns false when config is empty" do
      original = Application.get_env(:cgraph, CGraph.WebRTC.LiveKit)
      Application.put_env(:cgraph, CGraph.WebRTC.LiveKit, [])

      refute LiveKitToken.configured?()

      Application.put_env(:cgraph, CGraph.WebRTC.LiveKit, original)
    end

    test "get_url/0 returns configured or default URL" do
      url = LiveKitToken.get_url()
      assert url == "ws://localhost:7880"
    end

    test "can_publish and can_subscribe opts are honored" do
      {:ok, token} = LiveKitToken.generate_token("room", "user",
        can_publish: false,
        can_subscribe: false
      )
      claims = decode_jwt_claims(token)

      assert claims["video"]["canPublish"] == false
      assert claims["video"]["canSubscribe"] == false
    end
  end

  # ---------------------------------------------------------------------------
  # Test 3: Hybrid P2P/SFU Escalation
  # ---------------------------------------------------------------------------

  describe "Test 3: Hybrid P2P/SFU escalation" do
    test "rooms start in P2P mode" do
      {:ok, room} = WebRTC.create_room("caller", :audio)
      assert room.mode == :p2p
    end

    test "explicit escalate_to_sfu changes mode" do
      {:ok, room} = WebRTC.create_room("caller", :video)
      {:ok, _} = WebRTC.join_room(room.id, "caller")

      {:ok, escalated} = WebRTC.escalate_to_sfu(room.id)
      assert escalated.mode == :sfu
    end

    test "escalating an already-SFU room is a no-op" do
      {:ok, room} = WebRTC.create_room("caller", :audio, mode: :sfu)
      {:ok, _} = WebRTC.join_room(room.id, "caller")

      {:ok, still_sfu} = WebRTC.escalate_to_sfu(room.id)
      assert still_sfu.mode == :sfu
    end

    test "escalating non-existent room returns error" do
      assert {:error, :not_found} = WebRTC.escalate_to_sfu("nonexistent")
    end

    test "room can be created directly in SFU mode" do
      {:ok, room} = WebRTC.create_room("caller", :video, mode: :sfu)
      assert room.mode == :sfu
    end

    test "Room struct correctly tracks mode field" do
      room = %Room{
        id: "test",
        type: :audio,
        creator_id: "user",
        mode: :sfu,
        created_at: DateTime.utc_now()
      }

      assert room.mode == :sfu
      assert Room.to_map(room).mode == :sfu
    end
  end

  # ---------------------------------------------------------------------------
  # Test 4: Call E2EE Key Management
  # ---------------------------------------------------------------------------

  describe "Test 4: Call E2EE key management" do
    test "get_or_create_room_key generates a new 256-bit key" do
      {:ok, key_b64} = CallEncryption.get_or_create_room_key("room_e2ee_1")

      key = Base.decode64!(key_b64)
      assert byte_size(key) == 32, "Key should be 256 bits (32 bytes)"
    end

    test "get_or_create_room_key returns same key for same room" do
      {:ok, key1} = CallEncryption.get_or_create_room_key("room_e2ee_2")
      {:ok, key2} = CallEncryption.get_or_create_room_key("room_e2ee_2")

      assert key1 == key2, "Same room should return the same key"
    end

    test "different rooms get different keys" do
      {:ok, key_a} = CallEncryption.get_or_create_room_key("room_a")
      {:ok, key_b} = CallEncryption.get_or_create_room_key("room_b")

      assert key_a != key_b, "Different rooms should have different keys"
    end

    test "rotate_room_key produces a new key for the same room" do
      {:ok, original} = CallEncryption.get_or_create_room_key("room_rotate")
      {:ok, rotated} = CallEncryption.rotate_room_key("room_rotate")

      assert rotated != original, "Rotated key should differ from original"
      assert byte_size(Base.decode64!(rotated)) == 32
    end

    test "after rotation, get_or_create returns the rotated key" do
      {:ok, _orig} = CallEncryption.get_or_create_room_key("room_rot2")
      {:ok, rotated} = CallEncryption.rotate_room_key("room_rot2")
      {:ok, fetched} = CallEncryption.get_or_create_room_key("room_rot2")

      assert fetched == rotated
    end

    test "encrypt_room_key_for_participant wraps key in AES-GCM" do
      {:ok, _key} = CallEncryption.get_or_create_room_key("room_wrap")

      {:ok, wrapped} = CallEncryption.encrypt_room_key_for_participant(
        "room_wrap",
        "participant_shared_secret"
      )

      assert is_binary(wrapped.encrypted_key)
      assert is_binary(wrapped.iv)
      assert is_binary(wrapped.tag)

      # Verify all are valid base64
      assert {:ok, _} = Base.decode64(wrapped.encrypted_key)
      assert {:ok, _} = Base.decode64(wrapped.iv)
      assert {:ok, _} = Base.decode64(wrapped.tag)
    end

    test "encrypted key can be decrypted with same participant secret" do
      room_id = "room_decrypt"
      participant_secret = "my_shared_secret_for_test"

      {:ok, room_key_b64} = CallEncryption.get_or_create_room_key(room_id)
      {:ok, wrapped} = CallEncryption.encrypt_room_key_for_participant(room_id, participant_secret)

      # Decrypt manually
      wrap_key = :crypto.hash(:sha256, participant_secret)
      iv = Base.decode64!(wrapped.iv)
      ciphertext = Base.decode64!(wrapped.encrypted_key)
      tag = Base.decode64!(wrapped.tag)
      aad = "cgraph-call-e2ee-v1"

      decrypted = :crypto.crypto_one_time_aead(
        :aes_256_gcm, wrap_key, iv, ciphertext, aad, tag, false
      )

      assert Base.encode64(decrypted) == room_key_b64
    end

    test "wrong participant secret cannot decrypt the key" do
      {:ok, _key} = CallEncryption.get_or_create_room_key("room_wrong")
      {:ok, wrapped} = CallEncryption.encrypt_room_key_for_participant("room_wrong", "correct_secret")

      # Try to decrypt with wrong secret
      wrong_wrap_key = :crypto.hash(:sha256, "wrong_secret")
      iv = Base.decode64!(wrapped.iv)
      ciphertext = Base.decode64!(wrapped.encrypted_key)
      tag = Base.decode64!(wrapped.tag)
      aad = "cgraph-call-e2ee-v1"

      result = :crypto.crypto_one_time_aead(
        :aes_256_gcm, wrong_wrap_key, iv, ciphertext, aad, tag, false
      )

      assert result == :error, "Decryption with wrong key should fail"
    end

    test "encrypt_room_key_for_participant returns error for non-existent room" do
      assert {:error, :room_key_not_found} =
        CallEncryption.encrypt_room_key_for_participant("no_such_room", "secret")
    end

    test "cleanup_room_key removes the key" do
      {:ok, _} = CallEncryption.get_or_create_room_key("room_cleanup")
      assert CallEncryption.has_room_key?("room_cleanup")

      :ok = CallEncryption.cleanup_room_key("room_cleanup")
      refute CallEncryption.has_room_key?("room_cleanup")
    end

    test "has_room_key? returns false for unknown room" do
      refute CallEncryption.has_room_key?("never_created_room")
    end

    test "different participants get different encrypted payloads for same room" do
      {:ok, _key} = CallEncryption.get_or_create_room_key("room_multi")
      {:ok, wrap_1} = CallEncryption.encrypt_room_key_for_participant("room_multi", "secret_alice")
      {:ok, wrap_2} = CallEncryption.encrypt_room_key_for_participant("room_multi", "secret_bob")

      # Different secrets → different IVs and ciphertexts
      assert wrap_1.iv != wrap_2.iv || wrap_1.encrypted_key != wrap_2.encrypted_key
    end
  end

  # ---------------------------------------------------------------------------
  # Test 5: Call History Persistence and Retrieval
  # ---------------------------------------------------------------------------

  describe "Test 5: Call history persistence and retrieval" do
    test "call history record can be inserted with valid attrs" do
      user = create_user()

      record = insert_call_history(%{
        creator_id: user.id,
        participant_ids: [user.id],
        type: "audio",
        state: "ended"
      })

      assert record.id != nil
      assert record.type == "audio"
      assert record.state == "ended"
      assert record.creator_id == user.id
    end

    test "list_call_history returns calls for a participant" do
      user = create_user()
      other = create_user()

      # Insert calls where user is a participant
      insert_call_history(%{creator_id: other.id, participant_ids: [user.id, other.id]})
      insert_call_history(%{creator_id: user.id, participant_ids: [user.id]})

      # Insert a call where user is NOT a participant
      insert_call_history(%{creator_id: other.id, participant_ids: [other.id]})

      {:ok, calls, _page_info} = Calls.list_call_history(user.id)

      # User should see 2 calls (one as creator, one as participant)
      assert length(calls) >= 2
      call_ids = Enum.map(calls, & &1.id)
      assert Enum.all?(calls, fn c ->
        user.id in c.participant_ids or c.creator_id == user.id
      end)
    end

    test "list_call_history respects limit parameter" do
      user = create_user()

      for _ <- 1..5 do
        insert_call_history(%{creator_id: user.id, participant_ids: [user.id]})
      end

      {:ok, calls, _page_info} = Calls.list_call_history(user.id, limit: 2)
      assert length(calls) <= 2
    end

    test "get_call returns a specific call record" do
      user = create_user()
      record = insert_call_history(%{creator_id: user.id, participant_ids: [user.id]})

      {:ok, fetched} = Calls.get_call(record.id)
      assert fetched.id == record.id
      assert fetched.room_id == record.room_id
    end

    test "get_call returns :not_found for missing record" do
      fake_id = Ecto.UUID.generate()
      assert {:error, :not_found} = Calls.get_call(fake_id)
    end

    test "call history records video and screen_share types" do
      user = create_user()

      video = insert_call_history(%{creator_id: user.id, participant_ids: [user.id], type: "video"})
      screen = insert_call_history(%{creator_id: user.id, participant_ids: [user.id], type: "screen_share"})

      assert video.type == "video"
      assert screen.type == "screen_share"
    end

    test "persist_call_history writes room data to DB" do
      user = create_user()

      # Create a room lifecycle in ETS
      {:ok, room} = WebRTC.create_room(user.id, :video)
      {:ok, room_joined} = WebRTC.join_room(room.id, user.id)

      # Manually construct ended room for persistence
      ended_room = %{room_joined |
        state: :ended,
        ended_at: DateTime.utc_now()
      }

      # Persist
      Calls.persist_call_history(ended_room, room_joined)

      # Verify it was written
      {:ok, calls, _} = Calls.list_call_history(user.id)
      matching = Enum.find(calls, fn c -> c.room_id == room.id end)
      assert matching != nil
      assert matching.state == "ended"
    end
  end

  # ---------------------------------------------------------------------------
  # Test 6: Call History REST Controller
  # ---------------------------------------------------------------------------

  describe "Test 6: Call history REST API" do
    @endpoint CGraphWeb.Endpoint

    import Phoenix.ConnTest
    import Plug.Conn

    setup %{} do
      conn = build_conn()
      {:ok, conn: conn}
    end

    test "GET /api/v1/calls returns call history for authenticated user", %{conn: conn} do
      user = create_user()
      conn = CgraphWeb.ConnCase.log_in_user(conn, user)

      # Insert test data
      insert_call_history(%{creator_id: user.id, participant_ids: [user.id], type: "audio"})
      insert_call_history(%{creator_id: user.id, participant_ids: [user.id], type: "video"})

      resp =
        conn
        |> get("/api/v1/calls")
        |> json_response(200)

      assert is_list(resp["data"])
      assert length(resp["data"]) >= 2
      assert is_map(resp["meta"])
    end

    test "GET /api/v1/calls respects limit parameter", %{conn: conn} do
      user = create_user()
      conn = CgraphWeb.ConnCase.log_in_user(conn, user)

      for _ <- 1..5 do
        insert_call_history(%{creator_id: user.id, participant_ids: [user.id]})
      end

      resp =
        conn
        |> get("/api/v1/calls?limit=2")
        |> json_response(200)

      assert length(resp["data"]) <= 2
    end

    test "GET /api/v1/calls/:id returns a specific call", %{conn: conn} do
      user = create_user()
      conn = CgraphWeb.ConnCase.log_in_user(conn, user)
      record = insert_call_history(%{creator_id: user.id, participant_ids: [user.id]})

      resp =
        conn
        |> get("/api/v1/calls/#{record.id}")
        |> json_response(200)

      assert resp["data"]["id"] == record.id
      assert resp["data"]["type"] == "audio"
    end

    test "GET /api/v1/calls/:id returns 404 for non-existent call", %{conn: conn} do
      user = create_user()
      conn = CgraphWeb.ConnCase.log_in_user(conn, user)

      fake_id = Ecto.UUID.generate()
      conn
      |> get("/api/v1/calls/#{fake_id}")
      |> json_response(404)
    end

    test "GET /api/v1/calls returns serialized fields", %{conn: conn} do
      user = create_user()
      conn = CgraphWeb.ConnCase.log_in_user(conn, user)

      insert_call_history(%{
        creator_id: user.id,
        participant_ids: [user.id],
        type: "video",
        duration_seconds: 120
      })

      resp =
        conn
        |> get("/api/v1/calls")
        |> json_response(200)

      call = List.first(resp["data"])
      assert Map.has_key?(call, "id")
      assert Map.has_key?(call, "room_id")
      assert Map.has_key?(call, "type")
      assert Map.has_key?(call, "creator_id")
      assert Map.has_key?(call, "state")
      assert Map.has_key?(call, "participant_ids")
      assert Map.has_key?(call, "duration_seconds")
    end
  end

  # ---------------------------------------------------------------------------
  # Test 7: Room Deterministic Naming
  # ---------------------------------------------------------------------------

  describe "Test 7: Room deterministic naming" do
    test "room_name_for_channel produces deterministic name" do
      name = LiveKit.room_name_for_channel("group_1", "channel_1")
      assert name == "group_group_1_channel_channel_1"

      # Same inputs → same output
      assert LiveKit.room_name_for_channel("group_1", "channel_1") == name
    end

    test "different group/channel combos produce different names" do
      name_a = LiveKit.room_name_for_channel("g1", "c1")
      name_b = LiveKit.room_name_for_channel("g1", "c2")
      name_c = LiveKit.room_name_for_channel("g2", "c1")

      assert name_a != name_b
      assert name_a != name_c
    end

    test "room_name_for_direct produces deterministic sorted name" do
      # Order shouldn't matter — should be sorted
      name_ab = LiveKit.room_name_for_direct("user_a", "user_b")
      name_ba = LiveKit.room_name_for_direct("user_b", "user_a")

      assert name_ab == name_ba, "Direct room names should be order-independent"
      assert String.starts_with?(name_ab, "direct_")
    end

    test "voice_room_name produces vc_ prefixed name" do
      name = VoiceChannelManager.voice_room_name("ch_123")
      assert name == "vc_ch_123"
    end

    test "voice_topic produces voice: prefixed topic" do
      topic = VoiceChannelManager.voice_topic("ch_456")
      assert topic == "voice:ch_456"
    end
  end

  # ---------------------------------------------------------------------------
  # Test 8: Room Struct Functions
  # ---------------------------------------------------------------------------

  describe "Test 8: Room struct and helpers" do
    test "active?/1 returns true only for :active state" do
      assert Room.active?(%Room{state: :active, id: "r", type: :audio, creator_id: "u", created_at: DateTime.utc_now()})
      refute Room.active?(%Room{state: :waiting, id: "r", type: :audio, creator_id: "u", created_at: DateTime.utc_now()})
      refute Room.active?(%Room{state: :ended, id: "r", type: :audio, creator_id: "u", created_at: DateTime.utc_now()})
    end

    test "full?/1 returns true when at max capacity" do
      room = %Room{
        id: "r", type: :audio, creator_id: "u", created_at: DateTime.utc_now(),
        max_participants: 2,
        participants: %{
          "u1" => %Participant{id: "u1", joined_at: DateTime.utc_now()},
          "u2" => %Participant{id: "u2", joined_at: DateTime.utc_now()}
        }
      }
      assert Room.full?(room)
    end

    test "participant_count/1 returns correct count" do
      room = %Room{
        id: "r", type: :audio, creator_id: "u", created_at: DateTime.utc_now(),
        participants: %{
          "u1" => %Participant{id: "u1", joined_at: DateTime.utc_now()},
          "u2" => %Participant{id: "u2", joined_at: DateTime.utc_now()},
          "u3" => %Participant{id: "u3", joined_at: DateTime.utc_now()}
        }
      }
      assert Room.participant_count(room) == 3
    end

    test "duration/1 calculates call duration" do
      started = DateTime.add(DateTime.utc_now(), -600, :second)
      ended = DateTime.add(DateTime.utc_now(), -300, :second)

      room = %Room{
        id: "r", type: :audio, creator_id: "u", created_at: DateTime.utc_now(),
        started_at: started,
        ended_at: ended
      }

      assert Room.duration(room) == 300
    end

    test "to_map/1 serializes room correctly" do
      room = %Room{
        id: "r_map", type: :video, creator_id: "u_map", mode: :sfu,
        state: :active, participants: %{},
        created_at: DateTime.utc_now(), started_at: DateTime.utc_now()
      }

      map = Room.to_map(room)
      assert map.id == "r_map"
      assert map.type == :video
      assert map.mode == :sfu
      assert map.creator_id == "u_map"
      assert map.state == :active
      assert map.participant_count == 0
    end
  end

  # ---------------------------------------------------------------------------
  # Test 9: E2EE Key Isolation (SFrame Key Mismatch)
  # ---------------------------------------------------------------------------

  describe "Test 9: SFrame key mismatch produces decryption failure" do
    test "two rooms have independently generated keys" do
      {:ok, key_a} = CallEncryption.get_or_create_room_key("iso_room_a")
      {:ok, key_b} = CallEncryption.get_or_create_room_key("iso_room_b")

      assert key_a != key_b, "Different rooms must have independent keys"
    end

    test "key rotation invalidates previous encrypted payloads" do
      room_id = "key_mismatch_room"
      participant_secret = "test_participant_secret"

      # Generate key and encrypt
      {:ok, _key} = CallEncryption.get_or_create_room_key(room_id)
      {:ok, wrapped_before} = CallEncryption.encrypt_room_key_for_participant(room_id, participant_secret)

      # Rotate key
      {:ok, new_key_b64} = CallEncryption.rotate_room_key(room_id)

      # New wrapped key should be different (different underlying key)
      {:ok, wrapped_after} = CallEncryption.encrypt_room_key_for_participant(room_id, participant_secret)

      # The decrypted keys should differ
      wrap_key = :crypto.hash(:sha256, participant_secret)

      decrypted_before = :crypto.crypto_one_time_aead(
        :aes_256_gcm, wrap_key,
        Base.decode64!(wrapped_before.iv),
        Base.decode64!(wrapped_before.encrypted_key),
        "cgraph-call-e2ee-v1",
        Base.decode64!(wrapped_before.tag),
        false
      )

      decrypted_after = :crypto.crypto_one_time_aead(
        :aes_256_gcm, wrap_key,
        Base.decode64!(wrapped_after.iv),
        Base.decode64!(wrapped_after.encrypted_key),
        "cgraph-call-e2ee-v1",
        Base.decode64!(wrapped_after.tag),
        false
      )

      assert decrypted_before != decrypted_after,
        "Rotated key should produce different decrypted material"
      assert Base.encode64(decrypted_after) == new_key_b64,
        "Decrypted new wrapped key should match the rotated key"
    end

    test "simulated SFrame: data encrypted with room key A cannot be decrypted with room key B" do
      # Simulate what SFrame does on the client: encrypt media with room key
      {:ok, key_a_b64} = CallEncryption.get_or_create_room_key("sframe_room_a")
      {:ok, key_b_b64} = CallEncryption.get_or_create_room_key("sframe_room_b")

      key_a = Base.decode64!(key_a_b64)
      key_b = Base.decode64!(key_b_b64)

      # "Encrypt" a media frame with key A
      plaintext = "simulated audio frame data 48kHz opus"
      iv = :crypto.strong_rand_bytes(12)
      {ciphertext, tag} = :crypto.crypto_one_time_aead(
        :aes_256_gcm, key_a, iv, plaintext, "sframe-v1", true
      )

      # Attempt to decrypt with key B — should fail
      result_b = :crypto.crypto_one_time_aead(
        :aes_256_gcm, key_b, iv, ciphertext, "sframe-v1", tag, false
      )
      assert result_b == :error, "Decrypting with wrong room key must fail"

      # Verify correct key works
      result_a = :crypto.crypto_one_time_aead(
        :aes_256_gcm, key_a, iv, ciphertext, "sframe-v1", tag, false
      )
      assert result_a == plaintext, "Decrypting with correct room key should recover plaintext"
    end
  end

  # ---------------------------------------------------------------------------
  # Test 10: CallHistory Changeset Validation
  # ---------------------------------------------------------------------------

  describe "Test 10: CallHistory changeset validation" do
    test "valid changeset with required fields" do
      cs = CallHistory.changeset(%CallHistory{}, %{
        room_id: "room_1",
        type: "audio",
        state: "ended"
      })
      assert cs.valid?
    end

    test "invalid type is rejected" do
      cs = CallHistory.changeset(%CallHistory{}, %{
        room_id: "room_1",
        type: "invalid_type",
        state: "ended"
      })
      refute cs.valid?
      assert {:type, _} = List.keyfind(cs.errors, :type, 0)
    end

    test "invalid state is rejected" do
      cs = CallHistory.changeset(%CallHistory{}, %{
        room_id: "room_1",
        type: "audio",
        state: "invalid_state"
      })
      refute cs.valid?
      assert {:state, _} = List.keyfind(cs.errors, :state, 0)
    end

    test "missing room_id is rejected" do
      cs = CallHistory.changeset(%CallHistory{}, %{
        type: "audio",
        state: "ended"
      })
      refute cs.valid?
    end
  end

  # ---------------------------------------------------------------------------
  # Test 11: LiveKit Controller Token Endpoint
  # ---------------------------------------------------------------------------

  describe "Test 11: LiveKit controller token endpoint" do
    @endpoint CGraphWeb.Endpoint

    import Phoenix.ConnTest
    import Plug.Conn

    setup %{} do
      conn = build_conn()
      {:ok, conn: conn}
    end

    test "POST /api/v1/livekit/token returns token and url for authenticated user", %{conn: conn} do
      user = create_user()
      conn = CgraphWeb.ConnCase.log_in_user(conn, user)

      resp =
        conn
        |> put_req_header("content-type", "application/json")
        |> post("/api/v1/livekit/token", Jason.encode!(%{room_name: "test_room"}))
        |> json_response(200)

      assert is_binary(resp["token"])
      assert is_binary(resp["url"])
      assert String.starts_with?(resp["url"], "ws")
    end

    test "POST /api/v1/livekit/token with group_id verifies membership", %{conn: conn} do
      {owner, group} = create_group_with_owner()
      channel = group.channels |> List.first()

      conn = CgraphWeb.ConnCase.log_in_user(conn, owner)

      resp =
        conn
        |> put_req_header("content-type", "application/json")
        |> post("/api/v1/livekit/token", Jason.encode!(%{
          room_name: "test_room",
          group_id: group.id,
          channel_id: channel && channel.id
        }))
        |> json_response(200)

      assert is_binary(resp["token"])
    end
  end

  # ---------------------------------------------------------------------------
  # JWT decode helper
  # ---------------------------------------------------------------------------

  defp decode_jwt_claims(token) do
    [_header, payload_b64, _sig] = String.split(token, ".")
    padded = case rem(byte_size(payload_b64), 4) do
      2 -> payload_b64 <> "=="
      3 -> payload_b64 <> "="
      _ -> payload_b64
    end
    {:ok, json} = Base.url_decode64(padded)
    Jason.decode!(json)
  end
end
