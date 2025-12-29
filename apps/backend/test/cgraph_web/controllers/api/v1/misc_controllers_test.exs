defmodule CgraphWeb.API.V1.NotificationControllerTest do
  use CgraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  describe "GET /api/v1/notifications" do
    setup %{conn: conn} do
      user = user_fixture()
      
      # Create some notifications with valid type (must be a valid Ecto.Enum value)
      {:ok, _} = Cgraph.Notifications.notify(user, :new_message, "Test notification 1")
      {:ok, _} = Cgraph.Notifications.notify(user, :new_message, "Test notification 2")
      
      conn = log_in_user(conn, user)
      
      %{conn: conn, user: user}
    end

    test "lists user's notifications", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/notifications")
      
      assert %{"data" => notifications} = json_response(conn, 200)
      assert is_list(notifications)
    end

    test "supports pagination", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/notifications", %{page: 1, per_page: 10})
      
      assert %{
        "data" => _notifications,
        "meta" => %{"page" => 1}
      } = json_response(conn, 200)
    end

    test "filters by unread", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/notifications", %{unread: true})
      
      assert %{"data" => notifications} = json_response(conn, 200)
      assert Enum.all?(notifications, fn n -> n["read_at"] == nil end)
    end
  end

  describe "POST /api/v1/notifications/:id/read" do
    setup %{conn: conn} do
      user = user_fixture()
      {:ok, notification} = Cgraph.Notifications.notify(user, :new_message, "Test notification")
      conn = log_in_user(conn, user)
      
      %{conn: conn, notification: notification}
    end

    test "marks notification as read", %{conn: conn, notification: notification} do
      conn = post(conn, ~p"/api/v1/notifications/#{notification.id}/read")
      
      assert %{"data" => %{"read_at" => read_at}} = json_response(conn, 200)
      assert read_at != nil
    end
  end

  describe "POST /api/v1/notifications/read" do
    setup %{conn: conn} do
      user = user_fixture()
      {:ok, _} = Cgraph.Notifications.notify(user, :new_message, "Notification 1")
      {:ok, _} = Cgraph.Notifications.notify(user, :new_message, "Notification 2")
      conn = log_in_user(conn, user)
      
      %{conn: conn, user: user}
    end

    test "marks all notifications as read", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/notifications/read")
      
      assert %{"data" => %{"marked_count" => count}} = json_response(conn, 200)
      assert count >= 2
    end
  end
end

defmodule CgraphWeb.API.V1.SearchControllerTest do
  use CgraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures
  import CgraphWeb.ForumFixtures

  describe "GET /api/v1/search/users" do
    setup %{conn: conn} do
      user = user_fixture()
      _searchable_user = user_fixture(%{username: "searchable_user", display_name: "Searchable User"})
      conn = log_in_user(conn, user)
      
      %{conn: conn}
    end

    test "searches users by username", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/search/users", %{q: "searchable"})
      
      assert %{"data" => users} = json_response(conn, 200)
      assert is_list(users)
      assert length(users) >= 1
    end

    test "returns error for short query", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/search/users", %{q: "a"})
      assert json_response(conn, 400)
    end
  end

  describe "GET /api/v1/search/posts" do
    setup %{conn: conn} do
      user = user_fixture()
      forum = forum_fixture()
      %{post: _post} = post_fixture(forum, user, %{title: "Searchable Post Title"})
      conn = log_in_user(conn, user)
      
      %{conn: conn}
    end

    test "searches posts by title", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/search/posts", %{q: "Searchable"})
      
      assert %{"data" => posts} = json_response(conn, 200)
      assert is_list(posts)
    end

    test "filters by forum", %{conn: conn} do
      forum = forum_fixture()
      conn = get(conn, ~p"/api/v1/search/posts", %{q: "test", forum_id: forum.id})
      
      assert %{"data" => _posts} = json_response(conn, 200)
    end
  end

  describe "GET /api/v1/search/messages" do
    setup %{conn: conn} do
      user = user_fixture()
      other_user = user_fixture()
      %{conversation: conversation} = CgraphWeb.MessagingFixtures.conversation_fixture(user, other_user)
      _message = CgraphWeb.MessagingFixtures.message_fixture(conversation, user, %{content: "Searchable message content"})
      conn = log_in_user(conn, user)
      
      %{conn: conn, conversation: conversation}
    end

    test "searches messages in user's conversations", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/search/messages", %{q: "Searchable"})
      
      assert %{"data" => messages} = json_response(conn, 200)
      assert is_list(messages)
    end

    test "filters by conversation", %{conn: conn, conversation: conversation} do
      conn = get(conn, ~p"/api/v1/search/messages", %{q: "message", conversation_id: conversation.id})
      
      assert %{"data" => _messages} = json_response(conn, 200)
    end
  end
