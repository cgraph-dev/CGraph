defmodule CGraph.Messaging.ChatPollTest do
  use CGraph.DataCase, async: true

  alias CGraph.Messaging.ChatPoll

  import CgraphWeb.UserFixtures
  import CgraphWeb.MessagingFixtures

  setup do
    user = user_fixture()
    voter = user_fixture()
    %{conversation: conversation} = conversation_fixture(user, voter)

    options = [
      %{"text" => "Option A"},
      %{"text" => "Option B"},
      %{"text" => "Option C"}
    ]

    %{user: user, voter: voter, conversation: conversation, options: options}
  end

  describe "create_poll/5" do
    test "creates poll with valid options", %{user: user, conversation: conv, options: opts} do
      assert {:ok, poll} = ChatPoll.create_poll(user.id, conv.id, "Favourite?", opts)

      assert poll.question == "Favourite?"
      assert length(poll.options) == 3
      assert Enum.all?(poll.options, &Map.has_key?(&1, "id"))
      assert poll.closed == false
    end

    test "rejects 1 option (min 2)", %{user: user, conversation: conv} do
      assert {:error, %Ecto.Changeset{}} =
        ChatPoll.create_poll(user.id, conv.id, "Bad poll", [%{"text" => "Only one"}])
    end

    test "rejects 11 options (max 10)", %{user: user, conversation: conv} do
      opts = Enum.map(1..11, &%{"text" => "Option #{&1}"})

      assert {:error, %Ecto.Changeset{}} =
        ChatPoll.create_poll(user.id, conv.id, "Too many", opts)
    end

    test "rejects non-member", %{conversation: conv, options: opts} do
      outsider = user_fixture()

      assert {:error, :not_member} =
        ChatPoll.create_poll(outsider.id, conv.id, "Q?", opts)
    end
  end

  describe "vote/3" do
    test "records a vote on an open poll", %{user: user, voter: voter, conversation: conv, options: opts} do
      {:ok, poll} = ChatPoll.create_poll(user.id, conv.id, "Pick one", opts)
      option_id = hd(poll.options)["id"]

      assert {:ok, results} = ChatPoll.vote(poll.id, voter.id, option_id)
      assert results.total == 1
      assert Map.get(results.tallies, option_id) == 1
    end

    test "single choice replaces existing vote", %{user: user, voter: voter, conversation: conv, options: opts} do
      {:ok, poll} = ChatPoll.create_poll(user.id, conv.id, "Pick one", opts)
      [opt_a, opt_b | _] = poll.options

      {:ok, _} = ChatPoll.vote(poll.id, voter.id, opt_a["id"])
      {:ok, results} = ChatPoll.vote(poll.id, voter.id, opt_b["id"])

      assert results.total == 1
      assert Map.get(results.tallies, opt_b["id"]) == 1
      assert Map.get(results.tallies, opt_a["id"], 0) == 0
    end

    test "multiple choice allows multiple votes", %{user: user, voter: voter, conversation: conv, options: opts} do
      {:ok, poll} = ChatPoll.create_poll(user.id, conv.id, "Pick many", opts,
        multiple_choice: true)
      [opt_a, opt_b | _] = poll.options

      {:ok, _} = ChatPoll.vote(poll.id, voter.id, opt_a["id"])
      {:ok, results} = ChatPoll.vote(poll.id, voter.id, opt_b["id"])

      assert results.total == 2
    end

    test "rejects vote on closed poll", %{user: user, voter: voter, conversation: conv, options: opts} do
      {:ok, poll} = ChatPoll.create_poll(user.id, conv.id, "Q?", opts)
      {:ok, _} = ChatPoll.close_poll(poll.id, user.id)

      assert {:error, :poll_closed} = ChatPoll.vote(poll.id, voter.id, hd(poll.options)["id"])
    end

    test "rejects invalid option_id", %{user: user, voter: voter, conversation: conv, options: opts} do
      {:ok, poll} = ChatPoll.create_poll(user.id, conv.id, "Q?", opts)

      assert {:error, :invalid_option} = ChatPoll.vote(poll.id, voter.id, "nonexistent")
    end
  end

  describe "retract_vote/3" do
    test "removes a vote", %{user: user, voter: voter, conversation: conv, options: opts} do
      {:ok, poll} = ChatPoll.create_poll(user.id, conv.id, "Q?", opts)
      option_id = hd(poll.options)["id"]
      {:ok, _} = ChatPoll.vote(poll.id, voter.id, option_id)

      assert :ok = ChatPoll.retract_vote(poll.id, voter.id, option_id)

      results = ChatPoll.get_poll_results(poll.id)
      assert results.total == 0
    end
  end

  describe "close_poll/2" do
    test "creator can close", %{user: user, conversation: conv, options: opts} do
      {:ok, poll} = ChatPoll.create_poll(user.id, conv.id, "Q?", opts)

      assert {:ok, closed} = ChatPoll.close_poll(poll.id, user.id)
      assert closed.closed == true
    end

    test "non-creator cannot close", %{user: user, voter: voter, conversation: conv, options: opts} do
      {:ok, poll} = ChatPoll.create_poll(user.id, conv.id, "Q?", opts)

      assert {:error, :unauthorized} = ChatPoll.close_poll(poll.id, voter.id)
    end

    test "already closed returns error", %{user: user, conversation: conv, options: opts} do
      {:ok, poll} = ChatPoll.create_poll(user.id, conv.id, "Q?", opts)
      {:ok, _} = ChatPoll.close_poll(poll.id, user.id)

      assert {:error, :already_closed} = ChatPoll.close_poll(poll.id, user.id)
    end
  end
end
