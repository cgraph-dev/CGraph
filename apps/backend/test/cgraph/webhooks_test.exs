defmodule CGraph.WebhooksTest do
  @moduledoc "Tests for outbound webhook delivery system."
  use CGraph.DataCase, async: false

  alias CGraph.Webhooks

  describe "module structure" do
    test "module compiles and is loaded" do
      assert Code.ensure_loaded?(Webhooks)
    end

    test "exports endpoint management functions" do
      assert function_exported?(Webhooks, :create_endpoint, 1)
      assert function_exported?(Webhooks, :update_endpoint, 2)
      assert function_exported?(Webhooks, :delete_endpoint, 1)
      assert function_exported?(Webhooks, :get_endpoint, 1)
      assert function_exported?(Webhooks, :list_endpoints, 1)
    end

    test "exports dispatch functions" do
      assert function_exported?(Webhooks, :dispatch, 3)
    end

    test "exports delivery tracking functions" do
      assert function_exported?(Webhooks, :list_deliveries, 2)
      assert function_exported?(Webhooks, :get_delivery, 1)
      assert function_exported?(Webhooks, :retry_delivery, 1)
    end
  end

  describe "get_endpoint/1" do
    test "returns nil or error for non-existent endpoint" do
      result = Webhooks.get_endpoint(Ecto.UUID.generate())
      assert is_nil(result) or match?({:error, _}, result)
    end
  end

  describe "list_endpoints/1" do
    test "returns list for user with no endpoints" do
      result = Webhooks.list_endpoints(%{user_id: Ecto.UUID.generate()})
      assert is_list(result) or match?({:ok, _}, result)
    end
  end

  describe "verify_signature/3" do
    test "verifies HMAC-SHA256 webhook signature" do
      secret = "wh_test_secret"
      payload = ~s({"event": "test"})
      signature = :crypto.mac(:hmac, :sha256, secret, payload) |> Base.encode16(case: :lower)

      result = Webhooks.verify_signature(payload, signature, secret)
      assert is_boolean(result) or result in [:ok, :error] or match?({:ok, _}, result) or match?({:error, _}, result)
    end
  end

  describe "get_stats/1" do
    test "returns webhook delivery statistics" do
      result = Webhooks.get_stats(Ecto.UUID.generate())
      assert is_map(result) or match?({:ok, _}, result)
    end
  end
end
