defmodule CGraph.Auth.SessionTokenBridgeTest do
  @moduledoc """
  Integration tests for the session → token revocation bridge.

  ## Why This Bridge Exists

  `CGraph.Accounts.Sessions` manages DB session records while
  `CGraph.Auth.TokenManager.Store` manages JWT token state (ETS/Redis).
  Without a bridge, revoking a session only marks it in the DB — the
  JWT tokens remain valid in the Store until they expire, allowing
  continued API access after logout.

  These tests verify that session revocation cascades to the token store,
  covering: single session revocation, "revoke other sessions" (multi-device
  logout), refresh token rejection, graceful handling when no tokens exist,
  and DB/Store consistency.
  """
  use CGraph.DataCase, async: false

  alias CGraph.Accounts.Sessions
  alias CGraph.Auth.TokenManager
  alias CGraph.Auth.TokenManager.Store
  alias CGraph.Guardian

  import CgraphWeb.UserFixtures

  setup do
    # Ensure TokenManager GenServer is running (creates ETS tables)
    case GenServer.whereis(TokenManager) do
      nil ->
        start_supervised!(TokenManager)

      _pid ->
        # Already running — clean ETS tables for test isolation
        :ets.delete_all_objects(:refresh_tokens)
        :ets.delete_all_objects(:revoked_tokens)
        :ets.delete_all_objects(:token_families)
    end

    user = user_fixture()
    %{user: user}
  end

  # ---------------------------------------------------------------------------
  # Helpers
  # ---------------------------------------------------------------------------

  # Create a DB session and generate linked JWT tokens.
  # Passes session_id so the bridge can associate tokens with sessions.
  defp create_session_with_tokens(user, device_name \\ "Test Device") do
    {:ok, session, _raw_token} =
      Sessions.create_session(user, %{device: device_name, ip: "127.0.0.1"})

    {:ok, tokens} = TokenManager.generate_tokens(user, session_id: session.id)
    {:ok, claims} = Guardian.decode_and_verify(tokens.refresh_token)
    jti = claims["jti"]

    {session, tokens, jti}
  end

  # ---------------------------------------------------------------------------
  # Tests
  # ---------------------------------------------------------------------------

  describe "session-token bridge" do
    test "revoking a session invalidates its tokens in TokenManager.Store", %{user: user} do
      {session, _tokens, jti} = create_session_with_tokens(user)

      # Token should be active before revocation
      refute Store.token_revoked?(jti)

      # Revoke the session (DB operation)
      {:ok, _revoked} = Sessions.revoke_session(session)

      # Bridge expectation: token must now be revoked in Store
      assert Store.token_revoked?(jti)
    end

    test "revoking all other sessions invalidates their tokens", %{user: user} do
      # Create 3 sessions simulating 3 devices
      {current_session, _t1, current_jti} =
        create_session_with_tokens(user, "Current Device")

      {_session2, _t2, jti2} =
        create_session_with_tokens(user, "Other Device 1")

      {_session3, _t3, jti3} =
        create_session_with_tokens(user, "Other Device 2")

      # All tokens should be active
      refute Store.token_revoked?(current_jti)
      refute Store.token_revoked?(jti2)
      refute Store.token_revoked?(jti3)

      # Revoke all sessions except current
      :ok = Sessions.revoke_other_sessions(user, current_session.id)

      # Other sessions' tokens should be revoked
      assert Store.token_revoked?(jti2)
      assert Store.token_revoked?(jti3)

      # Current session's tokens should remain valid
      refute Store.token_revoked?(current_jti)
    end

    test "refreshing a revoked session's token fails", %{user: user} do
      {session, tokens, _jti} = create_session_with_tokens(user)

      # Revoke the session
      {:ok, _revoked} = Sessions.revoke_session(session)

      # Attempting to refresh should fail (token is revoked in Store)
      assert {:error, _reason} = TokenManager.refresh(tokens.refresh_token)
    end

    test "revoking a session with no tokens in Store succeeds", %{user: user} do
      # Create a DB session WITHOUT generating JWT tokens in TokenManager
      {:ok, session, _raw_token} =
        Sessions.create_session(user, %{device: "Ghost Device", ip: "127.0.0.1"})

      # Revoke should succeed gracefully — no crash even though
      # no tokens exist in Store for this session
      assert {:ok, revoked} = Sessions.revoke_session(session)
      assert revoked.revoked_at != nil
    end

    test "session revocation and token revocation are consistent", %{user: user} do
      {session, _tokens, jti} = create_session_with_tokens(user)

      # Revoke the session
      {:ok, revoked_session} = Sessions.revoke_session(session)

      # DB side: session is marked as revoked
      assert revoked_session.revoked_at != nil
      db_session = Sessions.get_session_by_id(session.id)
      assert db_session.revoked_at != nil

      # Store side: token is revoked
      assert Store.token_revoked?(jti)
    end
  end
end
