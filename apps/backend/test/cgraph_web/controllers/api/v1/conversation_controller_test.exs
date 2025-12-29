defmodule CgraphWeb.API.V1.ConversationControllerTest do
  use CgraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures
  import CgraphWeb.MessagingFixtures

  describe "GET /api/v1/conversations (unauthenticated)" do
    test "returns 401 without authentication", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/conversations")
      assert json_response(conn, 401)
    end
  end

  describe "GET /api/v1/conversations (authenticated)" do
    setup %{conn: conn} do
      user = user_fixture()
      other_user = user_fixture()
      conn = log_in_user(conn, user)
      
      # Create a conversation
      %{conversation: conversation} = conversation_fixture(user, other_user)
      
      %{conn: conn, user: user, other_user: other_user, conversation: conversation}
    end

    test "lists user's conversations", %{conn: conn, conversation: conversation} do
      conn = get(conn, ~p"/api/v1/conversations")
      
      assert %{"data" => conversations} = json_response(conn, 200)
      assert is_list(conversations)
      assert length(conversations) >= 1
      
      ids = Enum.map(conversations, & &1["id"])
      assert conversation.id in ids
    end

    test "returns conversations with pagination", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/conversations", %{page: 1, per_page: 10})
      
      assert %{
        "data" => _conversations,
        "meta" => %{
          "page" => 1,
          "per_page" => 10
        }
      } = json_response(conn, 200)
    end
  end

  describe "GET /api/v1/conversations/:id" do
    setup %{conn: conn} do
      user = user_fixture()
      other_user = user_fixture()
      %{conversation: conversation} = conversation_fixture(user, other_user)
      conn = log_in_user(conn, user)
      
      %{conn: conn, user: user, conversation: conversation}
    end

    test "returns conversation details", %{conn: conn, conversation: conversation} do
      conn = get(conn, ~p"/api/v1/conversations/#{conversation.id}")
      
      assert %{
        "data" => %{
          "id" => id,
          "participants" => participants
        }
      } = json_response(conn, 200)
      
      assert id == conversation.id
      assert is_list(participants)
      assert length(participants) == 2
    end

    test "returns 404 for non-existent conversation", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/conversations/#{Ecto.UUID.generate()}")
      assert json_response(conn, 404)
    end

    test "returns 403 for conversation user is not part of", %{conn: conn} do
      # Create a conversation between two other users
      other1 = user_fixture()
      other2 = user_fixture()
      %{conversation: other_conversation} = conversation_fixture(other1, other2)
      
      conn = get(conn, ~p"/api/v1/conversations/#{other_conversation.id}")
      assert json_response(conn, 403)
    end
  end

  describe "POST /api/v1/conversations" do
    setup %{conn: conn} do
      user = user_fixture()
      other_user = user_fixture()
      conn = log_in_user(conn, user)
      
      %{conn: conn, user: user, other_user: other_user}
    end

    test "creates new conversation", %{conn: conn, other_user: other_user} do
      conn = post(conn, ~p"/api/v1/conversations", %{
        participant_ids: [other_user.id]
      })
      
      assert %{
        "data" => %{
          "id" => id,
          "participants" => participants
        }
      } = json_response(conn, 201)
      
      assert is_binary(id)
      assert length(participants) == 2
    end

    test "returns existing conversation if one exists", %{conn: conn, user: user, other_user: other_user} do
      # Create first conversation
      %{conversation: existing} = conversation_fixture(user, other_user)
      
      # Try to create another with same participants
      conn = post(conn, ~p"/api/v1/conversations", %{
        participant_ids: [other_user.id]
      })
      
      assert %{"data" => %{"id" => id}} = json_response(conn, 200)
      assert id == existing.id
    end

    @tag :skip
    test "creates group conversation with multiple participants", %{conn: conn, other_user: other_user} do
      # NOTE: Group conversations require schema updates to support
      # Currently only 1:1 DM conversations are implemented
      third_user = user_fixture()
      
      conn = post(conn, ~p"/api/v1/conversations", %{
        participant_ids: [other_user.id, third_user.id],
        name: "Group Chat"
      })
      
      assert %{
        "data" => %{
          "participants" => participants,
          "name" => "Group Chat"
        }
      } = json_response(conn, 201)
      
      assert length(participants) == 3
    end
  end
end
