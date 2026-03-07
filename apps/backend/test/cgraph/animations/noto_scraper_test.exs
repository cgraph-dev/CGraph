defmodule CGraph.Animations.NotoScraperTest do
  @moduledoc """
  Tests for the Noto Emoji CDN scraper and manifest generation.

  All tests are pure unit tests (no database required) — they test
  codepoint conversion, URL building, manifest structure, and
  enriched emoji dataset validation.
  """
  use ExUnit.Case, async: true

  alias CGraph.Animations.NotoScraper

  # ============================================================================
  # emoji_to_hex/1
  # ============================================================================

  describe "emoji_to_hex/1" do
    test "converts simple emoji to lowercase hex codepoint" do
      assert NotoScraper.emoji_to_hex("😀") == "1f600"
    end

    test "converts multi-byte emoji correctly" do
      assert NotoScraper.emoji_to_hex("🤣") == "1f923"
    end

    test "strips variation selector FE0F" do
      # ❤️ is U+2764 U+FE0F — should produce just "2764"
      assert NotoScraper.emoji_to_hex("❤️") == "2764"
    end

    test "converts skin tone emoji with modifier" do
      # 👍🏽 = U+1F44D U+1F3FD
      assert NotoScraper.emoji_to_hex("👍🏽") == "1f44d_1f3fd"
    end

    test "converts ZWJ sequence emoji" do
      # ❤️‍🔥 = U+2764 U+FE0F U+200D U+1F525 — FE0F stripped
      assert NotoScraper.emoji_to_hex("❤️‍🔥") == "2764_200d_1f525"
    end

    test "converts flag emoji with regional indicators" do
      # 🇺🇸 = U+1F1FA U+1F1F8
      assert NotoScraper.emoji_to_hex("🇺🇸") == "1f1fa_1f1f8"
    end

    test "converts simple ASCII-range emoji" do
      # ✨ = U+2728
      assert NotoScraper.emoji_to_hex("✨") == "2728"
    end

    test "produces lowercase hex" do
      # Ensure we get lowercase a-f, not uppercase
      result = NotoScraper.emoji_to_hex("😀")
      assert result == String.downcase(result)
    end
  end

  # ============================================================================
  # codepoint_to_emoji/1
  # ============================================================================

  describe "codepoint_to_emoji/1" do
    test "converts simple codepoint back to emoji" do
      assert NotoScraper.codepoint_to_emoji("1f600") == "😀"
    end

    test "converts multi-codepoint back to emoji" do
      result = NotoScraper.codepoint_to_emoji("2764_200d_1f525")
      assert result == "❤\u200D🔥"
    end

    test "roundtrips with emoji_to_hex" do
      emojis = ["😀", "🤣", "👍", "🔥", "✨"]

      for emoji <- emojis do
        hex = NotoScraper.emoji_to_hex(emoji)
        roundtripped = NotoScraper.codepoint_to_emoji(hex)
        assert roundtripped == emoji, "Roundtrip failed for #{emoji} (hex: #{hex})"
      end
    end
  end

  # ============================================================================
  # URL builders
  # ============================================================================

  describe "URL builders" do
    test "lottie_url/1 builds correct CDN URL" do
      url = NotoScraper.lottie_url("1f600")
      assert url == "https://fonts.gstatic.com/s/e/notoemoji/latest/1f600/lottie.json"
    end

    test "webp_url/1 builds correct CDN URL" do
      url = NotoScraper.webp_url("1f600")
      assert url == "https://fonts.gstatic.com/s/e/notoemoji/latest/1f600/512.webp"
    end

    test "gif_url/1 builds correct CDN URL" do
      url = NotoScraper.gif_url("1f600")
      assert url == "https://fonts.gstatic.com/s/e/notoemoji/latest/1f600/512.gif"
    end

    test "cdn_base/0 returns expected base URL" do
      assert NotoScraper.cdn_base() == "https://fonts.gstatic.com/s/e/notoemoji/latest"
    end

    test "URLs use multi-codepoint format with underscore separator" do
      url = NotoScraper.lottie_url("2764_200d_1f525")

      assert url ==
               "https://fonts.gstatic.com/s/e/notoemoji/latest/2764_200d_1f525/lottie.json"
    end
  end

  # ============================================================================
  # Manifest JSON validation
  # ============================================================================

  describe "manifest JSON structure" do
    setup do
      path = Path.join(:code.priv_dir(:cgraph), "data/noto_emoji_manifest.json")
      manifest = path |> File.read!() |> Jason.decode!()
      %{manifest: manifest}
    end

    test "has required top-level fields", %{manifest: manifest} do
      assert is_binary(manifest["version"])
      assert is_binary(manifest["generated_at"])
      assert is_binary(manifest["cdn_base"])
      assert is_integer(manifest["total_animated"])
      assert is_list(manifest["emojis"])
    end

    test "total_animated matches emojis list length", %{manifest: manifest} do
      assert manifest["total_animated"] == length(manifest["emojis"])
    end

    test "contains at least 100 animated emojis", %{manifest: manifest} do
      assert length(manifest["emojis"]) >= 100
    end

    test "each emoji entry has required fields", %{manifest: manifest} do
      for emoji <- manifest["emojis"] do
        assert is_binary(emoji["codepoint"]),
               "Missing codepoint for #{inspect(emoji)}"

        assert is_binary(emoji["emoji"]),
               "Missing emoji for #{emoji["codepoint"]}"

        assert is_binary(emoji["name"]),
               "Missing name for #{emoji["codepoint"]}"

        assert is_binary(emoji["category"]),
               "Missing category for #{emoji["codepoint"]}"

        assert is_map(emoji["formats"]),
               "Missing formats for #{emoji["codepoint"]}"

        assert is_binary(emoji["formats"]["lottie"]),
               "Missing lottie format for #{emoji["codepoint"]}"

        assert is_binary(emoji["formats"]["webp"]),
               "Missing webp format for #{emoji["codepoint"]}"

        assert is_binary(emoji["formats"]["gif"]),
               "Missing gif format for #{emoji["codepoint"]}"
      end
    end

    test "format paths use codepoint as directory", %{manifest: manifest} do
      for emoji <- manifest["emojis"] do
        cp = emoji["codepoint"]
        assert emoji["formats"]["lottie"] == "#{cp}/lottie.json"
        assert emoji["formats"]["webp"] == "#{cp}/512.webp"
        assert emoji["formats"]["gif"] == "#{cp}/512.gif"
      end
    end

    test "no duplicate codepoints in manifest", %{manifest: manifest} do
      codepoints = Enum.map(manifest["emojis"], & &1["codepoint"])
      assert length(codepoints) == length(Enum.uniq(codepoints))
    end

    test "CDN base URL is the expected Google Fonts URL", %{manifest: manifest} do
      assert manifest["cdn_base"] == "https://fonts.gstatic.com/s/e/notoemoji/latest"
    end

    test "covers multiple emoji categories", %{manifest: manifest} do
      categories =
        manifest["emojis"]
        |> Enum.map(& &1["category"])
        |> Enum.uniq()

      # Should have at least smileys, people, animals, food
      assert length(categories) >= 4
      assert "Smileys & Emotion" in categories
      assert "People & Body" in categories
      assert "Animals & Nature" in categories
    end
  end

  # ============================================================================
  # Enriched emoji_unicode16.json validation
  # ============================================================================

  describe "enriched emoji dataset" do
    setup do
      path = Path.join(:code.priv_dir(:cgraph), "data/emoji_unicode16.json")
      dataset = path |> File.read!() |> Jason.decode!()
      %{dataset: dataset}
    end

    test "all entries have has_animation field", %{dataset: dataset} do
      for entry <- dataset do
        assert Map.has_key?(entry, "has_animation"),
               "Missing has_animation for #{entry["emoji"]} (#{entry["name"]})"
      end
    end

    test "animated entries have animation_codepoint", %{dataset: dataset} do
      animated = Enum.filter(dataset, & &1["has_animation"])

      for entry <- animated do
        assert is_binary(entry["animation_codepoint"]),
               "Missing animation_codepoint for #{entry["emoji"]} (#{entry["name"]})"
      end
    end

    test "non-animated entries do not have animation_codepoint", %{dataset: dataset} do
      static = Enum.filter(dataset, &(!&1["has_animation"]))

      for entry <- static do
        refute Map.has_key?(entry, "animation_codepoint"),
               "Unexpected animation_codepoint for static emoji #{entry["emoji"]}"
      end
    end

    test "at least 50 emojis are marked as animated", %{dataset: dataset} do
      animated = Enum.count(dataset, & &1["has_animation"])
      assert animated >= 50
    end

    test "animation_codepoint matches emoji character", %{dataset: dataset} do
      animated = Enum.filter(dataset, & &1["has_animation"])

      for entry <- animated do
        expected_cp = NotoScraper.emoji_to_hex(entry["emoji"])

        assert entry["animation_codepoint"] == expected_cp,
               "Codepoint mismatch for #{entry["emoji"]}: " <>
                 "expected #{expected_cp}, got #{entry["animation_codepoint"]}"
      end
    end

    test "original fields are preserved", %{dataset: dataset} do
      for entry <- dataset do
        assert is_binary(entry["emoji"])
        assert is_binary(entry["name"])
        assert is_binary(entry["category"])
        assert is_binary(entry["subcategory"])
        assert is_list(entry["keywords"])
        assert is_binary(entry["unicode_version"])
        assert is_boolean(entry["skin_tone_support"])
      end
    end
  end

  # ============================================================================
  # Seed task — manifest loading
  # ============================================================================

  describe "seed task manifest loading" do
    test "manifest can be loaded and parsed" do
      path = Path.join(:code.priv_dir(:cgraph), "data/noto_emoji_manifest.json")
      assert {:ok, content} = File.read(path)
      assert {:ok, manifest} = Jason.decode(content)
      assert is_list(manifest["emojis"])
      assert length(manifest["emojis"]) > 0
    end

    test "each manifest entry can build valid Lottie asset attrs" do
      path = Path.join(:code.priv_dir(:cgraph), "data/noto_emoji_manifest.json")
      manifest = path |> File.read!() |> Jason.decode!()
      cdn_base = manifest["cdn_base"]

      for emoji <- manifest["emojis"] do
        attrs = %{
          codepoint: emoji["codepoint"],
          emoji: emoji["emoji"],
          name: emoji["name"],
          category: emoji["category"],
          subcategory: emoji["subcategory"],
          keywords: emoji["keywords"] || [],
          lottie_url: cdn_base <> "/" <> emoji["formats"]["lottie"],
          webp_url: cdn_base <> "/" <> emoji["formats"]["webp"],
          gif_url: cdn_base <> "/" <> emoji["formats"]["gif"],
          file_size: emoji["file_size_bytes"],
          asset_type: "emoji",
          source: "noto"
        }

        assert is_binary(attrs.codepoint)
        assert is_binary(attrs.name)
        assert String.contains?(attrs.lottie_url, "lottie.json")
        assert String.contains?(attrs.webp_url, "512.webp")
        assert String.contains?(attrs.gif_url, "512.gif")
        assert attrs.asset_type == "emoji"
        assert attrs.source == "noto"
      end
    end
  end
end
