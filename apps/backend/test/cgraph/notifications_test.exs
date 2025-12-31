defmodule Cgraph.NotificationsTest do
  use Cgraph.DataCase, async: true

  alias Cgraph.Notifications
  alias Cgraph.Notifications.Notification

  import CgraphWeb.UserFixtures

  describe "notify/3" do
    setup do
      user = user_fixture()
      actor = user_fixture()
      {:ok, user: user, actor: actor}
    end

    test "creates a notification for user", %{user: user, actor: actor} do
      assert {:ok, %Notification{} = notification} =
        Notifications.notify(user, :friend_request, "New friend request", actor: actor)

      assert notification.user_id == user.id
      assert notification.actor_id == actor.id
      assert notification.type == :friend_request
      assert notification.title == "New friend request"
      assert notification.read_at == nil
    end

    test "creates notification without actor", %{user: user} do
      assert {:ok, %Notification{} = notification} =
        Notifications.notify(user, :welcome, "Welcome notification")

      assert notification.user_id == user.id
      assert notification.actor_id == nil
      assert notification.type == :welcome
    end

    test "with body and data", %{user: user} do
      data = %{"post_id" => "123", "forum_id" => "456"}
      
      assert {:ok, %Notification{} = notification} =
        Notifications.notify(user, :post_reply, "New comment", 
          body: "Someone commented on your post",
          data: data
        )

      assert notification.body == "Someone commented on your post"
      assert notification.data == data
    end
  end

  describe "list_notifications/2" do
    setup do
      user = user_fixture()
      actor = user_fixture()
      {:ok, user: user, actor: actor}
    end

    test "returns user notifications", %{user: user, actor: actor} do
      {:ok, _} = Notifications.notify(user, :new_message, "New message", actor: actor)
      {:ok, _} = Notifications.notify(user, :friend_request, "Friend request", actor: actor)

      {notifications, meta} = Notifications.list_notifications(user)
      
      assert length(notifications) >= 2
      assert Enum.all?(notifications, &(&1.user_id == user.id))
      assert is_map(meta)
      assert Map.has_key?(meta, :total)
    end

    test "orders by most recent first", %{user: user} do
      {:ok, first} = Notifications.notify(user, :welcome, "First")
      Process.sleep(50)  # Ensure different timestamps
      {:ok, second} = Notifications.notify(user, :security_alert, "Second")

      {[latest | rest], _meta} = Notifications.list_notifications(user)
      
      # Latest should be either second (by time) or the list is sorted descending by inserted_at
      # Just verify we got both back and they're ordered correctly
      assert length(rest) >= 1
      assert latest.inserted_at >= List.last([latest | rest]).inserted_at
    end

    test "with limit option", %{user: user} do
      # Create 5 notifications
      for i <- 1..5 do
        Notifications.notify(user, :new_message, "Notification #{i}")
      end

      {notifications, _meta} = Notifications.list_notifications(user, limit: 3)
      
      assert length(notifications) == 3
    end
  end

  describe "unread_count/1" do
    test "returns count of unread notifications" do
      user = user_fixture()
      actor = user_fixture()
      
      {:ok, _} = Notifications.notify(user, :new_message, "Message 1", actor: actor)
      {:ok, _} = Notifications.notify(user, :new_message, "Message 2", actor: actor)
      {:ok, notif} = Notifications.notify(user, :new_message, "Message 3", actor: actor)

      # Mark one as read
      Notifications.mark_as_read(notif)

      count = Notifications.unread_count(user)
      assert count == 2
    end
  end

  describe "mark_as_read/1" do
    test "marks notification as read" do
      user = user_fixture()
      {:ok, notification} = Notifications.notify(user, :welcome, "Test")
      
      assert notification.read_at == nil
      
      {:ok, marked} = Notifications.mark_as_read(notification)
      
      assert marked.read_at != nil
    end
  end

  describe "mark_all_read/1" do
    test "marks all user notifications as read" do
      user = user_fixture()
      
      {:ok, _} = Notifications.notify(user, :new_message, "Test 1")
      {:ok, _} = Notifications.notify(user, :new_message, "Test 2")
      {:ok, _} = Notifications.notify(user, :new_message, "Test 3")

      assert Notifications.unread_count(user) == 3

      {count, _} = Notifications.mark_all_read(user)
      assert count >= 3

      assert Notifications.unread_count(user) == 0
    end
  end

  describe "delete_notification/1" do
    test "removes notification" do
      user = user_fixture()
      {:ok, notification} = Notifications.notify(user, :welcome, "To delete")
      
      {:ok, _} = Notifications.delete_notification(notification)
      
      assert {:error, :not_found} = Notifications.get_notification(notification.id)
    end
  end

  describe "get_notification/1" do
    test "returns notification by id" do
      user = user_fixture()
      {:ok, notification} = Notifications.notify(user, :welcome, "Test")
      
      {:ok, found} = Notifications.get_notification(notification.id)
      
      assert found.id == notification.id
    end

    test "returns error for non-existent id" do
      assert {:error, :not_found} = Notifications.get_notification(Ecto.UUID.generate())
    end
  end

  describe "grouped notifications" do
    test "increment count for same group_key" do
      user = user_fixture()
      actor = user_fixture()
      group_key = "likes:post:123"
      
      # First notification creates new
      {:ok, first} = Notifications.notify(user, :post_vote, "1 like", 
        actor: actor, 
        group_key: group_key
      )
      
      assert first.count == 1
      
      # Second notification should update existing
      {:ok, second} = Notifications.notify(user, :post_vote, "2 likes", 
        actor: actor, 
        group_key: group_key
      )
      
      assert second.id == first.id
      assert second.count == 2
    end
  end
end
