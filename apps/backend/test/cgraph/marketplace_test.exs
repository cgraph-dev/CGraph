defmodule CGraph.MarketplaceTest do
  @moduledoc "Tests for marketplace context (delegates to Gamification.Marketplace)."
  use CGraph.DataCase, async: true

  alias CGraph.Marketplace

  describe "module structure" do
    test "module compiles and is loaded" do
      assert Code.ensure_loaded?(Marketplace)
    end

    test "exports listing functions" do
      assert function_exported?(Marketplace, :list_listings, 1)
      assert function_exported?(Marketplace, :get_listing, 1)
      assert function_exported?(Marketplace, :create_listing, 3)
      assert function_exported?(Marketplace, :cancel_listing, 2)
    end

    test "exports offer functions" do
      assert function_exported?(Marketplace, :make_offer, 3)
      assert function_exported?(Marketplace, :accept_offer, 1)
      assert function_exported?(Marketplace, :reject_offer, 1)
    end

    test "exports analytics functions" do
      assert function_exported?(Marketplace, :count_active_listings, 0)
      assert function_exported?(Marketplace, :volume_24h, 0)
      assert function_exported?(Marketplace, :trending_items, 1)
    end
  end

  describe "list_listings/1" do
    test "returns a list" do
      result = Marketplace.list_listings(%{})
      assert is_list(result) or match?({:ok, _}, result)
    end
  end

  describe "get_listing/1" do
    test "returns nil or error for non-existent listing" do
      result = Marketplace.get_listing(Ecto.UUID.generate())
      assert is_nil(result) or match?({:error, _}, result)
    end
  end
end
