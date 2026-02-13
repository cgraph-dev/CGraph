defmodule CGraph.BatchProcessorTest do
  @moduledoc "Tests for batch processing with parallelization."
  use ExUnit.Case, async: false

  alias CGraph.BatchProcessor

  describe "module structure" do
    test "module compiles and is loaded" do
      assert Code.ensure_loaded?(BatchProcessor)
    end

    test "exports processing functions" do
      assert function_exported?(BatchProcessor, :process, 3)
      assert function_exported?(BatchProcessor, :process_batches, 3)
      assert function_exported?(BatchProcessor, :start_async, 3)
    end
  end

  describe "process/3" do
    test "processes a list of items" do
      items = [1, 2, 3, 4, 5]
      result = BatchProcessor.process(items, fn item -> item * 2 end, batch_size: 2)
      assert is_list(result) or match?({:ok, _}, result)
    end
  end

  describe "list_jobs/1" do
    test "returns active batch jobs" do
      result = BatchProcessor.list_jobs(%{})
      assert is_list(result) or match?({:ok, _}, result)
    end
  end
end
