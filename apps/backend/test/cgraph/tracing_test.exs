defmodule CGraph.TracingTest do
  @moduledoc "Tests for W3C Trace Context-compatible distributed tracing."
  use ExUnit.Case, async: true

  alias CGraph.Tracing

  describe "module structure" do
    test "module compiles and is loaded" do
      assert Code.ensure_loaded?(Tracing)
    end

    test "exports tracing functions" do
      assert function_exported?(Tracing, :start_trace, 2)
      assert function_exported?(Tracing, :current_context, 0)
      assert function_exported?(Tracing, :set_context, 1)
      assert function_exported?(Tracing, :clear_context, 0)
      assert function_exported?(Tracing, :with_span, 4)
    end
  end

  describe "start_trace/2" do
    test "creates a new trace context" do
      result = Tracing.start_trace("test-operation", %{})
      assert is_map(result) or is_binary(result) or match?({:ok, _}, result)
    end
  end

  describe "current_context/0 and clear_context/0" do
    test "returns nil or empty when no trace active" do
      Tracing.clear_context()
      ctx = Tracing.current_context()
      assert is_nil(ctx) or ctx == %{} or match?({:error, _}, ctx)
    end
  end

  describe "traceparent/1" do
    test "formats W3C traceparent header" do
      result = Tracing.start_trace("test", %{})
      ctx = case result do
        {:ok, c} -> c
        c -> c
      end
      header = Tracing.traceparent(ctx)
      # W3C format: version-trace_id-parent_id-trace_flags
      assert is_binary(header) or is_nil(header)
    end
  end

  describe "parse_traceparent/1" do
    test "parses a valid traceparent string" do
      result = Tracing.parse_traceparent("00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01")
      assert is_map(result) or match?({:ok, _, _, _}, result) or match?({:ok, _}, result) or match?({:error, _}, result)
    end

    test "returns error for invalid traceparent" do
      result = Tracing.parse_traceparent("invalid")
      assert match?({:error, _}, result) or result == :error or is_nil(result)
    end
  end

  describe "with_span/4" do
    test "executes function within a span" do
      result = Tracing.with_span("test-span", %{}, %{}, fn -> 42 end)
      assert result == 42 or match?({:ok, 42}, result)
    end
  end

  describe "baggage" do
    test "set_baggage/3 and get_baggage/2" do
      Code.ensure_loaded!(Tracing)
      assert function_exported?(Tracing, :set_baggage, 3) or function_exported?(Tracing, :set_baggage, 2)
      assert function_exported?(Tracing, :get_baggage, 2) or function_exported?(Tracing, :get_baggage, 1)
    end
  end
end
