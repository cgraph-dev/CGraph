defmodule CGraph.WebRTC.ParticipantTest do
  use ExUnit.Case, async: true

  alias CGraph.WebRTC.Participant

  @now DateTime.utc_now()

  defp build_participant(attrs \\ %{}) do
    Map.merge(
      %Participant{
        id: "user_123",
        device: "desktop",
        media: %{audio: true, video: true, muted: false},
        state: :connecting,
        joined_at: @now
      },
      attrs
    )
  end

  describe "connected?/1" do
    test "returns true for connected state" do
      p = build_participant(%{state: :connected})
      assert Participant.connected?(p)
    end

    test "returns true for reconnecting state" do
      p = build_participant(%{state: :reconnecting})
      assert Participant.connected?(p)
    end

    test "returns false for connecting state" do
      p = build_participant(%{state: :connecting})
      refute Participant.connected?(p)
    end

    test "returns false for disconnected state" do
      p = build_participant(%{state: :disconnected})
      refute Participant.connected?(p)
    end
  end

  describe "has_video?/1" do
    test "returns true when video is enabled" do
      p = build_participant(%{media: %{audio: true, video: true}})
      assert Participant.has_video?(p)
    end

    test "returns false when video is disabled" do
      p = build_participant(%{media: %{audio: true, video: false}})
      refute Participant.has_video?(p)
    end

    test "returns false when video key is missing" do
      p = build_participant(%{media: %{audio: true}})
      refute Participant.has_video?(p)
    end

    test "returns false for non-participant struct" do
      refute Participant.has_video?(%{media: %{video: true}})
    end
  end

  describe "has_audio?/1" do
    test "returns true when audio is enabled" do
      p = build_participant(%{media: %{audio: true, video: false}})
      assert Participant.has_audio?(p)
    end

    test "returns false when audio is disabled" do
      p = build_participant(%{media: %{audio: false, video: true}})
      refute Participant.has_audio?(p)
    end

    test "returns false when audio key is missing" do
      p = build_participant(%{media: %{video: true}})
      refute Participant.has_audio?(p)
    end

    test "returns false for non-participant struct" do
      refute Participant.has_audio?(%{media: %{audio: true}})
    end
  end

  describe "screen_sharing?/1" do
    test "returns true when screen sharing is active" do
      p = build_participant(%{media: %{audio: true, video: true, screen: true}})
      assert Participant.screen_sharing?(p)
    end

    test "returns false when screen sharing is inactive" do
      p = build_participant(%{media: %{audio: true, video: true, screen: false}})
      refute Participant.screen_sharing?(p)
    end

    test "returns false when screen key is missing" do
      p = build_participant(%{media: %{audio: true, video: true}})
      refute Participant.screen_sharing?(p)
    end

    test "returns false for non-participant struct" do
      refute Participant.screen_sharing?(%{media: %{screen: true}})
    end
  end

  describe "update_media/2" do
    test "merges new media state" do
      p = build_participant(%{media: %{audio: true, video: false, muted: false}})
      updated = Participant.update_media(p, %{video: true})

      assert updated.media.audio == true
      assert updated.media.video == true
      assert updated.media.muted == false
    end

    test "can add new media keys" do
      p = build_participant(%{media: %{audio: true, video: false}})
      updated = Participant.update_media(p, %{screen: true})

      assert updated.media.screen == true
      assert updated.media.audio == true
    end

    test "can disable all media" do
      p = build_participant(%{media: %{audio: true, video: true, muted: false}})
      updated = Participant.update_media(p, %{audio: false, video: false, muted: true})

      refute updated.media.audio
      refute updated.media.video
      assert updated.media.muted
    end

    test "returns participant struct" do
      p = build_participant()
      updated = Participant.update_media(p, %{})
      assert %Participant{} = updated
    end
  end

  describe "mark_connected/2" do
    test "sets state to connected" do
      p = build_participant(%{state: :connecting})
      connected = Participant.mark_connected(p)

      assert connected.state == :connected
    end

    test "sets connection_id when provided" do
      p = build_participant(%{state: :connecting})
      connected = Participant.mark_connected(p, "conn_abc")

      assert connected.state == :connected
      assert connected.connection_id == "conn_abc"
    end

    test "defaults connection_id to nil" do
      p = build_participant()
      connected = Participant.mark_connected(p)

      assert connected.state == :connected
      assert is_nil(connected.connection_id)
    end
  end

  describe "mark_disconnected/1" do
    test "sets state to disconnected" do
      p = build_participant(%{state: :connected})
      disconnected = Participant.mark_disconnected(p)

      assert disconnected.state == :disconnected
    end
  end

  describe "to_map/1" do
    test "serializes participant to map" do
      now = DateTime.utc_now()
      p = build_participant(%{
        id: "user_456",
        device: "mobile",
        media: %{audio: true, video: false, muted: true},
        state: :connected,
        joined_at: now
      })

      map = Participant.to_map(p)

      assert map.id == "user_456"
      assert map.device == "mobile"
      assert map.media == %{audio: true, video: false, muted: true}
      assert map.state == :connected
      assert is_binary(map.joined_at)
    end

    test "handles nil joined_at" do
      p = build_participant(%{joined_at: nil})
      map = Participant.to_map(p)

      assert is_nil(map.joined_at)
    end
  end

  describe "struct defaults" do
    test "has sensible defaults" do
      p = %Participant{}

      assert p.device == "unknown"
      assert p.media == %{audio: true, video: false, muted: false}
      assert p.state == :connecting
      assert is_nil(p.id)
      assert is_nil(p.joined_at)
      assert is_nil(p.connection_id)
    end
  end
end
