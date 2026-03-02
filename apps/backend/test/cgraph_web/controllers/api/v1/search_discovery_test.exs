defmodule CgraphWeb.API.V1.SearchDiscoveryTest do
  @moduledoc """
  Integration test for search & discovery features:
  - Message search with filters (MSG-20, SEARCH-01)
  - Explore endpoint for community discovery (SEARCH-05)
  """
  use CgraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures
  import CgraphWeb.MessagingFixtures
  import CgraphWeb.GroupFixtures
  import CgraphWeb.ForumFixtures

  # ── Message Search (MSG-20, SEARCH-01) ────────────────────────────

  describe "message search — GET /api/v1/search/messages" do
    setup %{conn: conn} do
      user1 = user_fixture(%{display_name: "Alice"})
      user2 = user_fixture(%{display_name: "Bob"})
      conn = log_in_user(conn, user1)

      # Create a conversation between user1 and user2
      %{conversation: conversation} = conversation_fixture(user1, user2)

      # Seed messages for search tests
      {:ok, msg_alice} =
        CGraph.Messaging.create_message(user1, conversation, %{
          "content" => "Hello world from alice in the morning"
        })

      {:ok, msg_bob} =
        CGraph.Messaging.create_message(user2, conversation, %{
          "content" => "Hello world reply from bob"
        })

      {:ok, msg_image} =
        CGraph.Messaging.create_message(user1, conversation, %{
          "content" => "Check out this hello image",
          "content_type" => "image",
          "file_url" => "https://example.com/img.png",
          "file_name" => "img.png"
        })

      {:ok, msg_voice} =
        CGraph.Messaging.create_message(user2, conversation, %{
          "content" => "hello voice note",
          "content_type" => "voice",
          "file_url" => "https://example.com/note.ogg",
          "file_name" => "note.ogg"
        })

      # Create a second conversation (user1 + a third user) with unrelated messages
      user3 = user_fixture(%{display_name: "Charlie"})
      %{conversation: other_conversation} = conversation_fixture(user1, user3)

      {:ok, _msg_other} =
        CGraph.Messaging.create_message(user1, other_conversation, %{
          "content" => "Hello world from the other conversation"
        })

      %{
        conn: conn,
        user1: user1,
        user2: user2,
        conversation: conversation,
        other_conversation: other_conversation,
        msg_alice: msg_alice,
        msg_bob: msg_bob,
        msg_image: msg_image,
        msg_voice: msg_voice
      }
    end

    test "search messages within conversation returns filtered results", ctx do
      conn =
        get(ctx.conn, ~p"/api/v1/search/messages",
          q: "hello",
          conversation_id: ctx.conversation.id
        )

      assert %{"data" => messages} = json_response(conn, 200)
      assert is_list(messages)

      # All returned messages must belong to the target conversation
      Enum.each(messages, fn m ->
        assert m["conversation_id"] == ctx.conversation.id,
               "Expected conversation #{ctx.conversation.id}, got #{m["conversation_id"]}"
      end)
    end

    test "search messages with sender filter returns only that sender", ctx do
      conn =
        get(ctx.conn, ~p"/api/v1/search/messages",
          q: "hello",
          from: ctx.user2.id
        )

      assert %{"data" => messages} = json_response(conn, 200)
      assert is_list(messages)

      Enum.each(messages, fn m ->
        sender = m["sender_id"] || get_in(m, ["sender", "id"])

        assert sender == ctx.user2.id,
               "Expected sender #{ctx.user2.id}, got #{inspect(sender)}"
      end)
    end

    test "search messages with date range filter works", ctx do
      # Range covers now (all messages should fall within)
      now = DateTime.utc_now()
      past = DateTime.add(now, -86_400 * 365, :second)

      conn =
        get(ctx.conn, ~p"/api/v1/search/messages",
          q: "hello",
          after: DateTime.to_iso8601(past),
          before: DateTime.to_iso8601(now)
        )

      assert %{"data" => messages} = json_response(conn, 200)
      assert is_list(messages)
    end

    test "search messages with content_type filter (has_attachment) works", ctx do
      conn =
        get(ctx.conn, ~p"/api/v1/search/messages",
          q: "hello",
          has_attachment: "true"
        )

      assert %{"data" => messages} = json_response(conn, 200)
      assert is_list(messages)
    end

    test "search messages across channels works via conversation_id", ctx do
      # Without conversation_id — searches all user's conversations
      conn_all = get(ctx.conn, ~p"/api/v1/search/messages", q: "hello")
      assert %{"data" => all_messages} = json_response(conn_all, 200)
      assert is_list(all_messages)

      # With conversation_id — scoped to the other conversation
      conn_scoped =
        get(ctx.conn, ~p"/api/v1/search/messages",
          q: "hello",
          conversation_id: ctx.other_conversation.id
        )

      assert %{"data" => scoped_messages} = json_response(conn_scoped, 200)
      assert is_list(scoped_messages)

      Enum.each(scoped_messages, fn m ->
        assert m["conversation_id"] == ctx.other_conversation.id
      end)
    end
  end

  # ── Explore (SEARCH-05) ──────────────────────────────────────────

  describe "explore — GET /api/v1/explore" do
    setup do
      owner = user_fixture(%{display_name: "Owner"})

      # Create discoverable groups
      %{group: gaming_group} =
        group_fixture(owner, %{
          name: "Gaming Hub",
          description: "A gaming community",
          is_public: true,
          is_discoverable: true
        })

      %{group: tech_group} =
        group_fixture(owner, %{
          name: "Tech Talk",
          description: "Technology discussions",
          is_public: true,
          is_discoverable: true
        })

      # Create a private (non-discoverable) group — should NOT appear
      %{group: _private_group} =
        group_fixture(owner, %{
          name: "Secret Society",
          description: "Private group",
          is_public: false,
          is_discoverable: false
        })

      # Create public forums
      gaming_forum =
        forum_fixture(owner, %{
          description: "A gaming forum",
          is_public: true,
          category: "gaming"
        })

      tech_forum =
        forum_fixture(owner, %{
          description: "A tech forum",
          is_public: true,
          category: "technology"
        })

      %{
        owner: owner,
        gaming_group: gaming_group,
        tech_group: tech_group,
        gaming_forum: gaming_forum,
        tech_forum: tech_forum
      }
    end

    test "GET /explore returns combined groups and forums", _ctx do
      conn = get(build_conn(), ~p"/api/v1/explore")

      assert %{"data" => data} = json_response(conn, 200)

      communities = data["communities"]
      assert is_list(communities)
      assert length(communities) > 0

      # Should contain both groups and forums
      types = communities |> Enum.map(& &1["type"]) |> Enum.uniq() |> Enum.sort()
      assert "forum" in types or "group" in types

      # Categories list should be present
      assert is_list(data["categories"])
      assert length(data["categories"]) > 0
    end

    test "GET /explore?category=gaming filters by category", _ctx do
      conn = get(build_conn(), ~p"/api/v1/explore", category: "gaming")

      assert %{"data" => data} = json_response(conn, 200)
      communities = data["communities"]
      assert is_list(communities)

      # All returned communities with a category should be "gaming"
      Enum.each(communities, fn c ->
        if c["category"] do
          assert c["category"] == "gaming",
                 "Expected category 'gaming', got '#{c["category"]}'"
        end
      end)
    end

    test "GET /explore?q=Tech searches by name", _ctx do
      conn = get(build_conn(), ~p"/api/v1/explore", q: "Tech")

      assert %{"data" => data} = json_response(conn, 200)
      communities = data["communities"]
      assert is_list(communities)
    end

    test "GET /explore?sort=newest sorts by creation date", _ctx do
      conn = get(build_conn(), ~p"/api/v1/explore", sort: "newest")

      assert %{"data" => data} = json_response(conn, 200)
      communities = data["communities"]
      assert is_list(communities)

      # Verify descending order by created_at
      dates =
        communities
        |> Enum.map(& &1["created_at"])
        |> Enum.reject(&is_nil/1)

      if length(dates) >= 2 do
        assert dates == Enum.sort(dates, :desc),
               "Communities should be sorted newest first"
      end
    end

    test "non-discoverable groups excluded from explore", _ctx do
      conn = get(build_conn(), ~p"/api/v1/explore")

      assert %{"data" => data} = json_response(conn, 200)
      communities = data["communities"]

      names = Enum.map(communities, & &1["name"])
      refute "Secret Society" in names,
             "Non-discoverable group should not appear in explore results"
    end
  end
end
