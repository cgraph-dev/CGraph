defmodule CGraph.ErrorReporterTest do
  @moduledoc "Tests for centralized error reporting."
  use ExUnit.Case, async: false

  alias CGraph.ErrorReporter

  describe "module structure" do
    test "module compiles and is loaded" do
      assert Code.ensure_loaded?(ErrorReporter)
    end

    test "exports reporting functions" do
      assert function_exported?(ErrorReporter, :report, 3)
      assert function_exported?(ErrorReporter, :capture_message, 3)
      assert function_exported?(ErrorReporter, :stats, 0)
      assert function_exported?(ErrorReporter, :add_breadcrumb, 3)
    end
  end

  describe "report/3" do
    test "reports an error" do
      result = ErrorReporter.report(:error, "Test error for CGraph", %{test: true})
      assert result == :ok or match?({:ok, _}, result)
    end
  end

  describe "capture_message/3" do
    test "captures an informational message" do
      result = ErrorReporter.capture_message(:info, "Test message", %{})
      assert result == :ok or match?({:ok, _}, result)
    end
  end

  describe "context management" do
    test "set_user_context/1" do
      result = ErrorReporter.set_user_context(%{id: "user-123"})
      assert result == :ok or match?({:ok, _}, result)
    end

    test "set_tags/1 and clear_context/0" do
      ErrorReporter.set_tags(%{env: "test"})
      ErrorReporter.clear_context()
      assert true
    end
  end

  describe "stats/0" do
    test "returns error statistics" do
      result = ErrorReporter.stats()
      assert is_map(result)
    end
  end

  describe "add_breadcrumb/3" do
    test "adds a breadcrumb to the trail" do
      result = ErrorReporter.add_breadcrumb(:info, "test breadcrumb", %{})
      assert result == :ok or match?({:ok, _}, result)
    end
  end
end
