defmodule CGraph.Messaging.DeliveryTrackingTest do
  @moduledoc "Delivery tracking tests — Triple-check marks"
  use CGraph.DataCase, async: true

  alias CGraph.Messaging.DeliveryTracking

  import CgraphWeb.UserFixtures
  import CgraphWeb.MessagingFixtures

  describe "track_sent/2" do
    test "creates delivery receipts for all recipients" do
      sender = user_fixture()
      recipients = Enum.map(1..3, fn _ -> user_fixture() end)
      %{conversation: conversation} = conversation_fixture(sender, List.first(recipients))
      message = message_fixture(conversation, sender, %{content: "Hello"})

      recipient_ids = Enum.map(recipients, & &1.id)
      assert {:ok, count} = DeliveryTracking.track_sent(message, recipient_ids)
      assert count == 3
    end

    test "handles empty recipient list" do
      sender = user_fixture()
      other = user_fixture()
      %{conversation: conversation} = conversation_fixture(sender, other)
      message = message_fixture(conversation, sender, %{content: "Hello"})

      assert {:ok, 0} = DeliveryTracking.track_sent(message, [])
    end
  end

  describe "mark_delivered/2" do
    test "updates status from sent to delivered" do
      sender = user_fixture()
      recipient = user_fixture()
      %{conversation: conversation} = conversation_fixture(sender, recipient)
      message = message_fixture(conversation, sender, %{content: "Check marks"})

      # track_sent is called automatically by message_fixture via create_message
      # No need to call it again

      result = DeliveryTracking.mark_delivered(message.id, recipient.id)
      assert match?({:ok, _}, result)
    end

    test "returns not_found for untracked message" do
      assert {:error, :not_found} = DeliveryTracking.mark_delivered(
        Ecto.UUID.generate(),
        Ecto.UUID.generate()
      )
    end
  end

  describe "mark_failed/3" do
    test "marks delivery as failed with reason" do
      sender = user_fixture()
      recipient = user_fixture()
      %{conversation: conversation} = conversation_fixture(sender, recipient)
      message = message_fixture(conversation, sender, %{content: "Will fail"})

      # track_sent is called automatically by message_fixture via create_message

      result = DeliveryTracking.mark_failed(message.id, recipient.id, "push_service_unavailable")
      assert match?({:ok, _}, result)
    end
  end

  describe "get_delivery_status/1" do
    test "returns status map for all recipients" do
      sender = user_fixture()
      r1 = user_fixture()
      r2 = user_fixture()
      %{conversation: conversation} = conversation_fixture(sender, r1)
      message = message_fixture(conversation, sender, %{content: "Status check"})

      DeliveryTracking.track_sent(message, [r1.id, r2.id])
      DeliveryTracking.mark_delivered(message.id, r1.id, %{platform: "android"})

      statuses = DeliveryTracking.get_delivery_status(message.id)
      assert map_size(statuses) == 2
      assert statuses[r1.id].status == :delivered
      assert statuses[r2.id].status == :sent
    end
  end

  describe "get_pending_deliveries/1" do
    test "returns undelivered messages for a recipient" do
      sender = user_fixture()
      recipient = user_fixture()
      %{conversation: conversation} = conversation_fixture(sender, recipient)

      # Send 3 messages — track_sent is called automatically by create_message
      msg1 = message_fixture(conversation, sender, %{content: "Msg 1"})
      _msg2 = message_fixture(conversation, sender, %{content: "Msg 2"})
      _msg3 = message_fixture(conversation, sender, %{content: "Msg 3"})

      # Deliver one
      DeliveryTracking.mark_delivered(msg1.id, recipient.id)

      pending = DeliveryTracking.get_pending_deliveries(recipient.id)
      assert length(pending) == 2
    end
  end

  describe "pending_count/1" do
    test "counts undelivered messages" do
      sender = user_fixture()
      recipient = user_fixture()
      %{conversation: conversation} = conversation_fixture(sender, recipient)

      msg1 = message_fixture(conversation, sender, %{content: "Count 1"})
      _msg2 = message_fixture(conversation, sender, %{content: "Count 2"})

      assert DeliveryTracking.pending_count(recipient.id) == 2

      DeliveryTracking.mark_delivered(msg1.id, recipient.id)

      assert DeliveryTracking.pending_count(recipient.id) == 1
    end
  end
end
