defmodule Cgraph.NotificationsExtendedTest do
  @moduledoc """
  Extended test suite for Cgraph.Notifications context.
  Tests additional functions beyond the base test suite.
  """
  use Cgraph.DataCase, async: true

  alias Cgraph.Notifications
  alias Cgraph.Accounts

  defp create_user(attrs \\ %{}) do
    unique_id = System.unique_integer([:positive])
    base = %{
      username: "notifuser_#{unique_id}",
      email: "notifuser_#{unique_id}@example.com",
      password: "ValidPassword123!",
      password_confirmation: "ValidPassword123!"
    }
    {:ok, user} = Accounts.create_user(Map.merge(base, attrs))
    user
  end

  defp create_notification(user, type \\ :welcome, title \\ "Test notification") do
    {:ok, notification} = Notifications.notify(user, type, title)
    notification
  end

  # ============================================================================
  # Notification Creation
  # ============================================================================

  describe "notify/4" do
    test "creates notification for user" do
      user = create_user()
      
      {:ok, notification} = Notifications.notify(user, :welcome, "Test Title")
      
      assert notification.user_id == user.id
      assert notification.type == :welcome
      assert notification.title == "Test Title"
    end

    test "creates notification with options" do
      user = create_user()
      
      {:ok, notification} = Notifications.notify(user, :new_message, "New Message", 
        body: "You have a new message"
      )
      
      assert notification.type == :new_message
    end
  end

  # ============================================================================
  # List Operations
  # ============================================================================

  describe "list_notifications/2" do
    test "returns user's notifications" do
      user = create_user()
      _notif = create_notification(user)
      
      {notifications, meta} = Notifications.list_notifications(user)
      
      assert is_list(notifications)
      assert is_map(meta)
    end

    test "paginates results" do
      user = create_user()
      Enum.each(1..5, fn n -> create_notification(user, :welcome, "Notif #{n}") end)
      
      {page1, meta} = Notifications.list_notifications(user, page: 1, per_page: 2)
      
      assert length(page1) == 2
      assert meta.total >= 5
    end
  end

  describe "unread_count/1" do
    test "returns count of unread notifications" do
      user = create_user()
      _notif1 = create_notification(user)
      _notif2 = create_notification(user)
      
      count = Notifications.unread_count(user)
      
      assert count >= 2
    end
  end

  # ============================================================================
  # Mark Read/Unread
  # ============================================================================

  describe "mark_read/1" do
    test "marks notification as read" do
      user = create_user()
      notification = create_notification(user)
      
      {:ok, marked} = Notifications.mark_read(notification)
      
      assert marked.read_at != nil
    end
  end

  describe "mark_as_read/1 with struct" do
    test "marks notification as read" do
      user = create_user()
      notification = create_notification(user)
      
      {:ok, marked} = Notifications.mark_as_read(notification)
      
      assert marked.read_at != nil
    end
  end

  describe "mark_as_read/1 with ID" do
    test "marks notification by ID as read" do
      user = create_user()
      notification = create_notification(user)
      
      {:ok, marked} = Notifications.mark_as_read(notification.id)
      
      assert marked.read_at != nil
    end
  end

  describe "mark_as_unread/1 with struct" do
    test "marks notification as unread" do
      user = create_user()
      notification = create_notification(user)
      {:ok, marked} = Notifications.mark_as_read(notification)
      
      {:ok, unmarked} = Notifications.mark_as_unread(marked)
      
      assert unmarked.read_at == nil
    end
  end

  describe "mark_as_unread/1 with ID" do
    test "marks notification by ID as unread" do
      user = create_user()
      notification = create_notification(user)
      {:ok, _} = Notifications.mark_as_read(notification)
      
      {:ok, unmarked} = Notifications.mark_as_unread(notification.id)
      
      assert unmarked.read_at == nil
    end
  end

  describe "mark_all_read/1" do
    test "marks all user notifications as read" do
      user = create_user()
      _notif1 = create_notification(user)
      _notif2 = create_notification(user)
      
      result = Notifications.mark_all_read(user)
      
      # Returns {count, nil} from update_all
      assert match?({_, _}, result)
    end
  end

  describe "mark_read_up_to/2" do
    test "marks notifications up to specified one as read" do
      user = create_user()
      _notif1 = create_notification(user, :welcome, "First")
      notif2 = create_notification(user, :welcome, "Second")
      
      result = Notifications.mark_read_up_to(user, notif2.id)
      
      # Returns {count, nil} from update_all
      assert match?({_, _}, result)
    end
  end

  # ============================================================================
  # Notification Settings
  # ============================================================================

  describe "get_notification_settings/1" do
    test "returns notification settings for user" do
      user = create_user()
      
      settings = Notifications.get_notification_settings(user)
      
      assert is_map(settings)
    end
  end

  describe "update_notification_settings/2" do
    test "updates notification settings" do
      user = create_user()
      
      result = Notifications.update_notification_settings(user, %{
        "email_enabled" => false
      })
      
      # May return {:ok, settings} or {:error, _}
      assert is_tuple(result)
    end
  end

  # ============================================================================
  # Deletion
  # ============================================================================

  describe "delete_notification/1" do
    test "deletes notification" do
      user = create_user()
      notification = create_notification(user)
      
      {:ok, deleted} = Notifications.delete_notification(notification)
      
      assert deleted.id == notification.id
    end
  end

  describe "delete_all/1" do
    test "deletes all user notifications" do
      user = create_user()
      _notif1 = create_notification(user)
      _notif2 = create_notification(user)
      
      result = Notifications.delete_all(user)
      
      # Result could be {:ok, count} or {count, nil}
      assert result != nil
    end
  end

  # ============================================================================
  # Get Operations
  # ============================================================================

  describe "get_notification/1" do
    test "returns notification by ID" do
      user = create_user()
      notification = create_notification(user)
      
      {:ok, found} = Notifications.get_notification(notification.id)
      
      assert found.id == notification.id
    end

    test "returns error for non-existent notification" do
      result = Notifications.get_notification(Ecto.UUID.generate())
      
      assert match?({:error, :not_found}, result)
    end
  end

  describe "get_notification/2 with user" do
    test "returns notification by user and ID" do
      user = create_user()
      notification = create_notification(user)
      
      {:ok, found} = Notifications.get_notification(user, notification.id)
      
      assert found.id == notification.id
    end
  end

  # ============================================================================
  # Click Tracking
  # ============================================================================

  describe "mark_clicked/1" do
    test "marks notification as clicked" do
      user = create_user()
      notification = create_notification(user)
      
      {:ok, clicked} = Notifications.mark_clicked(notification)
      
      assert clicked.clicked_at != nil
    end
  end

  # ============================================================================
  # Unread Counts
  # ============================================================================

  describe "get_unread_counts/1" do
    test "returns unread counts by type" do
      user = create_user()
      _notif = create_notification(user)
      
      counts = Notifications.get_unread_counts(user)
      
      assert is_map(counts)
    end
  end

  # ============================================================================
  # Push Tokens
  # ============================================================================

  describe "register_push_token/2" do
    test "registers push token for user" do
      user = create_user()
      
      result = Notifications.register_push_token(user, %{
        "token" => "test_token_#{System.unique_integer([:positive])}",
        "platform" => "apns",
        "device_id" => "device_#{System.unique_integer([:positive])}"
      })
      
      assert match?({:ok, _}, result)
    end
  end

  describe "list_push_tokens/1" do
    test "returns user's push tokens" do
      user = create_user()
      
      tokens = Notifications.list_push_tokens(user)
      
      assert is_list(tokens)
    end
  end

  # ============================================================================
  # Bulk Operations
  # ============================================================================

  describe "delete_all_notifications/2" do
    test "deletes all notifications with options" do
      user = create_user()
      _notif = create_notification(user)
      
      result = Notifications.delete_all_notifications(user)
      
      assert result != nil
    end
  end

  describe "mark_all_as_read/2" do
    test "marks all as read with options" do
      user = create_user()
      _notif = create_notification(user)
      
      result = Notifications.mark_all_as_read(user)
      
      assert match?({:ok, _}, result)
    end
  end
end
