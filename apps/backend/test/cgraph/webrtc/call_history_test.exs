defmodule CGraph.WebRTC.CallHistoryTest do
  use Cgraph.DataCase, async: true

  alias CGraph.WebRTC.CallHistory

  import CGraph.Factory

  describe "changeset/2" do
    test "valid changeset with required fields" do
      attrs = %{
        room_id: "room_123",
        type: "video",
        state: "ended"
      }

      changeset = CallHistory.changeset(%CallHistory{}, attrs)
      assert changeset.valid?
    end

    test "valid changeset with all fields" do
      user = insert(:user)
      now = DateTime.utc_now() |> DateTime.truncate(:microsecond)

      attrs = %{
        room_id: "room_456",
        type: "audio",
        state: "ended",
        creator_id: user.id,
        participant_ids: [user.id],
        max_participants: 2,
        started_at: DateTime.add(now, -300, :second),
        ended_at: now,
        duration_seconds: 300
      }

      changeset = CallHistory.changeset(%CallHistory{}, attrs)
      assert changeset.valid?
    end

    test "invalid without room_id" do
      attrs = %{type: "video", state: "ended"}
      changeset = CallHistory.changeset(%CallHistory{}, attrs)
      refute changeset.valid?
      assert "can't be blank" in errors_on(changeset).room_id
    end

    test "uses default type when not provided" do
      attrs = %{room_id: "room_123", state: "ended"}
      changeset = CallHistory.changeset(%CallHistory{}, attrs)
      # type defaults to "audio" from schema, so changeset is valid
      assert changeset.valid?
    end

    test "uses default state when not provided" do
      attrs = %{room_id: "room_123", type: "video"}
      changeset = CallHistory.changeset(%CallHistory{}, attrs)
      # state defaults to "ended" from schema, so changeset is valid
      assert changeset.valid?
    end

    test "validates type inclusion" do
      valid_types = ~w(audio video screen_share)

      for type <- valid_types do
        changeset = CallHistory.changeset(%CallHistory{}, %{
          room_id: "room_123",
          type: type,
          state: "ended"
        })
        assert changeset.valid?, "Expected type '#{type}' to be valid"
      end
    end

    test "rejects invalid type" do
      changeset = CallHistory.changeset(%CallHistory{}, %{
        room_id: "room_123",
        type: "hologram",
        state: "ended"
      })
      refute changeset.valid?
      assert "is invalid" in errors_on(changeset).type
    end

    test "validates state inclusion" do
      valid_states = ~w(waiting active ended)

      for state <- valid_states do
        changeset = CallHistory.changeset(%CallHistory{}, %{
          room_id: "room_123",
          type: "audio",
          state: state
        })
        assert changeset.valid?, "Expected state '#{state}' to be valid"
      end
    end

    test "rejects invalid state" do
      changeset = CallHistory.changeset(%CallHistory{}, %{
        room_id: "room_123",
        type: "video",
        state: "paused"
      })
      refute changeset.valid?
      assert "is invalid" in errors_on(changeset).state
    end

    test "defaults type to audio" do
      call = %CallHistory{}
      assert call.type == "audio"
    end

    test "defaults state to ended" do
      call = %CallHistory{}
      assert call.state == "ended"
    end

    test "defaults participant_ids to empty list" do
      call = %CallHistory{}
      assert call.participant_ids == []
    end

    test "defaults max_participants to 0" do
      call = %CallHistory{}
      assert call.max_participants == 0
    end

    test "DB insert with valid data" do
      user = insert(:user)

      {:ok, call} =
        %CallHistory{}
        |> CallHistory.changeset(%{
          room_id: "room_db_test",
          type: "video",
          state: "ended",
          creator_id: user.id,
          participant_ids: [user.id],
          max_participants: 2,
          duration_seconds: 120
        })
        |> CGraph.Repo.insert()

      assert call.id != nil
      assert call.room_id == "room_db_test"
      assert call.type == "video"
      assert call.creator_id == user.id
    end
  end
end
