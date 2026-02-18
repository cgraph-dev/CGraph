defmodule CGraph.WebRTC.RoomTest do
  use ExUnit.Case, async: true

  alias CGraph.WebRTC.Room
  alias CGraph.WebRTC.Participant

  @now DateTime.utc_now()

  defp build_room(attrs \\ %{}) do
    Map.merge(
      %Room{
        id: "room_123",
        type: :video,
        creator_id: "user_1",
        state: :waiting,
        max_participants: 10,
        participants: %{},
        created_at: @now
      },
      attrs
    )
  end

  defp build_participant(id, attrs \\ %{}) do
    Map.merge(
      %Participant{
        id: id,
        device: "desktop",
        media: %{audio: true, video: true, muted: false},
        state: :connected,
        joined_at: @now
      },
      attrs
    )
  end

  describe "active?/1" do
    test "returns true for active rooms" do
      room = build_room(%{state: :active})
      assert Room.active?(room)
    end

    test "returns false for waiting rooms" do
      room = build_room(%{state: :waiting})
      refute Room.active?(room)
    end

    test "returns false for ended rooms" do
      room = build_room(%{state: :ended})
      refute Room.active?(room)
    end
  end

  describe "full?/1" do
    test "returns false when under capacity" do
      room = build_room(%{max_participants: 10, participants: %{}})
      refute Room.full?(room)
    end

    test "returns true when at capacity" do
      participants =
        1..10
        |> Enum.map(fn i -> {"user_#{i}", build_participant("user_#{i}")} end)
        |> Map.new()

      room = build_room(%{max_participants: 10, participants: participants})
      assert Room.full?(room)
    end

    test "returns true when over capacity" do
      participants =
        1..11
        |> Enum.map(fn i -> {"user_#{i}", build_participant("user_#{i}")} end)
        |> Map.new()

      room = build_room(%{max_participants: 10, participants: participants})
      assert Room.full?(room)
    end

    test "returns true for room with max_participants of 1" do
      room = build_room(%{
        max_participants: 1,
        participants: %{"user_1" => build_participant("user_1")}
      })

      assert Room.full?(room)
    end
  end

  describe "participant_count/1" do
    test "returns 0 for empty room" do
      room = build_room()
      assert Room.participant_count(room) == 0
    end

    test "returns correct count with participants" do
      participants =
        1..3
        |> Enum.map(fn i -> {"user_#{i}", build_participant("user_#{i}")} end)
        |> Map.new()

      room = build_room(%{participants: participants})
      assert Room.participant_count(room) == 3
    end
  end

  describe "duration/1" do
    test "returns 0 when started_at is nil" do
      room = build_room(%{started_at: nil})
      assert Room.duration(room) == 0
    end

    test "returns elapsed seconds for active call (ended_at nil)" do
      started = DateTime.add(DateTime.utc_now(), -120, :second)
      room = build_room(%{started_at: started, ended_at: nil})
      duration = Room.duration(room)
      # Should be approximately 120 seconds (allow some tolerance)
      assert duration >= 119 and duration <= 125
    end

    test "returns exact duration for ended call" do
      started = ~U[2024-01-15 10:00:00Z]
      ended = ~U[2024-01-15 10:05:30Z]
      room = build_room(%{started_at: started, ended_at: ended})
      assert Room.duration(room) == 330
    end

    test "returns 0 for zero-length call" do
      time = ~U[2024-01-15 10:00:00Z]
      room = build_room(%{started_at: time, ended_at: time})
      assert Room.duration(room) == 0
    end
  end

  describe "to_map/1" do
    test "serializes room to map" do
      now = DateTime.utc_now()
      room = build_room(%{
        id: "room_abc",
        type: :video,
        creator_id: "creator_1",
        state: :active,
        group_id: "group_1",
        created_at: now,
        started_at: now,
        participants: %{
          "user_1" => build_participant("user_1", %{media: %{audio: true, video: false}, state: :connected})
        }
      })

      map = Room.to_map(room)

      assert map.id == "room_abc"
      assert map.type == :video
      assert map.creator_id == "creator_1"
      assert map.state == :active
      assert map.group_id == "group_1"
      assert map.participant_count == 1
      assert is_list(map.participants)
      assert length(map.participants) == 1
      assert is_binary(map.created_at)
      assert is_binary(map.started_at)
    end

    test "handles nil timestamps" do
      room = build_room(%{created_at: nil, started_at: nil})
      map = Room.to_map(room)

      assert is_nil(map.created_at)
      assert is_nil(map.started_at)
    end

    test "includes duration in serialized map" do
      started = ~U[2024-01-15 10:00:00Z]
      ended = ~U[2024-01-15 10:02:00Z]
      room = build_room(%{started_at: started, ended_at: ended})
      map = Room.to_map(room)

      assert map.duration == 120
    end
  end

  describe "struct defaults" do
    test "has sensible defaults" do
      room = %Room{}

      assert room.participants == %{}
      assert room.state == :waiting
      assert room.max_participants == 10
      assert is_nil(room.id)
      assert is_nil(room.type)
      assert is_nil(room.creator_id)
    end
  end
end
