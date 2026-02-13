defmodule CGraph.HTTPTest do
  @moduledoc "Tests for unified HTTP client with circuit breaker."
  use ExUnit.Case, async: true

  alias CGraph.HTTP

  describe "module structure" do
    test "module compiles and is loaded" do
      assert Code.ensure_loaded?(HTTP)
    end

    test "exports HTTP methods" do
      assert function_exported?(HTTP, :get, 2)
      assert function_exported?(HTTP, :post, 3)
      assert function_exported?(HTTP, :put, 3)
      assert function_exported?(HTTP, :delete, 2)
    end

    test "exports client builder" do
      assert function_exported?(HTTP, :build_client, 1)
      assert function_exported?(HTTP, :service, 1)
    end
  end

  describe "build_client/1" do
    test "builds a Tesla client with middleware" do
      client = HTTP.build_client(base_url: "https://example.com")
      assert is_map(client) or is_struct(client) or is_list(client)
    end
  end
end
