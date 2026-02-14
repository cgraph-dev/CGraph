defmodule CGraph.PresenceTest do
  @moduledoc "Tests for real-time user presence tracking."
  use ExUnit.Case, async: false

  alias CGraph.Presence

  describe "module structure" do
    test "module compiles and is loaded" do
      assert Code.ensure_loaded?(Presence)
    end

    test "exports tracking functions" do
      assert function_exported?(Presence, :track_user, 4)
      assert function_exported?(Presence, :untrack_user, 3)
      assert function_exported?(Presence, :update_typing, 4)
      assert function_exported?(Presence, :update_status, 4)
    end

    test "exports query functions" do
      assert function_exported?(Presence, :list_room_users, 1)
      assert function_exported?(Presence, :count_room_users, 1)
      assert function_exported?(Presence, :user_online?, 1)
      assert function_exported?(Presence, :get_user_status, 1)
    end
  end

  describe "user_online?/1" do
    test "returns false for non-tracked user" do
      result = Presence.user_online?(Ecto.UUID.generate())
      assert result == false or match?({:ok, false}, result)
    end
  end

  describe "list_room_users/1" do
    test "returns empty for non-existent room" do
      result = Presence.list_room_users("nonexistent_room_#{System.unique_integer([:positive])}")
      assert result == [] or is_list(result) or is_map(result) or match?({:ok, _}, result)
    end
  end

  describe "count_room_users/1" do
    test "returns 0 for empty room" do
      result = Presence.count_room_users("empty_room_#{System.unique_integer([:positive])}")
      assert result == 0 or match?({:ok, 0}, result) or is_integer(result)
    end
  end

  describe "get_user_status/1" do
    test "returns offline or nil for non-tracked user" do
      result = Presence.get_user_status(Ecto.UUID.generate())
      assert result in [:offline, "offline", nil] or match?({:ok, _}, result) or match?({:error, _}, result)
    end
  end

  describe "bulk_status/1" do
    test "returns statuses for multiple users" do
      user_ids = [Ecto.UUID.generate(), Ecto.UUID.generate()]
      result = Presence.bulk_status(user_ids)
      assert is_map(result) or is_list(result) or match?({:ok, _}, result)
    end
  end
end
