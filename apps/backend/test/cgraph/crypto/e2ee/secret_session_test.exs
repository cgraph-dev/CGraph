defmodule CGraph.Crypto.E2EE.SecretSessionTest do
  @moduledoc "Tests for E2EE session tracking."
  use CGraph.DataCase, async: true
  import CGraph.Factory

  alias CGraph.Crypto.E2EE.SecretSession

  # ============================================================================
  # Session Lifecycle
  # ============================================================================

  describe "create_session/5" do
    test "creates an E2EE session between two users" do
      user = insert(:user)
      peer = insert(:user)
      convo_id = Ecto.UUID.generate()

      assert {:ok, %SecretSession{} = session} =
               SecretSession.create_session(user.id, peer.id, convo_id, "secret",
                 device_id: "dev_1"
               )

      assert session.user_id == user.id
      assert session.peer_id == peer.id
      assert session.conversation_id == convo_id
      assert session.conversation_type == "secret"
      assert session.device_id == "dev_1"
      assert session.session_state == "active"
      assert session.message_count == 0
    end

    test "prevents duplicate sessions for same user/peer/convo/device" do
      user = insert(:user)
      peer = insert(:user)
      convo_id = Ecto.UUID.generate()

      assert {:ok, _} =
               SecretSession.create_session(user.id, peer.id, convo_id, "secret",
                 device_id: "dev_1"
               )

      assert {:error, %Ecto.Changeset{}} =
               SecretSession.create_session(user.id, peer.id, convo_id, "secret",
                 device_id: "dev_1"
               )
    end

    test "allows sessions for different devices" do
      user = insert(:user)
      peer = insert(:user)
      convo_id = Ecto.UUID.generate()

      assert {:ok, _} =
               SecretSession.create_session(user.id, peer.id, convo_id, "secret",
                 device_id: "dev_1"
               )

      assert {:ok, _} =
               SecretSession.create_session(user.id, peer.id, convo_id, "secret",
                 device_id: "dev_2"
               )
    end

    test "validates conversation_type" do
      user = insert(:user)
      peer = insert(:user)

      assert {:error, %Ecto.Changeset{}} =
               SecretSession.create_session(
                 user.id,
                 peer.id,
                 Ecto.UUID.generate(),
                 "invalid"
               )
    end
  end

  describe "get_session/3" do
    test "returns active session" do
      user = insert(:user)
      peer = insert(:user)
      convo_id = Ecto.UUID.generate()

      {:ok, created} = SecretSession.create_session(user.id, peer.id, convo_id, "secret")

      assert {:ok, fetched} = SecretSession.get_session(user.id, peer.id, convo_id)
      assert fetched.id == created.id
    end

    test "returns :not_found for nonexistent session" do
      user = insert(:user)
      peer = insert(:user)

      assert {:error, :not_found} =
               SecretSession.get_session(user.id, peer.id, Ecto.UUID.generate())
    end

    test "does not return terminated sessions" do
      user = insert(:user)
      peer = insert(:user)
      convo_id = Ecto.UUID.generate()

      {:ok, session} = SecretSession.create_session(user.id, peer.id, convo_id, "secret")
      {:ok, _} = SecretSession.terminate_session(session.id)

      assert {:error, :not_found} = SecretSession.get_session(user.id, peer.id, convo_id)
    end
  end

  describe "list_sessions/1" do
    test "returns all active sessions for a user" do
      user = insert(:user)
      peer1 = insert(:user)
      peer2 = insert(:user)

      {:ok, _} = SecretSession.create_session(user.id, peer1.id, Ecto.UUID.generate(), "secret")
      {:ok, _} = SecretSession.create_session(user.id, peer2.id, Ecto.UUID.generate(), "dm")

      sessions = SecretSession.list_sessions(user.id)
      assert length(sessions) == 2
    end

    test "returns empty for user with no sessions" do
      user = insert(:user)
      assert SecretSession.list_sessions(user.id) == []
    end
  end

  # ============================================================================
  # Ratchet Key Management
  # ============================================================================

  describe "update_ratchet_key/2" do
    test "updates ratchet key and increments counter" do
      user = insert(:user)
      peer = insert(:user)

      {:ok, session} =
        SecretSession.create_session(user.id, peer.id, Ecto.UUID.generate(), "secret")

      new_key = :crypto.strong_rand_bytes(32)

      assert {:ok, updated, _rotation_needed} =
               SecretSession.update_ratchet_key(session, new_key)

      assert updated.current_ratchet_public_key == new_key
      assert updated.message_count == 1
      assert updated.last_key_rotation_at != nil
    end

    test "sets last_key_rotation_at when key changes" do
      user = insert(:user)
      peer = insert(:user)

      {:ok, session} =
        SecretSession.create_session(user.id, peer.id, Ecto.UUID.generate(), "secret")

      key1 = :crypto.strong_rand_bytes(32)
      {:ok, s1, _} = SecretSession.update_ratchet_key(session, key1)
      assert s1.last_key_rotation_at != nil

      key2 = :crypto.strong_rand_bytes(32)
      {:ok, s2, _} = SecretSession.update_ratchet_key(s1, key2)
      assert DateTime.compare(s2.last_key_rotation_at, s1.last_key_rotation_at) != :lt
    end

    test "signals rotation needed at threshold" do
      user = insert(:user)
      peer = insert(:user)

      {:ok, session} =
        SecretSession.create_session(user.id, peer.id, Ecto.UUID.generate(), "secret")

      # Manually set message_count to just below threshold
      {:ok, session} =
        session
        |> Ecto.Changeset.change(%{message_count: 99})
        |> CGraph.Repo.update()

      key = :crypto.strong_rand_bytes(32)
      {:ok, _updated, rotation_needed} = SecretSession.update_ratchet_key(session, key)

      assert rotation_needed == true
    end
  end

  # ============================================================================
  # Session Termination
  # ============================================================================

  describe "terminate_session/1" do
    test "marks session as terminated" do
      user = insert(:user)
      peer = insert(:user)

      {:ok, session} =
        SecretSession.create_session(user.id, peer.id, Ecto.UUID.generate(), "secret")

      assert {:ok, terminated} = SecretSession.terminate_session(session.id)
      assert terminated.session_state == "terminated"
    end

    test "returns :not_found for nonexistent session" do
      assert {:error, :not_found} = SecretSession.terminate_session(Ecto.UUID.generate())
    end
  end

  describe "needs_key_rotation?/1" do
    test "returns false for low message count" do
      session = %SecretSession{message_count: 50}
      refute SecretSession.needs_key_rotation?(session)
    end

    test "returns true at rotation threshold" do
      session = %SecretSession{message_count: 100}
      assert SecretSession.needs_key_rotation?(session)
    end

    test "returns true at multiples of threshold" do
      session = %SecretSession{message_count: 200}
      assert SecretSession.needs_key_rotation?(session)
    end

    test "returns false between thresholds" do
      session = %SecretSession{message_count: 150}
      refute SecretSession.needs_key_rotation?(session)
    end
  end

  # ============================================================================
  # Stale Session Detection
  # ============================================================================

  describe "mark_stale_sessions/0" do
    test "marks old inactive sessions as stale" do
      user = insert(:user)
      peer = insert(:user)

      {:ok, session} =
        SecretSession.create_session(user.id, peer.id, Ecto.UUID.generate(), "secret")

      # Set updated_at to 31 days ago
      old_time = DateTime.utc_now() |> DateTime.add(-31, :day) |> DateTime.truncate(:microsecond)

      session
      |> Ecto.Changeset.change(%{updated_at: old_time})
      |> CGraph.Repo.update!()

      count = SecretSession.mark_stale_sessions()
      assert count >= 1

      {:error, :not_found} = SecretSession.get_session(user.id, peer.id, session.conversation_id)
    end

    test "does not mark recent sessions as stale" do
      user = insert(:user)
      peer = insert(:user)

      {:ok, _} =
        SecretSession.create_session(user.id, peer.id, Ecto.UUID.generate(), "secret")

      count = SecretSession.mark_stale_sessions()
      assert count == 0
    end
  end
end
