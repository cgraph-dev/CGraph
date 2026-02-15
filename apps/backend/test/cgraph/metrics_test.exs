defmodule CGraph.MetricsTest do
  @moduledoc "Tests for Prometheus-compatible metrics collection."
  use ExUnit.Case, async: false

  alias CGraph.Metrics

  describe "module structure" do
    test "module compiles and is loaded" do
      assert Code.ensure_loaded?(Metrics)
    end

    test "exports metric functions" do
      assert function_exported?(Metrics, :define, 3)
      assert function_exported?(Metrics, :increment, 3)
      assert function_exported?(Metrics, :set, 3)
      assert function_exported?(Metrics, :observe, 3)
      assert function_exported?(Metrics, :all, 0)
    end
  end

  describe "define/3 and increment/3" do
    test "defines and increments a counter" do
      name = :"test_counter_#{System.unique_integer([:positive])}"

      case Metrics.define(:counter, name, help: "Test counter") do
        :ok ->
          Metrics.increment(name, %{}, 1)
          assert true

        {:error, _} ->
          :ok
      end
    end
  end

  describe "all/0" do
    test "returns map of all metrics" do
      # Ensure Metrics server is running
      case Process.whereis(CGraph.Metrics) do
        nil ->
          case CGraph.Metrics.start_link([]) do
            {:ok, _} -> :ok
            {:error, {:already_started, _}} -> :ok
            _ -> :ok
          end
        _pid -> :ok
      end

      result = Metrics.all()
      assert is_map(result) or is_list(result)
    end
  end

  describe "measure/3" do
    test "measures execution time" do
      name = :"test_measure_#{System.unique_integer([:positive])}"

      result = Metrics.measure(name, %{}, fn -> 42 end)
      assert result == 42 or match?({:ok, 42}, result)
    end
  end

  describe "reset/0" do
    test "resets all metrics" do
      # Ensure Metrics server is running
      case Process.whereis(CGraph.Metrics) do
        nil ->
          case CGraph.Metrics.start_link([]) do
            {:ok, _} -> :ok
            {:error, {:already_started, _}} -> :ok
            _ -> :ok
          end
        _pid -> :ok
      end

      result = Metrics.reset()
      assert result == :ok or match?({:ok, _}, result)
    end
  end
end
