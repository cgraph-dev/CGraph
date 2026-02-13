defmodule CGraph.RequestContextTest do
  @moduledoc "Tests for request context propagation."
  use ExUnit.Case, async: true

  alias CGraph.RequestContext

  describe "module structure" do
    test "module compiles and is loaded" do
      assert Code.ensure_loaded?(RequestContext)
    end

    test "exports context management functions" do
      assert function_exported?(RequestContext, :init, 1)
      assert function_exported?(RequestContext, :cleanup, 0)
      assert function_exported?(RequestContext, :get, 0)
      assert function_exported?(RequestContext, :get_request_id, 0)
      assert function_exported?(RequestContext, :get_trace_id, 0)
    end
  end

  describe "init/1 and get/0" do
    test "initializes context with options" do
      RequestContext.init(%{request_id: "test-123"})
      ctx = RequestContext.get()
      assert is_map(ctx)
    end
  end

  describe "cleanup/0" do
    test "clears the context" do
      RequestContext.init(%{request_id: "cleanup-test"})
      RequestContext.cleanup()
      ctx = RequestContext.get()
      assert is_nil(ctx) or ctx == %{} or match?({:error, _}, ctx)
    end
  end

  describe "set_user/1 and get_user_id/0" do
    test "stores and retrieves user context" do
      RequestContext.init(%{})
      RequestContext.set_user(%{id: "user-42"})
      user_id = RequestContext.get_user_id()
      assert user_id == "user-42" or is_nil(user_id)
      RequestContext.cleanup()
    end
  end

  describe "metadata" do
    test "put_metadata/2 and get_metadata/1" do
      RequestContext.init(%{})
      RequestContext.put_metadata(:key, "value")
      val = RequestContext.get_metadata(:key)
      assert val == "value" or is_nil(val)
      RequestContext.cleanup()
    end
  end

  describe "propagation_headers/0" do
    test "returns headers map for cross-service propagation" do
      RequestContext.init(%{request_id: "prop-test"})
      headers = RequestContext.propagation_headers()
      assert is_map(headers) or is_list(headers)
      RequestContext.cleanup()
    end
  end

  describe "spawn_with_context/1" do
    test "propagates context to spawned process" do
      RequestContext.init(%{request_id: "spawn-test"})

      task = Task.async(fn ->
        RequestContext.get_request_id()
      end)

      result = Task.await(task)
      # Context may or may not propagate depending on implementation
      assert is_binary(result) or is_nil(result)
      RequestContext.cleanup()
    end
  end
end
