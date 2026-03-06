defmodule CGraph.Integration.ChatFeaturesTest do
  @moduledoc """
  Cross-feature integration tests verifying that Phase 26 features
  work together correctly.
  """
  use CGraph.DataCase, async: true

  alias CGraph.Messaging
  alias CGraph.Messaging.{ChatPoll, ChatTheme, ScheduledMessage, MessageTranslation}

  import CgraphWeb.UserFixtures
  import CgraphWeb.MessagingFixtures

  setup do
    user = user_fixture()
    other = user_fixture()
    %{conversation: conv} = conversation_fixture(user, other)
    %{user: user, other: other, conversation: conv}
  end

  describe "poll lifecycle in conversation" do
    test "create → vote → retract → close", %{user: user, other: other, conversation: conv} do
      # Create poll
      opts = [%{"text" => "Yes"}, %{"text" => "No"}, %{"text" => "Maybe"}]
      {:ok, poll} = ChatPoll.create_poll(user.id, conv.id, "Ship it?", opts)
      assert poll.question == "Ship it?"
      assert length(poll.options) == 3

      # Both users vote
      yes_id = Enum.find(poll.options, &(&1["text"] == "Yes"))["id"]
      no_id = Enum.find(poll.options, &(&1["text"] == "No"))["id"]

      {:ok, results} = ChatPoll.vote(poll.id, user.id, yes_id)
      assert results.total == 1

      {:ok, results} = ChatPoll.vote(poll.id, other.id, no_id)
      assert results.total == 2

      # Retract vote
      :ok = ChatPoll.retract_vote(poll.id, other.id, no_id)
      results = ChatPoll.get_poll_results(poll.id)
      assert results.total == 1

      # Close poll
      {:ok, closed} = ChatPoll.close_poll(poll.id, user.id)
      assert closed.closed == true

      # Can't vote on closed poll
      assert {:error, :poll_closed} = ChatPoll.vote(poll.id, other.id, yes_id)
    end
  end

  describe "theme lifecycle" do
    test "set → get → update → delete", %{user: user, conversation: conv} do
      theme = %{"bg_color" => "#1a1a2e", "bubble_color" => "#16213e", "text_color" => "#e0e0e0"}

      # Set
      {:ok, ct} = ChatTheme.set_theme(user.id, conv.id, theme)
      assert ct.theme == theme

      # Get
      retrieved = ChatTheme.get_theme(user.id, conv.id)
      assert retrieved.id == ct.id

      # Update (upsert)
      new_theme = %{"bg_color" => "#0a192f", "bubble_color" => "#112240", "text_color" => "#8892b0"}
      {:ok, updated} = ChatTheme.set_theme(user.id, conv.id, new_theme)
      assert updated.id == ct.id
      assert updated.theme == new_theme

      # Delete
      :ok = ChatTheme.delete_theme(user.id, conv.id)
      assert ChatTheme.get_theme(user.id, conv.id) == nil
    end

    test "preset themes available" do
      presets = ChatTheme.list_preset_themes()
      assert map_size(presets) == 10

      for name <- ~w(midnight ocean forest sunset lavender minimal dark light neon pastel) do
        assert Map.has_key?(presets, name),
          "Missing preset: #{name}"
      end
    end
  end

  describe "message translation" do
    test "NoOp adapter passes through text" do
      {:ok, result} = MessageTranslation.translate("Hello world", "es")
      assert result == "Hello world"
    end

    test "rejects unsupported language" do
      assert {:error, :unsupported_language} = MessageTranslation.translate("Hello", "klingon")
    end

    test "lists 20 supported languages" do
      langs = MessageTranslation.supported_languages()
      assert length(langs) == 20
      assert "en" in langs
      assert "es" in langs
      assert "ja" in langs
    end
  end

  describe "scheduled message + Oban delivery" do
    test "schedule creates record and enqueues job", %{user: user, conversation: conv} do
      scheduled_at = DateTime.utc_now() |> DateTime.add(3600, :second) |> DateTime.truncate(:second)

      # The Oban inline mode means the job executes immediately
      # and the status changes from pending to sent
      {:ok, msg} = ScheduledMessage.schedule_message(
        user.id, conv.id, "Future hello", scheduled_at
      )

      # Verify it was created (Oban inline may have already sent it)
      assert msg.content == "Future hello"
      assert msg.sender_id == user.id

      # Re-fetch to see if Oban changed status
      refreshed = CGraph.Repo.get(ScheduledMessage, msg.id)
      assert refreshed.status in ["pending", "sent"]
    end
  end

  describe "message operations with conversation" do
    test "create message and check it exists", %{user: user, conversation: conv} do
      {:ok, msg} = Messaging.create_message(user, conv, %{content: "Integration test msg"})
      assert msg.content == "Integration test msg"
      assert msg.sender_id == user.id
      assert msg.conversation_id == conv.id
    end

    test "forward message between conversations", %{user: user, other: _other, conversation: conv} do
      # Create another conversation
      third = user_fixture()
      %{conversation: conv2} = conversation_fixture(user, third)

      {:ok, msg} = Messaging.create_message(user, conv, %{content: "Forward me"})

      result = Messaging.forward_message(user, msg.id, [conv2.id])
      assert match?({:ok, _}, result) or match?([{:ok, _}], result)
    end
  end
end