end

defmodule CgraphWeb.API.V1.UploadControllerTest do
  use CgraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  describe "POST /api/v1/upload" do
    setup %{conn: conn} do
      user = user_fixture()
      conn = log_in_user(conn, user)
      %{conn: conn, user: user}
    end

    test "uploads a file", %{conn: conn} do
      upload = %Plug.Upload{
        path: "/tmp/test.txt",
        filename: "test.txt",
        content_type: "text/plain"
      }
      
      # Create a temp file
      File.write!("/tmp/test.txt", "test content")
      
      conn = post(conn, ~p"/api/v1/upload", %{file: upload})
      
      assert %{
        "data" => %{
          "url" => url,
          "filename" => _filename
        }
      } = json_response(conn, 201)
      
      assert is_binary(url)
      
      # Cleanup
      File.rm("/tmp/test.txt")
    end

    test "returns error for missing file", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/upload", %{})
      assert json_response(conn, 422)
    end
  end

  describe "GET /api/v1/files/:id" do
    setup %{conn: conn} do
      user = user_fixture()
      
      # Create a temporary test file
      temp_dir = System.tmp_dir!()
      test_file_path = Path.join(temp_dir, "test_upload_#{System.unique_integer([:positive])}.txt")
      File.write!(test_file_path, "Test file content for upload")
      
      # Create a file record using the temp file
      {:ok, file} = Cgraph.Uploads.store_file(user, %{
        path: test_file_path,
        filename: "test.txt",
        content_type: "text/plain"
      })
      
      # Cleanup temp file
      File.rm(test_file_path)
      
      conn = log_in_user(conn, user)
      %{conn: conn, uploaded_file: file}
    end

    test "returns file metadata", %{conn: conn, uploaded_file: file} do
      conn = get(conn, ~p"/api/v1/files/#{file.id}")
      
      assert %{
        "data" => %{
          "id" => id,
          "url" => _url
        }
      } = json_response(conn, 200)
      
      assert id == file.id
    end
  end
end

defmodule CgraphWeb.API.V1.PushTokenControllerTest do
  use CgraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  describe "POST /api/v1/push-tokens" do
    setup %{conn: conn} do
      user = user_fixture()
      conn = log_in_user(conn, user)
      %{conn: conn, user: user}
    end

    test "registers a push token", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/push-tokens", %{
        "token" => "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
        "platform" => "ios"  # Valid platforms: ios, android, web
      })
      
      assert %{
        "data" => %{
          "registered" => true
        }
      } = json_response(conn, 201)
    end

    test "returns error for missing token", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/push-tokens", %{"platform" => "ios"})
      # Accept either 400 or 422 for validation errors
      assert conn.status in [400, 422]
    end
  end

  describe "DELETE /api/v1/push-tokens/:token" do
    setup %{conn: conn} do
      user = user_fixture()
      token = "ExponentPushToken[test-token]"
      {:ok, _} = Cgraph.Accounts.register_push_token(user, token, "ios")
      conn = log_in_user(conn, user)
      
      %{conn: conn, token: token}
    end

    test "removes a push token", %{conn: conn, token: token} do
      conn = delete(conn, ~p"/api/v1/push-tokens/#{token}")
      assert response(conn, 204)
    end
  end
