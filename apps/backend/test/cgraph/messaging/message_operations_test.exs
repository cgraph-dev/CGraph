defmodule CGraph.Messaging.MessageOperationsTest do
  @moduledoc "Tests for MessageOperations edit history"
  use CGraph.DataCase, async: true

  alias CGraph.Messaging.MessageOperations
  alias CGraph.Messaging.MessageEdit
  alias CGraph.Repo

  import CgraphWeb.UserFixtures
  import CgraphWeb.MessagingFixtures

  describe "edit_message/3" do
    setup do
      sender = user_fixture()
      other = user_fixture()
      %{conversation: conversation} = conversation_fixture(sender, other)
      message = message_fixture(conversation, sender, %{content: "original"})
      %{message: message, sender: sender, other: other}
    end

    test "creates MessageEdit record with previous content", %{message: message, sender: sender} do
      assert {:ok, updated} = MessageOperations.edit_message(message.id, sender.id, "edited v1")

      edits = Repo.all(from me in MessageEdit, where: me.message_id == ^message.id)
      assert length(edits) == 1

      [edit] = edits
      assert edit.previous_content == "original"
      assert edit.edit_number == 1
      assert edit.edited_by_id == sender.id
      assert edit.message_id == message.id
    end

    test "increments edit_number on subsequent edits", %{message: message, sender: sender} do
      assert {:ok, _} = MessageOperations.edit_message(message.id, sender.id, "edited v1")
      assert {:ok, _} = MessageOperations.edit_message(message.id, sender.id, "edited v2")

      edits =
        from(me in MessageEdit,
          where: me.message_id == ^message.id,
          order_by: [asc: me.edit_number]
        )
        |> Repo.all()

      assert length(edits) == 2

      [first, second] = edits
      assert first.previous_content == "original"
      assert first.edit_number == 1
      assert second.previous_content == "edited v1"
      assert second.edit_number == 2
    end

    test "returns message with is_edited true", %{message: message, sender: sender} do
      assert {:ok, updated} = MessageOperations.edit_message(message.id, sender.id, "edited v1")
      assert updated.is_edited == true
    end

    test "returns message with edits preloaded", %{message: message, sender: sender} do
      assert {:ok, updated} = MessageOperations.edit_message(message.id, sender.id, "edited v1")
      assert is_list(updated.edits)
      assert length(updated.edits) == 1
    end

    test "returns :unauthorized when non-sender edits", %{message: message, other: other} do
      assert {:error, :unauthorized} = MessageOperations.edit_message(message.id, other.id, "nope")
    end

    test "returns :not_found for missing message", %{sender: sender} do
      assert {:error, :not_found} = MessageOperations.edit_message(Ecto.UUID.generate(), sender.id, "nope")
    end
  end

  describe "delete_message/2" do
    setup do
      sender = user_fixture()
      other = user_fixture()
      %{conversation: conversation} = conversation_fixture(sender, other)
      message = message_fixture(conversation, sender, %{content: "to delete"})
      %{message: message, sender: sender, other: other}
    end

    test "sender can delete own message", %{message: message, sender: sender} do
      assert {:ok, deleted} = MessageOperations.delete_message(message.id, sender.id)
      assert deleted.deleted_at != nil
    end

    test "non-sender cannot delete message", %{message: message, other: other} do
      assert {:error, :unauthorized} = MessageOperations.delete_message(message.id, other.id)
    end

    test "returns :not_found for missing message", %{sender: sender} do
      assert {:error, :not_found} = MessageOperations.delete_message(Ecto.UUID.generate(), sender.id)
    end
  end

  describe "pin_message/2 and unpin_message/2" do
    setup do
      user = user_fixture()
      other = user_fixture()
      %{conversation: conversation} = conversation_fixture(user, other)
      message = message_fixture(conversation, user, %{content: "pin this"})
      %{message: message, user: user}
    end

    test "pins a message", %{message: message, user: user} do
      assert {:ok, pinned} = MessageOperations.pin_message(message.id, user.id)
      assert pinned.is_pinned == true
      assert pinned.pinned_at != nil
      assert pinned.pinned_by_id == user.id
    end

    test "unpins a message", %{message: message, user: user} do
      {:ok, _} = MessageOperations.pin_message(message.id, user.id)
      assert {:ok, unpinned} = MessageOperations.unpin_message(message.id, user.id)
      assert unpinned.is_pinned == false
      assert unpinned.pinned_at == nil
    end
  end

  describe "mark_message_read/2" do
    setup do
      sender = user_fixture()
      reader = user_fixture()
      %{conversation: conversation} = conversation_fixture(sender, reader)
      message = message_fixture(conversation, sender, %{content: "read me"})
      %{message: message, reader: reader, sender: sender, conversation: conversation}
    end

    test "creates a read receipt", %{message: message, reader: reader} do
      assert {:ok, receipt} = MessageOperations.mark_message_read(message.id, reader.id)
      assert receipt.user_id == reader.id
      assert receipt.message_id == message.id
      assert receipt.read_at != nil
    end

    test "is idempotent — second call returns existing receipt", %{message: message, reader: reader} do
      {:ok, first} = MessageOperations.mark_message_read(message.id, reader.id)
      {:ok, second} = MessageOperations.mark_message_read(message.id, reader.id)
      assert first.id == second.id
    end

    test "returns :not_found for missing message", %{reader: reader} do
      assert {:error, :not_found} = MessageOperations.mark_message_read(Ecto.UUID.generate(), reader.id)
    end
  end

  describe "get_unread_count/2" do
    setup do
      sender = user_fixture()
      reader = user_fixture()
      %{conversation: conversation} = conversation_fixture(sender, reader)
      %{sender: sender, reader: reader, conversation: conversation}
    end

    test "returns 0 when no unread messages", %{reader: reader, conversation: conversation} do
      assert MessageOperations.get_unread_count(reader, conversation) == 0
    end

    test "counts unread messages from other user", %{sender: sender, reader: reader, conversation: conversation} do
      _m1 = message_fixture(conversation, sender, %{content: "msg 1"})
      _m2 = message_fixture(conversation, sender, %{content: "msg 2"})
      _m3 = message_fixture(conversation, sender, %{content: "msg 3"})

      assert MessageOperations.get_unread_count(reader, conversation) == 3
    end

    test "does not count own messages as unread", %{reader: reader, conversation: conversation} do
      _own = message_fixture(conversation, reader, %{content: "my own"})

      assert MessageOperations.get_unread_count(reader, conversation) == 0
    end

    test "decreases after marking read", %{sender: sender, reader: reader, conversation: conversation} do
      m1 = message_fixture(conversation, sender, %{content: "msg 1"})
      _m2 = message_fixture(conversation, sender, %{content: "msg 2"})

      assert MessageOperations.get_unread_count(reader, conversation) == 2

      MessageOperations.mark_message_read(m1.id, reader.id)
      assert MessageOperations.get_unread_count(reader, conversation) == 1
    end
  end
end
