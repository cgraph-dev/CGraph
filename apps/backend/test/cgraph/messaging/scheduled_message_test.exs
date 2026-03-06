defmodule CGraph.Messaging.ScheduledMessageTest do
  use CGraph.DataCase, async: true
  use Oban.Testing, repo: CGraph.Repo

  alias CGraph.Messaging.ScheduledMessage

  import CgraphWeb.UserFixtures
  import CgraphWeb.MessagingFixtures

  setup do
    user = user_fixture()
    other = user_fixture()
    %{conversation: conversation} = conversation_fixture(user, other)
    %{user: user, other: other, conversation: conversation}
  end

  describe "schedule_message/5" do
    test "creates scheduled message with valid future time", %{user: user, conversation: conv} do
      scheduled_at = DateTime.utc_now() |> DateTime.add(3600, :second) |> DateTime.truncate(:second)

      assert {:ok, msg} = ScheduledMessage.schedule_message(
        user.id, conv.id, "Hello from the future", scheduled_at
      )

      assert msg.content == "Hello from the future"
      assert msg.status == "pending"
      assert msg.sender_id == user.id
      assert msg.conversation_id == conv.id
    end

    test "rejects past time", %{user: user, conversation: conv} do
      past = DateTime.utc_now() |> DateTime.add(-3600, :second) |> DateTime.truncate(:second)

      assert {:error, %Ecto.Changeset{}} =
        ScheduledMessage.schedule_message(user.id, conv.id, "Too late", past)
    end

    test "rejects time more than 7 days ahead", %{user: user, conversation: conv} do
      far_future = DateTime.utc_now() |> DateTime.add(8 * 86_400, :second) |> DateTime.truncate(:second)

      assert {:error, %Ecto.Changeset{}} =
        ScheduledMessage.schedule_message(user.id, conv.id, "Too far", far_future)
    end

    test "rejects non-member", %{conversation: conv} do
      outsider = user_fixture()
      scheduled_at = DateTime.utc_now() |> DateTime.add(3600, :second) |> DateTime.truncate(:second)

      assert {:error, :not_member} =
        ScheduledMessage.schedule_message(outsider.id, conv.id, "Hi", scheduled_at)
    end
  end

  describe "cancel/2" do
    test "cancels pending message", %{user: user, conversation: conv} do
      # Insert directly to bypass Oban inline execution which would change status to "sent"
      scheduled_at = DateTime.utc_now() |> DateTime.add(3600, :second) |> DateTime.truncate(:second)

      {:ok, msg} =
        %ScheduledMessage{}
        |> ScheduledMessage.changeset(%{
          sender_id: user.id,
          conversation_id: conv.id,
          content: "Cancel me",
          scheduled_at: scheduled_at
        })
        |> CGraph.Repo.insert()

      assert {:ok, cancelled} = ScheduledMessage.cancel(msg.id, user.id)
      assert cancelled.status == "cancelled"
      assert cancelled.cancelled_at
    end

    test "rejects cancel by non-sender", %{user: user, other: other, conversation: conv} do
      scheduled_at = DateTime.utc_now() |> DateTime.add(3600, :second) |> DateTime.truncate(:second)

      {:ok, msg} =
        %ScheduledMessage{}
        |> ScheduledMessage.changeset(%{
          sender_id: user.id,
          conversation_id: conv.id,
          content: "Mine",
          scheduled_at: scheduled_at
        })
        |> CGraph.Repo.insert()

      assert {:error, :unauthorized} = ScheduledMessage.cancel(msg.id, other.id)
    end
  end

  describe "list_pending/2" do
    test "lists pending messages for user in conversation", %{user: user, conversation: conv} do
      scheduled_at = DateTime.utc_now() |> DateTime.add(3600, :second) |> DateTime.truncate(:second)

      for {content, offset} <- [{"First", 0}, {"Second", 60}] do
        %ScheduledMessage{}
        |> ScheduledMessage.changeset(%{
          sender_id: user.id,
          conversation_id: conv.id,
          content: content,
          scheduled_at: DateTime.add(scheduled_at, offset, :second)
        })
        |> CGraph.Repo.insert!()
      end

      messages = ScheduledMessage.list_pending(user.id, conv.id)
      assert length(messages) == 2
      assert hd(messages).content == "First"
    end
  end
end
