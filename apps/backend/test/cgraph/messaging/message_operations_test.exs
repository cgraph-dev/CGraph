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
end
