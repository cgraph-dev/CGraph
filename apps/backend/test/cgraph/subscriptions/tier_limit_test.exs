defmodule CGraph.Subscriptions.TierLimitTest do
  @moduledoc """
  Tests for the TierLimit schema — changeset validations
  and utility functions (format_bytes, format_limit, etc.).
  """
  use Cgraph.DataCase, async: true

  alias CGraph.Subscriptions.TierLimit

  # =========================================================================
  # Changeset Validations
  # =========================================================================

  describe "changeset/2" do
    test "valid changeset with required fields" do
      attrs = %{tier: "premium", display_name: "Premium"}
      changeset = TierLimit.changeset(%TierLimit{}, attrs)
      assert changeset.valid?
    end

    test "requires tier field" do
      attrs = %{display_name: "No Tier"}
      changeset = TierLimit.changeset(%TierLimit{}, attrs)
      refute changeset.valid?
      assert "can't be blank" in errors_on(changeset).tier
    end

    test "requires display_name field" do
      attrs = %{tier: "premium"}
      changeset = TierLimit.changeset(%TierLimit{}, attrs)
      refute changeset.valid?
      assert "can't be blank" in errors_on(changeset).display_name
    end

    test "validates tier inclusion in valid_tiers" do
      attrs = %{tier: "invalid_tier", display_name: "Bad Tier"}
      changeset = TierLimit.changeset(%TierLimit{}, attrs)
      refute changeset.valid?
      assert "is invalid" in errors_on(changeset).tier
    end

    test "accepts free tier" do
      attrs = %{tier: "free", display_name: "Free"}
      changeset = TierLimit.changeset(%TierLimit{}, attrs)
      assert changeset.valid?
    end

    test "accepts enterprise tier" do
      attrs = %{tier: "enterprise", display_name: "Enterprise"}
      changeset = TierLimit.changeset(%TierLimit{}, attrs)
      assert changeset.valid?
    end

    test "validates support_level inclusion" do
      attrs = %{tier: "premium", display_name: "Premium", support_level: "vip"}
      changeset = TierLimit.changeset(%TierLimit{}, attrs)
      refute changeset.valid?
      assert "is invalid" in errors_on(changeset).support_level
    end

    test "accepts valid support levels" do
      for level <- ~w(community priority dedicated) do
        attrs = %{tier: "premium", display_name: "Premium", support_level: level}
        changeset = TierLimit.changeset(%TierLimit{}, attrs)
        assert changeset.valid?, "Expected #{level} to be valid"
      end
    end

    test "validates position is non-negative" do
      attrs = %{tier: "premium", display_name: "Premium", position: -1}
      changeset = TierLimit.changeset(%TierLimit{}, attrs)
      refute changeset.valid?
      assert "must be greater than or equal to 0" in errors_on(changeset).position
    end

    test "validates rate_limit_multiplier is positive" do
      attrs = %{tier: "premium", display_name: "Premium", rate_limit_multiplier: 0}
      changeset = TierLimit.changeset(%TierLimit{}, attrs)
      refute changeset.valid?
      assert "must be greater than 0" in errors_on(changeset).rate_limit_multiplier
    end

    test "casts numeric fields" do
      attrs = %{
        tier: "premium",
        display_name: "Premium",
        max_forums_owned: 10,
        max_storage_bytes: 5_368_709_120,
        price_monthly_cents: 999,
        concurrent_sessions: 5
      }

      changeset = TierLimit.changeset(%TierLimit{}, attrs)
      assert changeset.valid?
      assert Ecto.Changeset.get_change(changeset, :max_forums_owned) == 10
      assert Ecto.Changeset.get_change(changeset, :max_storage_bytes) == 5_368_709_120
    end

    test "casts boolean fields" do
      attrs = %{
        tier: "premium",
        display_name: "Premium",
        ai_moderation_enabled: true,
        custom_css_enabled: true,
        video_calls_enabled: true,
        api_access_enabled: true
      }

      changeset = TierLimit.changeset(%TierLimit{}, attrs)
      assert changeset.valid?
    end

    test "casts array fields" do
      attrs = %{
        tier: "premium",
        display_name: "Premium",
        allowed_file_types: ["image/jpeg", "image/png", "video/mp4"],
        exclusive_themes: ["dark_premium", "ocean"]
      }

      changeset = TierLimit.changeset(%TierLimit{}, attrs)
      assert changeset.valid?
    end
  end

  # =========================================================================
  # valid_tiers/0
  # =========================================================================

  describe "valid_tiers/0" do
    test "returns expected tiers" do
      assert TierLimit.valid_tiers() == ~w(free premium enterprise)
    end
  end

  # =========================================================================
  # support_levels/0
  # =========================================================================

  describe "support_levels/0" do
    test "returns expected support levels" do
      assert TierLimit.support_levels() == ~w(community priority dedicated)
    end
  end

  # =========================================================================
  # unlimited?/1
  # =========================================================================

  describe "unlimited?/1" do
    test "returns true for nil" do
      assert TierLimit.unlimited?(nil)
    end

    test "returns false for integer" do
      refute TierLimit.unlimited?(100)
    end

    test "returns false for zero" do
      refute TierLimit.unlimited?(0)
    end
  end

  # =========================================================================
  # within_limit?/2
  # =========================================================================

  describe "within_limit?/2" do
    test "returns true when limit is nil (unlimited)" do
      assert TierLimit.within_limit?(nil, 999_999)
    end

    test "returns true when current is below limit" do
      assert TierLimit.within_limit?(10, 5)
    end

    test "returns false when current equals limit" do
      refute TierLimit.within_limit?(10, 10)
    end

    test "returns false when current exceeds limit" do
      refute TierLimit.within_limit?(10, 15)
    end
  end

  # =========================================================================
  # format_limit/1
  # =========================================================================

  describe "format_limit/1" do
    test "returns Unlimited for nil" do
      assert TierLimit.format_limit(nil) == "Unlimited"
    end

    test "returns string representation for integer" do
      assert TierLimit.format_limit(100) == "100"
    end

    test "returns string for zero" do
      assert TierLimit.format_limit(0) == "0"
    end
  end

  # =========================================================================
  # format_bytes/1
  # =========================================================================

  describe "format_bytes/1" do
    test "returns Unlimited for nil" do
      assert TierLimit.format_bytes(nil) == "Unlimited"
    end

    test "formats bytes" do
      assert TierLimit.format_bytes(512) == "512 B"
    end

    test "formats kilobytes" do
      assert TierLimit.format_bytes(2048) == "2.0 KB"
    end

    test "formats megabytes" do
      assert TierLimit.format_bytes(5_242_880) == "5.0 MB"
    end

    test "formats gigabytes" do
      assert TierLimit.format_bytes(5_368_709_120) == "5.0 GB"
    end
  end

  # =========================================================================
  # Database persistence
  # =========================================================================

  describe "database insert" do
    test "inserts a valid tier limit" do
      attrs = %{
        tier: "premium",
        display_name: "Premium",
        description: "Full access",
        is_active: true,
        position: 1,
        price_monthly_cents: 999,
        max_forums_owned: 10,
        max_storage_bytes: 5_368_709_120,
        support_level: "priority"
      }

      assert {:ok, tier} =
               %TierLimit{}
               |> TierLimit.changeset(attrs)
               |> Repo.insert()

      assert tier.tier == "premium"
      assert tier.display_name == "Premium"
      assert tier.price_monthly_cents == 999
      assert tier.max_forums_owned == 10
      assert tier.support_level == "priority"
    end

    test "enforces unique tier constraint" do
      attrs = %{tier: "free", display_name: "Free Tier", position: 0}

      assert {:ok, _} =
               %TierLimit{}
               |> TierLimit.changeset(attrs)
               |> Repo.insert()

      assert {:error, changeset} =
               %TierLimit{}
               |> TierLimit.changeset(%{tier: "free", display_name: "Another Free"})
               |> Repo.insert()

      assert "has already been taken" in errors_on(changeset).tier
    end
  end
end
