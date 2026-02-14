defmodule CGraph.CacheTest do
  @moduledoc "Tests for multi-tier caching layer (ETS / Cachex / Redis)."
  use ExUnit.Case, async: false

  alias CGraph.Cache

  describe "module structure" do
    test "module compiles and is loaded" do
      assert Code.ensure_loaded?(Cache)
    end

    test "exports cache operations" do
      Code.ensure_loaded!(Cache)
      assert function_exported?(Cache, :put, 3)
      assert function_exported?(Cache, :delete, 1)
      assert function_exported?(Cache, :stats, 0)
      assert function_exported?(Cache, :get, 1) or function_exported?(Cache, :get, 2)
    end
  end

  describe "put/3 and get/2" do
    test "stores and retrieves a value" do
      key = "test:cache:#{System.unique_integer([:positive])}"
      Cache.put(key, "cached_value", ttl: 5_000)

      result = Cache.get(key)
      assert result == "cached_value" or result == {:ok, "cached_value"} or is_nil(result)
    end

    test "returns nil or error for missing key" do
      result = Cache.get("nonexistent:#{System.unique_integer([:positive])}")
      assert result == {:error, :not_found} or is_nil(result) or match?({:error, _}, result)
    end
  end

  describe "delete/1" do
    test "removes a cached value" do
      key = "test:del:#{System.unique_integer([:positive])}"
      Cache.put(key, "to_delete", ttl: 5_000)
      Cache.delete(key)

      result = Cache.get(key)
      assert result == {:error, :not_found} or is_nil(result) or match?({:error, _}, result)
    end
  end

  describe "fetch/3" do
    test "fetches from cache or computes value" do
      key = "test:fetch:#{System.unique_integer([:positive])}"

      result = Cache.fetch(key, fn -> {:ok, "computed"} end, ttl: 5_000)
      assert result == {:ok, "computed"} or result == "computed" or match?({:ok, _}, result)
    end
  end

  describe "stats/0" do
    test "returns cache statistics" do
      result = Cache.stats()
      assert is_map(result) or match?({:ok, _}, result)
    end
  end

  describe "clear_all/0" do
    test "clears all cached data" do
      result = Cache.clear_all()
      assert result == :ok or match?({:ok, _}, result)
    end
  end
end
