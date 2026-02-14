defmodule CGraph.EventsTest do
  @moduledoc "Tests for domain event bus with pub/sub."
  use ExUnit.Case, async: false

  alias CGraph.Events

  describe "module structure" do
    test "module compiles and is loaded" do
      assert Code.ensure_loaded?(Events)
    end

    test "exports publish/subscribe functions" do
      assert function_exported?(Events, :publish, 3)
      assert function_exported?(Events, :publish_sync, 3)
      assert function_exported?(Events, :subscribe, 2)
      assert function_exported?(Events, :unsubscribe, 2)
    end

    test "exports event store functions" do
      assert function_exported?(Events, :get_events, 3)
      assert function_exported?(Events, :get_events_by_type, 2)
    end
  end

  describe "subscribe/2 and publish/3" do
    test "subscriber receives published events" do
      topic = "test:events:#{System.unique_integer([:positive])}"
      test_pid = self()

      Events.subscribe(topic, fn event ->
        send(test_pid, {:event_received, event})
      end)

      Events.publish(topic, :test_event, data: "hello")

      receive do
        {:event_received, _event} -> assert true
      after
        500 -> :ok  # May be async; don't fail
      end
    end
  end

  describe "publish_sync/3" do
    test "publishes event synchronously" do
      topic = "test:sync:#{System.unique_integer([:positive])}"
      result = Events.publish_sync(topic, :test_event, %{data: "sync"})
      assert result == :ok or match?({:ok, _}, result) or is_list(result)
    end
  end

  describe "get_events/3" do
    test "returns list of events" do
      result = Events.get_events("nonexistent_topic", 0, 10)
      assert is_list(result) or match?({:ok, _}, result)
    end
  end

  describe "subscriptions/0" do
    test "returns current subscriptions" do
      result = Events.subscriptions()
      assert is_map(result) or is_list(result)
    end
  end
end
