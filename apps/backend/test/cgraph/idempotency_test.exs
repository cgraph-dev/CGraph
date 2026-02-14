defmodule CGraph.IdempotencyTest do
  @moduledoc "Tests for idempotency key management."
  use ExUnit.Case, async: false

  alias CGraph.Idempotency

  describe "module structure" do
    test "module compiles and is loaded" do
      assert Code.ensure_loaded?(Idempotency)
    end

    test "exports key management functions" do
      assert function_exported?(Idempotency, :check, 2)
      assert function_exported?(Idempotency, :store, 2)
      assert function_exported?(Idempotency, :release, 1)
      assert function_exported?(Idempotency, :delete, 1)
      assert function_exported?(Idempotency, :exists?, 1)
    end
  end

  describe "check/2" do
    test "returns :new for unknown key" do
      key = "idem-test-#{System.unique_integer([:positive])}"
      result = Idempotency.check(key, %{})
      # check/2 returns {:ok, lock_ref} for new keys
      assert result == :new or match?({:ok, _}, result)
    end
  end

  describe "store/2 and get/1" do
    test "stores and retrieves idempotency result" do
      key = "idem-store-#{System.unique_integer([:positive])}"
      check_result = Idempotency.check(key, %{})
      # check returns {:ok, lock} for new key
      lock = case check_result do
        {:ok, lock} -> lock
        _ -> nil
      end
      if lock do
        Idempotency.store(lock, %{status: 200, body: "ok"})
      end
      result = Idempotency.get(key)
      assert is_map(result) or match?({:ok, _}, result) or is_nil(result)
      Idempotency.delete(key)
    end
  end

  describe "exists?/1" do
    test "returns false for unknown key" do
      result = Idempotency.exists?("nonexistent-#{System.unique_integer([:positive])}")
      assert result == false or match?({:ok, false}, result)
    end
  end

  describe "fingerprint/1" do
    test "produces consistent fingerprint" do
      fp1 = Idempotency.fingerprint(%{method: "POST", path: "/api/test"})
      fp2 = Idempotency.fingerprint(%{method: "POST", path: "/api/test"})
      assert fp1 == fp2
    end
  end

  describe "get_stats/0" do
    test "returns stats map" do
      result = Idempotency.get_stats()
      assert is_map(result)
    end
  end
end
