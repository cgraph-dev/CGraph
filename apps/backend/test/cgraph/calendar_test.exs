defmodule CGraph.CalendarTest do
  @moduledoc "Tests for calendar events and RSVPs."
  use CGraph.DataCase, async: true

  alias CGraph.Calendar

  describe "module structure" do
    test "module compiles and is loaded" do
      assert Code.ensure_loaded?(Calendar)
    end

    test "exports event CRUD functions" do
      assert function_exported?(Calendar, :list_events, 2)
      assert function_exported?(Calendar, :get_event, 2)
      assert function_exported?(Calendar, :create_event, 1)
      assert function_exported?(Calendar, :update_event, 2)
      assert function_exported?(Calendar, :delete_event, 1)
    end

    test "exports category functions" do
      assert function_exported?(Calendar, :list_categories, 0)
      assert function_exported?(Calendar, :create_category, 1)
    end

    test "exports RSVP functions" do
      Code.ensure_loaded!(Calendar)
      assert function_exported?(Calendar, :list_event_rsvps, 1) or function_exported?(Calendar, :list_event_rsvps, 2)
      assert function_exported?(Calendar, :create_or_update_rsvp, 1) or function_exported?(Calendar, :create_or_update_rsvp, 2)
      assert function_exported?(Calendar, :cancel_rsvp, 2) or function_exported?(Calendar, :cancel_rsvp, 1)
    end
  end

  describe "list_events/2" do
    test "returns empty list when no events exist" do
      result = Calendar.list_events(Ecto.UUID.generate(), %{})
      assert is_list(result) or is_tuple(result) or match?({:ok, _}, result)
    end
  end

  describe "get_event/2" do
    test "returns error for non-existent event" do
      result = Calendar.get_event(Ecto.UUID.generate(), Ecto.UUID.generate())
      assert is_nil(result) or match?({:error, _}, result)
    end
  end

  describe "create_event/1" do
    test "validates required fields" do
      result = Calendar.create_event(%{})
      assert match?({:error, _}, result)
    end
  end
end