end

defmodule CgraphWeb.API.V1.SettingsControllerTest do
  use CgraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  describe "GET /api/v1/settings" do
    setup %{conn: conn} do
      user = user_fixture()
      conn = log_in_user(conn, user)
      %{conn: conn, user: user}
    end

    test "returns user settings", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/settings")
      
      assert %{
        "data" => settings
      } = json_response(conn, 200)
      
      assert is_map(settings)
    end
  end

  describe "PUT /api/v1/settings" do
    setup %{conn: conn} do
      user = user_fixture()
      conn = log_in_user(conn, user)
      %{conn: conn, user: user}
    end

    test "updates user settings", %{conn: conn} do
      conn = put(conn, ~p"/api/v1/settings", %{
        theme: "dark",
        language: "es"
      })
      
      assert %{
        "data" => %{
          "appearance" => %{"theme" => "dark"},
          "locale" => %{"language" => "es"}
        }
      } = json_response(conn, 200)
    end
  end

  describe "PUT /api/v1/settings/notifications" do
    setup %{conn: conn} do
      user = user_fixture()
      conn = log_in_user(conn, user)
      %{conn: conn}
    end

    test "updates notification settings", %{conn: conn} do
      conn = put(conn, ~p"/api/v1/settings/notifications", %{
        email_notifications: false,
        push_notifications: true,
        message_notifications: true
      })
      
      assert json_response(conn, 200)["data"]
    end
  end

  describe "PUT /api/v1/settings/privacy" do
    setup %{conn: conn} do
      user = user_fixture()
      conn = log_in_user(conn, user)
      %{conn: conn}
    end

    test "updates privacy settings", %{conn: conn} do
      conn = put(conn, ~p"/api/v1/settings/privacy", %{
        show_online_status: false,
        allow_friend_requests: true
      })
      
      assert json_response(conn, 200)["data"]
    end
  end
end

defmodule CgraphWeb.API.V1.ReactionControllerTest do
  use CgraphWeb.ConnCase, async: false

  import CgraphWeb.UserFixtures
  import CgraphWeb.MessagingFixtures

  describe "POST /api/v1/messages/:id/reactions" do
    setup %{conn: conn} do
      user = user_fixture()
      other_user = user_fixture()
      %{conversation: conversation} = conversation_fixture(user, other_user)
      message = message_fixture(conversation, other_user)
      conn = log_in_user(conn, user)
      
      %{conn: conn, message: message}
    end

    test "adds reaction to message", %{conn: conn, message: message} do
      conn = post(conn, ~p"/api/v1/messages/#{message.id}/reactions", %{
        emoji: "👍"
      })
      
      assert %{
        "data" => %{
          "emoji" => "👍"
        }
      } = json_response(conn, 201)
    end
  end

  describe "DELETE /api/v1/messages/:id/reactions/:emoji" do
    setup %{conn: conn} do
      user = user_fixture()
      other_user = user_fixture()
      %{conversation: conversation} = conversation_fixture(user, other_user)
      message = message_fixture(conversation, other_user)
      
      # Debug: Check if message exists in DB
      IO.puts("DEBUG: Message ID = #{message.id}")
      db_message = Cgraph.Repo.get(Cgraph.Messaging.Message, message.id)
      IO.puts("DEBUG: Message in DB = #{inspect(db_message)}")
      
      conn = log_in_user(conn, user)
      
      # Add reaction via API - verify it succeeds
      add_conn = post(conn, ~p"/api/v1/messages/#{message.id}/reactions", %{"emoji" => "👍"})
      IO.puts("DEBUG: Add reaction status = #{add_conn.status}")
      IO.puts("DEBUG: Add reaction body = #{add_conn.resp_body}")
      
      %{conn: conn, message: message}
    end

    test "removes reaction from message", %{conn: conn, message: message} do
      conn = delete(conn, ~p"/api/v1/messages/#{message.id}/reactions/👍")
      assert response(conn, 204)
    end
  end
end
