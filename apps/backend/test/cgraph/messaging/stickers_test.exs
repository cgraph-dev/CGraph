defmodule CGraph.Messaging.StickersTest do
  @moduledoc """
  Tests for the sticker system context (CGraph.Stickers).

  Covers: store browsing, search, add/remove packs, user collection,
  premium gating, and recently used.
  """
  use CGraph.DataCase, async: true

  import CGraph.Factory

  alias CGraph.Stickers

  describe "list_store_packs/1" do
    test "returns published packs" do
      pack = insert(:sticker_pack, published: true)
      _unpublished = insert(:sticker_pack, published: false)

      %{packs: packs, total: total} = Stickers.list_store_packs()
      pack_ids = Enum.map(packs, & &1.id)

      assert pack.id in pack_ids
      assert total >= 1
    end

    test "filters by category" do
      _animals = insert(:sticker_pack, category: "animals", published: true)
      _emotions = insert(:sticker_pack, category: "emotions", published: true)

      %{packs: packs} = Stickers.list_store_packs(category: "animals")
      assert Enum.all?(packs, &(&1.category == "animals"))
    end
  end

  describe "search_packs/2" do
    test "finds packs by name" do
      pack = insert(:sticker_pack, name: "funky_cats", title: "Funky Cats", published: true)
      _insert_sticker = insert(:sticker, sticker_pack: pack)

      results = Stickers.search_packs("funky")
      assert Enum.any?(results, &(&1.id == pack.id))
    end

    test "returns empty for no matches" do
      assert Stickers.search_packs("xyznonexistent") == []
    end
  end

  describe "add_pack/2" do
    test "adds free pack to user collection" do
      user = insert(:user)
      pack = insert(:sticker_pack, is_premium: false, coin_price: 0)

      assert {:ok, usp} = Stickers.add_pack(user, pack.id)
      assert usp.sticker_pack.id == pack.id
    end

    test "rejects premium pack with insufficient coins" do
      user = insert(:user, coins: 0)
      pack = insert(:sticker_pack, is_premium: true, coin_price: 100)

      assert {:error, :insufficient_coins} = Stickers.add_pack(user, pack.id)
    end

    test "rejects duplicate add" do
      user = insert(:user)
      pack = insert(:sticker_pack, coin_price: 0)

      {:ok, _} = Stickers.add_pack(user, pack.id)
      assert {:error, :already_added} = Stickers.add_pack(user, pack.id)
    end
  end

  describe "remove_pack/2" do
    test "removes pack from user collection" do
      user = insert(:user)
      pack = insert(:sticker_pack, coin_price: 0)
      {:ok, _} = Stickers.add_pack(user, pack.id)

      assert {:ok, _} = Stickers.remove_pack(user, pack.id)
      refute Stickers.user_has_pack?(user.id, pack.id)
    end

    test "returns error for pack not in collection" do
      user = insert(:user)
      assert {:error, :not_found} = Stickers.remove_pack(user, Ecto.UUID.generate())
    end
  end

  describe "list_user_packs/1" do
    test "returns user's added packs" do
      user = insert(:user)
      pack1 = insert(:sticker_pack, coin_price: 0)
      pack2 = insert(:sticker_pack, coin_price: 0)
      {:ok, _} = Stickers.add_pack(user, pack1.id)
      {:ok, _} = Stickers.add_pack(user, pack2.id)

      packs = Stickers.list_user_packs(user.id)
      pack_ids = Enum.map(packs, & &1.id)
      assert pack1.id in pack_ids
      assert pack2.id in pack_ids
    end
  end

  describe "trending_packs/1" do
    test "returns packs ordered by download count" do
      _low = insert(:sticker_pack, download_count: 5, published: true)
      high = insert(:sticker_pack, download_count: 500, published: true)

      trending = Stickers.trending_packs(5)
      # The first trending pack should be the highest download count
      assert hd(trending).id == high.id
    end
  end
end
