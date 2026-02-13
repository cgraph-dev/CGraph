defmodule CGraph.TelemetryTest do
  @moduledoc "Tests for telemetry event handlers."
  use ExUnit.Case, async: true

  alias CGraph.Telemetry

  describe "module structure" do
    test "module compiles and is loaded" do
      assert Code.ensure_loaded?(Telemetry)
    end

    test "exports handler attachment functions" do
      assert function_exported?(Telemetry, :attach_handlers, 0)
      assert function_exported?(Telemetry, :detach_handlers, 0)
    end

    test "exports individual handler functions" do
      assert function_exported?(Telemetry, :handle_request_stop, 4)
      assert function_exported?(Telemetry, :handle_repo_query, 4)
    end
  end

  describe "attach_handlers/0" do
    test "attaches telemetry handlers without error" do
      result = Telemetry.attach_handlers()
      assert result == :ok or match?({:ok, _}, result) or is_list(result)
    end
  end
end
