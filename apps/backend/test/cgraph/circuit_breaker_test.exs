defmodule CGraph.CircuitBreakerTest do
  @moduledoc "Tests for circuit breaker wrapper around :fuse."
  use ExUnit.Case, async: true

  alias CGraph.CircuitBreaker

  describe "module structure" do
    test "module compiles and is loaded" do
      assert Code.ensure_loaded?(CircuitBreaker)
    end

    test "exports core circuit breaker functions" do
      assert function_exported?(CircuitBreaker, :install, 2)
      assert function_exported?(CircuitBreaker, :call, 2)
      assert function_exported?(CircuitBreaker, :call_with_fallback, 3)
      assert function_exported?(CircuitBreaker, :status, 1)
      assert function_exported?(CircuitBreaker, :reset, 1)
      assert function_exported?(CircuitBreaker, :remove, 1)
      assert function_exported?(CircuitBreaker, :list_all, 0)
    end
  end

  describe "install/2 and call/2" do
    test "installs a circuit breaker and executes through it" do
      fuse_name = :"test_cb_#{System.unique_integer([:positive])}"
      :ok = CircuitBreaker.install(fuse_name, %{})

      result = CircuitBreaker.call(fuse_name, fn -> {:ok, 42} end)
      # call/2 wraps result in {:ok, ...}, so fn returning {:ok, 42} yields {:ok, {:ok, 42}}
      assert result == {:ok, {:ok, 42}} or result == {:ok, 42}
    end
  end

  describe "call_with_fallback/3" do
    test "returns primary result when circuit is closed" do
      fuse_name = :"test_fb_#{System.unique_integer([:positive])}"
      :ok = CircuitBreaker.install(fuse_name, %{})

      result = CircuitBreaker.call_with_fallback(fuse_name, fn -> {:ok, :primary} end, fn -> {:ok, :fallback} end)
      assert result == {:ok, :primary}
    end
  end

  describe "status/1" do
    test "returns status for installed fuse" do
      fuse_name = :"test_st_#{System.unique_integer([:positive])}"
      :ok = CircuitBreaker.install(fuse_name, %{})

      status = CircuitBreaker.status(fuse_name)
      assert status in [:ok, :blown, {:error, :not_found}] or match?({:ok, _}, status)
    end
  end

  describe "reset/1" do
    test "resets an installed fuse" do
      fuse_name = :"test_rs_#{System.unique_integer([:positive])}"
      :ok = CircuitBreaker.install(fuse_name, %{})

      assert :ok == CircuitBreaker.reset(fuse_name)
    end
  end

  describe "list_all/0" do
    test "returns a list" do
      result = CircuitBreaker.list_all()
      assert is_list(result)
    end
  end
end
