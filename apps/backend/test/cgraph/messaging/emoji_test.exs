defmodule CGraph.Messaging.EmojiTest do
  @moduledoc """
  Tests for the Unicode emoji catalog module.
  """
  use ExUnit.Case, async: true

  alias CGraph.Messaging.Emoji

  describe "valid_emoji?/1" do
    test "accepts common emojis" do
      assert Emoji.valid_emoji?("😀")
      assert Emoji.valid_emoji?("👍")
      assert Emoji.valid_emoji?("❤️")
      assert Emoji.valid_emoji?("🔥")
      assert Emoji.valid_emoji?("🎉")
    end

    test "accepts emojis with skin tone modifiers" do
      assert Emoji.valid_emoji?("👍\u{1F3FB}")
      assert Emoji.valid_emoji?("👍\u{1F3FC}")
      assert Emoji.valid_emoji?("👍\u{1F3FD}")
      assert Emoji.valid_emoji?("👍\u{1F3FE}")
      assert Emoji.valid_emoji?("👍\u{1F3FF}")
    end

    test "accepts emojis from different categories" do
      # Animals
      assert Emoji.valid_emoji?("🐶")
      # Food
      assert Emoji.valid_emoji?("🍕")
      # Travel
      assert Emoji.valid_emoji?("✈️")
      # Symbols
      assert Emoji.valid_emoji?("✅")
      # Flags
      assert Emoji.valid_emoji?("🇺🇸")
    end

    test "accepts Unicode 16.0 additions" do
      # face with bags under eyes
      assert Emoji.valid_emoji?("🫩")
      # leafless tree
      assert Emoji.valid_emoji?("🪾")
    end

    test "rejects invalid input" do
      refute Emoji.valid_emoji?("notanemoji")
      refute Emoji.valid_emoji?("")
      refute Emoji.valid_emoji?("abc123")
      refute Emoji.valid_emoji?(nil)
      refute Emoji.valid_emoji?(42)
    end
  end

  describe "search/2" do
    test "searches by name" do
      results = Emoji.search("heart")
      assert length(results) > 0
      assert Enum.all?(results, fn e ->
        String.contains?(String.downcase(e.name), "heart") or
          Enum.any?(e.keywords, &String.contains?(String.downcase(&1), "heart"))
      end)
    end

    test "searches by keyword" do
      results = Emoji.search("love")
      assert length(results) > 0
    end

    test "case insensitive search" do
      results_lower = Emoji.search("fire")
      results_upper = Emoji.search("FIRE")
      assert length(results_lower) == length(results_upper)
    end

    test "respects limit option" do
      results = Emoji.search("face", limit: 3)
      assert length(results) <= 3
    end

    test "filters by category" do
      results = Emoji.search("dog", category: "Animals & Nature")
      assert length(results) > 0
      assert Enum.all?(results, &(&1.category == "Animals & Nature"))
    end

    test "returns empty for no matches" do
      results = Emoji.search("zzznonexistentzzzxyz")
      assert results == []
    end
  end

  describe "categories/0" do
    test "returns sorted category names" do
      cats = Emoji.categories()
      assert is_list(cats)
      assert length(cats) >= 8
      assert cats == Enum.sort(cats)
    end

    test "includes expected categories" do
      cats = Emoji.categories()
      assert "Smileys & Emotion" in cats
      assert "People & Body" in cats
      assert "Animals & Nature" in cats
      assert "Food & Drink" in cats
      assert "Activities" in cats
      assert "Objects" in cats
      assert "Symbols" in cats
      assert "Flags" in cats
    end
  end

  describe "list_by_category/1" do
    test "returns emojis for valid category" do
      emojis = Emoji.list_by_category("Smileys & Emotion")
      assert length(emojis) > 0
      assert Enum.all?(emojis, &(&1.category == "Smileys & Emotion"))
    end

    test "returns empty list for unknown category" do
      assert Emoji.list_by_category("Nonexistent") == []
    end
  end

  describe "all/0" do
    test "returns all categories with their emojis" do
      all = Emoji.all()
      assert is_list(all)
      assert length(all) >= 8

      Enum.each(all, fn {category, emojis} ->
        assert is_binary(category)
        assert is_list(emojis)
        assert length(emojis) > 0
      end)
    end
  end

  describe "skin_tone_variants/1" do
    test "returns variants for skin-tone-supporting emojis" do
      variants = Emoji.skin_tone_variants("👍")
      assert length(variants) == 5
      assert Enum.all?(variants, &String.starts_with?(&1, "👍"))
    end

    test "returns empty for non-skin-tone emojis" do
      assert Emoji.skin_tone_variants("❤️") == []
      assert Emoji.skin_tone_variants("🔥") == []
    end

    test "returns empty for unknown emoji" do
      assert Emoji.skin_tone_variants("notanemoji") == []
    end
  end

  describe "count/0" do
    test "returns total emoji count" do
      count = Emoji.count()
      assert count >= 200
      assert is_integer(count)
    end
  end
end
