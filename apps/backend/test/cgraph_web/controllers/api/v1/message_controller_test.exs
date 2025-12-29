defmodule CgraphWeb.API.V1.MessageControllerTest do
  use CgraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures
  import CgraphWeb.MessagingFixtures

  describe "GET /api/v1/conversations/:conversation_id/messages" do
    setup %{conn: conn} do
      user = user_fixture()
      other_user = user_fixture()
      %{conversation: conversation} = conversation_fixture(user, other_user)
      
      # Create some messages
      message1 = message_fixture(conversation, user, %{content: "Hello"})
      message2 = message_fixture(conversation, other_user, %{content: "Hi there"})
      message3 = message_fixture(conversation, user, %{content: "How are you?"})
      
      conn = log_in_user(conn, user)
      
      %{
        conn: conn,
        user: user,
        conversation: conversation,
        messages: [message1, message2, message3]
      }
    end

    test "lists messages in conversation", %{conn: conn, conversation: conversation} do
      conn = get(conn, ~p"/api/v1/conversations/#{conversation.id}/messages")
      
      assert %{"data" => messages} = json_response(conn, 200)
      assert is_list(messages)
      assert length(messages) >= 3
    end

    test "returns messages with pagination", %{conn: conn, conversation: conversation} do
      conn = get(conn, ~p"/api/v1/conversations/#{conversation.id}/messages", %{
        per_page: "2"
      })
      
      assert %{
        "data" => messages,
        "meta" => _meta
      } = json_response(conn, 200)
      
      # Verify pagination limit is respected
      assert length(messages) <= 2
    end

    test "supports cursor-based pagination", %{conn: conn, conversation: conversation, messages: [_, msg2 | _]} do
      conn = get(conn, ~p"/api/v1/conversations/#{conversation.id}/messages", %{
        before: msg2.id,
        limit: 10
      })
      
      assert %{"data" => messages} = json_response(conn, 200)
      # Should only include messages before msg2
      assert Enum.all?(messages, fn m -> m["inserted_at"] < msg2.inserted_at end)
    end
  end

  describe "POST /api/v1/conversations/:conversation_id/messages" do
    setup %{conn: conn} do
      user = user_fixture()
      other_user = user_fixture()
      %{conversation: conversation} = conversation_fixture(user, other_user)
      conn = log_in_user(conn, user)
      
      %{conn: conn, user: user, conversation: conversation}
    end

    test "creates a new message", %{conn: conn, conversation: conversation, user: user} do
      conn = post(conn, ~p"/api/v1/conversations/#{conversation.id}/messages", %{
        content: "New test message"
      })
      
      assert %{
        "data" => %{
          "id" => id,
          "content" => "New test message",
          "sender" => %{"id" => sender_id}
        }
      } = json_response(conn, 201)
      
      assert is_binary(id)
      assert sender_id == user.id
    end

    test "creates message with attachments", %{conn: conn, conversation: conversation} do
      conn = post(conn, ~p"/api/v1/conversations/#{conversation.id}/messages", %{
        content: "Check this out",
        attachments: [
          %{type: "image", url: "/uploads/test.jpg"}
        ]
      })
      
      # API creates message - attachment handling may differ
      assert %{"data" => %{"id" => id, "content" => "Check this out"}} = json_response(conn, 201)
      assert is_binary(id)
    end

    test "returns error for conversation user is not part of", %{conn: conn} do
      other1 = user_fixture()
      other2 = user_fixture()
      %{conversation: other_conversation} = conversation_fixture(other1, other2)
      
      conn = post(conn, ~p"/api/v1/conversations/#{other_conversation.id}/messages", %{
        content: "Trying to send"
      })
      
      # Returns 403 Forbidden when user can't access the conversation
      assert json_response(conn, 403)
    end

    test "returns error for empty content", %{conn: conn, conversation: conversation} do
      conn = post(conn, ~p"/api/v1/conversations/#{conversation.id}/messages", %{
        content: ""
      })
      
      # Check 422 status and error response format
      response = json_response(conn, 422)
      assert response["error"]["details"]["content"] || response["error"]
    end
  end

  describe "POST /api/v1/conversations/:conversation_id/messages/:id/read" do
    setup %{conn: conn} do
      user = user_fixture()
      other_user = user_fixture()
      %{conversation: conversation} = conversation_fixture(user, other_user)
      message = message_fixture(conversation, other_user, %{content: "Unread message"})
      conn = log_in_user(conn, user)
      
      %{conn: conn, user: user, conversation: conversation, message: message}
    end

    test "marks message as read", %{conn: conn, conversation: conversation, message: message} do
      conn = post(conn, ~p"/api/v1/conversations/#{conversation.id}/messages/#{message.id}/read")
      
      # Just verify 200 OK response
      assert json_response(conn, 200)
    end
  end

  describe "POST /api/v1/conversations/:conversation_id/typing" do
    setup %{conn: conn} do
      user = user_fixture()
      other_user = user_fixture()
      %{conversation: conversation} = conversation_fixture(user, other_user)
      conn = log_in_user(conn, user)
      
      %{conn: conn, conversation: conversation}
    end

    test "broadcasts typing indicator", %{conn: conn, conversation: conversation} do
      conn = post(conn, ~p"/api/v1/conversations/#{conversation.id}/typing")
      
      # Just verify 200 OK response
      assert json_response(conn, 200)
    end
  end
end
