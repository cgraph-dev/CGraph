defmodule CGraphWeb.API.V1.SecretChatControllerTest do
  @moduledoc """
  Tests for the secret chat REST API endpoints.

  Secret chats are Telegram-style device-bound E2EE conversations.
  """
  use CGraphWeb.ConnCase, async: false
  import CGraph.Factory

  alias CGraph.Messaging.SecretChat

  setup %{conn: conn} do
    user = insert(:user)
    other_user = insert(:user)

    conn =
      conn
      |> put_req_header("accept", "application/json")
      |> put_req_header("content-type", "application/json")

    authed_conn = log_in_user(conn, user)

    %{conn: conn, authed_conn: authed_conn, user: user, other_user: other_user}
  end

  # ============================================================================
  # Authentication
  # ============================================================================

  describe "authentication" do
    test "POST /api/v1/secret-chats returns 401 without auth", %{conn: conn} do
      conn |> post(~p"/api/v1/secret-chats", %{}) |> json_response(401)
    end

    test "GET /api/v1/secret-chats returns 401 without auth", %{conn: conn} do
      conn |> get(~p"/api/v1/secret-chats") |> json_response(401)
    end

    test "GET /api/v1/secret-chats/:id returns 401 without auth", %{conn: conn} do
      conn |> get(~p"/api/v1/secret-chats/#{Ecto.UUID.generate()}") |> json_response(401)
    end

    test "DELETE /api/v1/secret-chats/:id returns 401 without auth", %{conn: conn} do
      conn |> delete(~p"/api/v1/secret-chats/#{Ecto.UUID.generate()}") |> json_response(401)
    end

    test "PUT /api/v1/secret-chats/:id/timer returns 401 without auth", %{conn: conn} do
      conn
      |> put(~p"/api/v1/secret-chats/#{Ecto.UUID.generate()}/timer", %{})
      |> json_response(401)
    end
  end

  # ============================================================================
  # POST /api/v1/secret-chats
  # ============================================================================

  describe "POST /api/v1/secret-chats" do
    test "creates a secret chat", %{authed_conn: conn, other_user: other_user} do
      response =
        conn
        |> post(~p"/api/v1/secret-chats", %{
          recipient_id: other_user.id,
          device_id: "device_abc",
          fingerprint: "fp_123"
        })
        |> json_response(201)

      assert response["secret_chat"]["id"]
      assert response["secret_chat"]["status"] == "active"
    end

    test "returns 409 for duplicate active secret chat", %{
      authed_conn: conn,
      user: user,
      other_user: other_user
    } do
      {:ok, _} = SecretChat.create_secret_conversation(user, other_user.id)

      response =
        conn
        |> post(~p"/api/v1/secret-chats", %{recipient_id: other_user.id})
        |> json_response(409)

      assert response["error"] =~ "already exists"
    end

    test "returns 422 when chatting with self", %{authed_conn: conn, user: user} do
      response =
        conn
        |> post(~p"/api/v1/secret-chats", %{recipient_id: user.id})
        |> json_response(422)

      assert response["error"] =~ "yourself"
    end

    test "returns 400 without recipient_id", %{authed_conn: conn} do
      response =
        conn
        |> post(~p"/api/v1/secret-chats", %{})
        |> json_response(400)

      assert response["error"] =~ "recipient_id"
    end
  end

  # ============================================================================
  # GET /api/v1/secret-chats
  # ============================================================================

  describe "GET /api/v1/secret-chats" do
    test "returns user's active secret chats", %{authed_conn: conn, user: user} do
      other1 = insert(:user)
      other2 = insert(:user)

      {:ok, _} = SecretChat.create_secret_conversation(user, other1.id)
      {:ok, _} = SecretChat.create_secret_conversation(user, other2.id)

      response = conn |> get(~p"/api/v1/secret-chats") |> json_response(200)

      assert length(response["secret_chats"]) == 2
    end

    test "returns empty list for user with no secret chats", %{authed_conn: conn} do
      response = conn |> get(~p"/api/v1/secret-chats") |> json_response(200)

      assert response["secret_chats"] == []
    end

    test "excludes terminated conversations", %{authed_conn: conn, user: user, other_user: other_user} do
      {:ok, convo} = SecretChat.create_secret_conversation(user, other_user.id)
      {:ok, _} = SecretChat.destroy_secret_chat(convo, user.id)

      response = conn |> get(~p"/api/v1/secret-chats") |> json_response(200)

      assert response["secret_chats"] == []
    end
  end

  # ============================================================================
  # GET /api/v1/secret-chats/:id
  # ============================================================================

  describe "GET /api/v1/secret-chats/:id" do
    test "returns a specific secret chat", %{authed_conn: conn, user: user, other_user: other_user} do
      {:ok, convo} = SecretChat.create_secret_conversation(user, other_user.id)

      response =
        conn |> get(~p"/api/v1/secret-chats/#{convo.id}") |> json_response(200)

      assert response["secret_chat"]["id"] == convo.id
      assert response["secret_chat"]["status"] == "active"
    end

    test "returns 404 for non-participant", %{authed_conn: conn} do
      user_a = insert(:user)
      user_b = insert(:user)
      {:ok, convo} = SecretChat.create_secret_conversation(user_a, user_b.id)

      conn |> get(~p"/api/v1/secret-chats/#{convo.id}") |> json_response(404)
    end

    test "returns 404 for nonexistent conversation", %{authed_conn: conn} do
      conn
      |> get(~p"/api/v1/secret-chats/#{Ecto.UUID.generate()}")
      |> json_response(404)
    end
  end

  # ============================================================================
  # DELETE /api/v1/secret-chats/:id
  # ============================================================================

  describe "DELETE /api/v1/secret-chats/:id" do
    test "terminates secret chat and hard-deletes messages", %{
      authed_conn: conn,
      user: user,
      other_user: other_user
    } do
      {:ok, convo} = SecretChat.create_secret_conversation(user, other_user.id)

      # Add a message
      {:ok, _} =
        SecretChat.send_secret_message(convo, user, %{
          ciphertext: :crypto.strong_rand_bytes(32),
          nonce: :crypto.strong_rand_bytes(12),
          ratchet_header: :crypto.strong_rand_bytes(16)
        })

      response =
        conn |> delete(~p"/api/v1/secret-chats/#{convo.id}") |> json_response(200)

      assert response["message"] =~ "terminated"

      # Verify messages are gone
      assert SecretChat.list_secret_messages(convo) == []
    end

    test "returns 404 for non-existent conversation", %{authed_conn: conn} do
      conn
      |> delete(~p"/api/v1/secret-chats/#{Ecto.UUID.generate()}")
      |> json_response(404)
    end
  end

  # ============================================================================
  # PUT /api/v1/secret-chats/:id/timer
  # ============================================================================

  describe "PUT /api/v1/secret-chats/:id/timer" do
    test "sets self-destruct timer", %{authed_conn: conn, user: user, other_user: other_user} do
      {:ok, convo} = SecretChat.create_secret_conversation(user, other_user.id)

      response =
        conn
        |> put(~p"/api/v1/secret-chats/#{convo.id}/timer", %{seconds: 300})
        |> json_response(200)

      assert response["secret_chat"]["self_destruct_seconds"] == 300
    end

    test "clears timer with null", %{authed_conn: conn, user: user, other_user: other_user} do
      {:ok, convo} = SecretChat.create_secret_conversation(user, other_user.id)
      {:ok, _} = SecretChat.set_self_destruct_timer(convo, user.id, 300)

      response =
        conn
        |> put(~p"/api/v1/secret-chats/#{convo.id}/timer", %{seconds: nil})
        |> json_response(200)

      assert response["secret_chat"]["self_destruct_seconds"] == nil
    end

    test "returns 422 for invalid timer value", %{
      authed_conn: conn,
      user: user,
      other_user: other_user
    } do
      {:ok, convo} = SecretChat.create_secret_conversation(user, other_user.id)

      conn
      |> put(~p"/api/v1/secret-chats/#{convo.id}/timer", %{seconds: 42})
      |> json_response(422)
    end

    test "returns 404 for nonexistent conversation", %{authed_conn: conn} do
      conn
      |> put(~p"/api/v1/secret-chats/#{Ecto.UUID.generate()}/timer", %{seconds: 60})
      |> json_response(404)
    end
  end
end
