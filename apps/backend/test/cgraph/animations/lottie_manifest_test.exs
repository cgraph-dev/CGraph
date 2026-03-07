defmodule CGraph.Animations.LottieManifestTest do
  @moduledoc "Tests for the Lottie manifest module (compile-time emoji-to-CDN mapping)."
  use ExUnit.Case, async: true

  alias CGraph.Animations.LottieManifest

  @cdn_base "https://fonts.gstatic.com/s/e/notoemoji/latest"

  # ──────────────────────────────────────────────────────────
  # get_url/2
  # ──────────────────────────────────────────────────────────

  describe "get_url/2" do
    test "returns lottie URL for known codepoint (default format)" do
      url = LottieManifest.get_url("1f600")
      assert url == "#{@cdn_base}/1f600/lottie.json"
    end

    test "returns lottie URL for :lottie format" do
      url = LottieManifest.get_url("1f600", :lottie)
      assert url == "#{@cdn_base}/1f600/lottie.json"
    end

    test "returns webp URL for :webp format" do
      url = LottieManifest.get_url("1f600", :webp)
      assert url == "#{@cdn_base}/1f600/512.webp"
    end

    test "returns gif URL for :gif format" do
      url = LottieManifest.get_url("1f600", :gif)
      assert url == "#{@cdn_base}/1f600/512.gif"
    end

    test "returns nil for unknown codepoint" do
      assert nil == LottieManifest.get_url("zzzzz")
    end
  end

  # ──────────────────────────────────────────────────────────
  # has_animation?/1
  # ──────────────────────────────────────────────────────────

  describe "has_animation?/1" do
    test "returns true for known codepoint" do
      assert LottieManifest.has_animation?("1f600")
    end

    test "returns false for unknown codepoint" do
      refute LottieManifest.has_animation?("00000")
    end
  end

  # ──────────────────────────────────────────────────────────
  # emoji_to_codepoint/1
  # ──────────────────────────────────────────────────────────

  describe "emoji_to_codepoint/1" do
    test "converts simple emoji to codepoint hex" do
      assert "1f600" == LottieManifest.emoji_to_codepoint("😀")
    end

    test "returns nil for non-emoji string" do
      assert nil == LottieManifest.emoji_to_codepoint("notanemoji")
    end

    test "returns nil for nil input" do
      assert nil == LottieManifest.emoji_to_codepoint(nil)
    end
  end

  # ──────────────────────────────────────────────────────────
  # codepoint_to_emoji/1
  # ──────────────────────────────────────────────────────────

  describe "codepoint_to_emoji/1" do
    test "converts codepoint hex to emoji" do
      assert "😀" == LottieManifest.codepoint_to_emoji("1f600")
    end

    test "returns nil for unknown codepoint" do
      assert nil == LottieManifest.codepoint_to_emoji("zzzzz")
    end

    test "returns nil for nil input" do
      assert nil == LottieManifest.codepoint_to_emoji(nil)
    end
  end

  # ──────────────────────────────────────────────────────────
  # enrich_emoji/1
  # ──────────────────────────────────────────────────────────

  describe "enrich_emoji/1" do
    test "adds animation URLs for known emoji" do
      result = LottieManifest.enrich_emoji(%{emoji: "😀", name: "grinning face"})

      assert result.has_animation == true
      assert result.lottie_url =~ "1f600/lottie.json"
      assert result.webp_url =~ "1f600/512.webp"
      assert result.gif_url =~ "1f600/512.gif"
      assert result.codepoint == "1f600"
    end

    test "returns nil URLs for map without emoji key" do
      result = LottieManifest.enrich_emoji(%{name: "test"})

      assert result.has_animation == false
      assert result.lottie_url == nil
      assert result.webp_url == nil
      assert result.gif_url == nil
    end
  end

  # ──────────────────────────────────────────────────────────
  # all_animated_codepoints/0
  # ──────────────────────────────────────────────────────────

  describe "all_animated_codepoints/0" do
    test "returns non-empty list" do
      codepoints = LottieManifest.all_animated_codepoints()
      assert is_list(codepoints)
      assert length(codepoints) > 0
    end

    test "all entries are hex strings" do
      codepoints = LottieManifest.all_animated_codepoints()

      Enum.each(codepoints, fn cp ->
        assert is_binary(cp), "Codepoint should be a string: #{inspect(cp)}"
      end)
    end
  end

  # ──────────────────────────────────────────────────────────
  # cdn_base_url/0
  # ──────────────────────────────────────────────────────────

  describe "cdn_base_url/0" do
    test "returns the default CDN base URL" do
      assert @cdn_base == LottieManifest.cdn_base_url()
    end
  end

  # ──────────────────────────────────────────────────────────
  # manifest/0
  # ──────────────────────────────────────────────────────────

  describe "manifest/0" do
    test "returns a map" do
      manifest = LottieManifest.manifest()
      assert is_map(manifest)
      assert map_size(manifest) > 0
    end

    test "entries have expected keys" do
      manifest = LottieManifest.manifest()
      {_cp, entry} = Enum.at(manifest, 0)
      assert Map.has_key?(entry, :emoji)
      assert Map.has_key?(entry, :name)
      assert Map.has_key?(entry, :category)
    end
  end
end
