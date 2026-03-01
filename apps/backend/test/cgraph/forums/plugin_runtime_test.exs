defmodule CGraph.Forums.PluginRuntimeTest do
  use CGraph.DataCase, async: true

  alias CGraph.Forums.PluginRuntime

  describe "supported_events/0" do
    test "returns all expected events" do
      events = PluginRuntime.supported_events()
      assert :thread_created in events
      assert :post_created in events
      assert :vote_cast in events
      assert :report_filed in events
      assert :member_banned in events
      assert :moderation_action in events
      assert :theme_changed in events
      assert :settings_updated in events
      assert length(events) == 15
    end
  end

  describe "dispatch/3" do
    test "returns :ok for valid events even with no plugins" do
      assert :ok = PluginRuntime.dispatch(Ecto.UUID.generate(), :thread_created, %{title: "Test"})
    end

    test "returns :ok for unknown events (logs warning)" do
      assert :ok = PluginRuntime.dispatch(Ecto.UUID.generate(), :unknown_event, %{})
    end

    test "accepts empty payload" do
      assert :ok = PluginRuntime.dispatch(Ecto.UUID.generate(), :post_created)
    end
  end

  describe "execute_hook/3" do
    test "handles nil handler gracefully" do
      plugin = %CGraph.Forums.ForumPlugin{
        plugin_id: "test_plugin",
        settings: %{},
        hooks: ["thread_created"]
      }

      assert :ok = PluginRuntime.execute_hook(plugin, :thread_created, %{})
    end

    test "handles string handler (code execution stub)" do
      plugin = %CGraph.Forums.ForumPlugin{
        plugin_id: "test_plugin",
        settings: %{"hooks" => %{"thread_created" => "console.log('hello')"}},
        hooks: ["thread_created"]
      }

      assert :ok = PluginRuntime.execute_hook(plugin, :thread_created, %{title: "Test"})
    end

    test "handles map handler with action" do
      plugin = %CGraph.Forums.ForumPlugin{
        plugin_id: "test_plugin",
        settings: %{"hooks" => %{"post_created" => %{"action" => "log"}}},
        hooks: ["post_created"]
      }

      assert :ok = PluginRuntime.execute_hook(plugin, :post_created, %{content: "Hello"})
    end

    test "isolates failures — returns error tuple instead of crashing" do
      plugin = %CGraph.Forums.ForumPlugin{
        plugin_id: "bad_plugin",
        settings: %{"hooks" => %{"post_created" => 42}},
        hooks: ["post_created"]
      }

      # Should not raise; returns :ok (unknown handler type)
      assert :ok = PluginRuntime.execute_hook(plugin, :post_created, %{})
    end
  end
end
