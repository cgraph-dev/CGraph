defmodule CGraph.JobsTest do
  @moduledoc "Tests for background job abstraction over Oban."
  use CGraph.DataCase, async: false

  alias CGraph.Jobs

  describe "module structure" do
    test "module compiles and is loaded" do
      assert Code.ensure_loaded?(Jobs)
    end

    test "exports job functions" do
      assert function_exported?(Jobs, :enqueue, 3)
      assert function_exported?(Jobs, :get_job, 1)
      assert function_exported?(Jobs, :cancel_job, 1)
    end

    test "exports queue management functions" do
      assert function_exported?(Jobs, :pause_queue, 1)
      assert function_exported?(Jobs, :resume_queue, 1)
    end

    test "exports workflow functions" do
      assert function_exported?(Jobs, :start_workflow, 1)
      assert function_exported?(Jobs, :get_workflow_status, 1)
    end
  end

  describe "get_job/1" do
    test "returns nil for non-existent job" do
      result = Jobs.get_job(-1)
      assert is_nil(result) or match?({:error, _}, result)
    end
  end
end
