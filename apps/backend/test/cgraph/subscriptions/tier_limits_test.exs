defmodule CGraph.Subscriptions.TierLimitsTest do
  @moduledoc """
  Tests for the TierLimits context module — tier queries,
  user tier resolution, override management, and limit calculations.
  """
  use Cgraph.DataCase, async: true

  import CGraph.Factory

  alias CGraph.Subscriptions.{TierLimit, TierLimits, UserTierOverride}

  setup do
    # Initialize ETS cache that TierLimits uses for caching
    TierLimits.init_cache()
    :ok
  end

  # =========================================================================
  # Helpers
  # =========================================================================

  defp insert_tier(tier_name, attrs \\ %{}) do
    defaults = %{
      tier: tier_name,
      display_name: String.capitalize(tier_name),
      is_active: true,
      position: tier_position(tier_name),
      max_forums_owned: tier_forums(tier_name),
      max_storage_bytes: tier_storage(tier_name)
    }

    %TierLimit{}
    |> TierLimit.changeset(Map.merge(defaults, attrs))
    |> Repo.insert!()
  end

  defp tier_position("free"), do: 0
  defp tier_position("premium"), do: 1
  defp tier_position("enterprise"), do: 2
  defp tier_position(_), do: 0

  defp tier_forums("free"), do: 1
  defp tier_forums("premium"), do: 10
  defp tier_forums("enterprise"), do: nil  # unlimited
  defp tier_forums(_), do: 1

  defp tier_storage("free"), do: 104_857_600       # 100 MB
  defp tier_storage("premium"), do: 5_368_709_120   # 5 GB
  defp tier_storage("enterprise"), do: nil           # unlimited
  defp tier_storage(_), do: 104_857_600

  defp insert_override(user, key, value, opts \\ []) do
    attrs = %{
      user_id: user.id,
      limit_key: to_string(key),
      override_value: to_string(value),
      reason: Keyword.get(opts, :reason),
      granted_by_id: Keyword.get(opts, :granted_by_id),
      expires_at: Keyword.get(opts, :expires_at)
    }

    %UserTierOverride{}
    |> UserTierOverride.changeset(attrs)
    |> Repo.insert!()
  end

  # =========================================================================
  # Tier Queries
  # =========================================================================

  describe "list_active_tiers/0" do
    test "returns only active tiers ordered by position" do
      insert_tier("free")
      insert_tier("premium")
      insert_tier("enterprise", %{is_active: false})

      tiers = TierLimits.list_active_tiers()
      assert length(tiers) >= 2
      tier_names = Enum.map(tiers, & &1.tier)
      assert "free" in tier_names
      assert "premium" in tier_names
    end
  end

  describe "list_all_tiers/0" do
    test "includes inactive tiers" do
      insert_tier("free")
      insert_tier("premium", %{is_active: false})

      tiers = TierLimits.list_all_tiers()
      tier_names = Enum.map(tiers, & &1.tier)
      assert "free" in tier_names
      assert "premium" in tier_names
    end
  end

  describe "get_tier_from_db/1" do
    test "returns tier by name" do
      insert_tier("premium")

      assert {:ok, tier} = TierLimits.get_tier_from_db("premium")
      assert tier.tier == "premium"
      assert tier.display_name == "Premium"
    end

    test "returns error for non-existent tier" do
      assert {:error, :tier_not_found} = TierLimits.get_tier_from_db("nonexistent")
    end
  end

  describe "get_tier_by_id/1" do
    test "returns tier by ID" do
      inserted = insert_tier("premium")

      assert {:ok, tier} = TierLimits.get_tier_by_id(inserted.id)
      assert tier.tier == "premium"
    end

    test "returns error for invalid ID" do
      assert {:error, :tier_not_found} = TierLimits.get_tier_by_id(Ecto.UUID.generate())
    end
  end

  # =========================================================================
  # Tier CRUD
  # =========================================================================

  describe "create_tier/1" do
    test "creates a new tier" do
      assert {:ok, tier} = TierLimits.create_tier(%{
        tier: "premium",
        display_name: "Premium Plan",
        position: 1,
        price_monthly_cents: 999
      })

      assert tier.tier == "premium"
      assert tier.price_monthly_cents == 999
    end

    test "rejects invalid tier name" do
      assert {:error, changeset} = TierLimits.create_tier(%{
        tier: "gold",
        display_name: "Gold"
      })

      refute changeset.valid?
    end
  end

  describe "update_tier/2" do
    test "updates tier attributes" do
      tier = insert_tier("premium", %{price_monthly_cents: 999})

      assert {:ok, updated} = TierLimits.update_tier(tier, %{price_monthly_cents: 1499})
      assert updated.price_monthly_cents == 1499
    end
  end

  # =========================================================================
  # User Tier Resolution
  # =========================================================================

  describe "get_user_tier/1 with User struct" do
    test "returns user subscription_tier" do
      user = insert(:user, subscription_tier: "premium")
      assert TierLimits.get_user_tier(user) == "premium"
    end

    test "returns free for nil subscription_tier" do
      user = insert(:user)
      user = %{user | subscription_tier: nil}
      assert TierLimits.get_user_tier(user) == "free"
    end

    test "returns free for free tier user" do
      user = insert(:user, subscription_tier: "free")
      assert TierLimits.get_user_tier(user) == "free"
    end
  end

  describe "get_user_tier/1 with user_id" do
    test "returns tier for valid user ID" do
      user = insert(:user, subscription_tier: "enterprise")
      assert TierLimits.get_user_tier(user.id) == "enterprise"
    end

    test "returns free for non-existent user ID" do
      assert TierLimits.get_user_tier(Ecto.UUID.generate()) == "free"
    end
  end

  # =========================================================================
  # Override Management
  # =========================================================================

  describe "get_user_overrides/1" do
    test "returns active overrides for user" do
      user = insert(:user)
      insert_override(user, :max_forums_owned, 50)
      insert_override(user, :max_storage_bytes, 10_737_418_240)

      overrides = TierLimits.get_user_overrides(user.id)
      assert length(overrides) == 2
    end

    test "excludes expired overrides" do
      user = insert(:user)
      past = DateTime.utc_now() |> DateTime.add(-86_400, :second)
      insert_override(user, :max_forums_owned, 50, expires_at: past)

      overrides = TierLimits.get_user_overrides(user.id)
      assert Enum.empty?(overrides)
    end

    test "includes overrides with nil expires_at (never expires)" do
      user = insert(:user)
      insert_override(user, :max_forums_owned, 50, expires_at: nil)

      overrides = TierLimits.get_user_overrides(user.id)
      assert length(overrides) == 1
    end
  end

  describe "get_user_override/2" do
    test "returns specific override for user" do
      user = insert(:user)
      insert_override(user, :max_forums_owned, 50)

      override = TierLimits.get_user_override(user.id, "max_forums_owned")
      assert override != nil
      assert override.override_value == "50"
    end

    test "returns nil for non-existent override" do
      user = insert(:user)

      override = TierLimits.get_user_override(user.id, "max_forums_owned")
      assert override == nil
    end
  end

  describe "set_user_override/4" do
    test "creates a new override" do
      user = insert(:user)

      assert {:ok, override} = TierLimits.set_user_override(
        user.id, :max_forums_owned, 50, reason: "Beta tester"
      )

      assert override.override_value == "50"
      assert override.reason == "Beta tester"
    end

    test "updates an existing override" do
      user = insert(:user)
      insert_override(user, :max_forums_owned, 50)

      assert {:ok, updated} = TierLimits.set_user_override(
        user.id, :max_forums_owned, 100, reason: "Upgrade"
      )

      assert updated.override_value == "100"
      assert updated.reason == "Upgrade"
    end
  end

  describe "remove_user_override/2" do
    test "removes an override" do
      user = insert(:user)
      insert_override(user, :max_forums_owned, 50)

      {count, _} = TierLimits.remove_user_override(user.id, "max_forums_owned")
      assert count == 1

      assert TierLimits.get_user_override(user.id, "max_forums_owned") == nil
    end

    test "no-op when override does not exist" do
      user = insert(:user)

      {count, _} = TierLimits.remove_user_override(user.id, "max_forums_owned")
      assert count == 0
    end
  end

  # =========================================================================
  # Tier Features
  # =========================================================================

  describe "get_tier_features/1" do
    test "returns features for a tier" do
      tier = insert_tier("premium")

      alias CGraph.Subscriptions.TierFeature

      {:ok, _} =
        %TierFeature{}
        |> TierFeature.changeset(%{tier_id: tier.id, feature_key: "ai.moderation"})
        |> Repo.insert()

      features = TierLimits.get_tier_features(tier.id)
      assert length(features) == 1
      assert hd(features).feature_key == "ai.moderation"
    end

    test "returns empty list when no features" do
      tier = insert_tier("free")
      assert TierLimits.get_tier_features(tier.id) == []
    end
  end

  # =========================================================================
  # Tier Comparison
  # =========================================================================

  describe "compare_tiers/2" do
    test "compares free vs premium" do
      insert_tier("free")
      insert_tier("premium")

      assert {:ok, comparison} = TierLimits.compare_tiers("free", "premium")
      assert comparison.is_upgrade == true
      assert comparison.from.tier == "free"
      assert comparison.to.tier == "premium"
      assert is_list(comparison.differences)
    end

    test "returns error for non-existent tier" do
      insert_tier("free")
      assert {:error, :tier_not_found} = TierLimits.compare_tiers("free", "nonexistent")
    end
  end

  # =========================================================================
  # Serialization
  # =========================================================================

  describe "serialize_tier/2" do
    test "serializes basic tier info" do
      tier = insert_tier("premium", %{
        price_monthly_cents: 999,
        badge_color: "#FFD700",
        badge_icon: "star"
      })

      serialized = TierLimits.serialize_tier(tier)
      assert serialized.tier == "premium"
      assert serialized.display_name == "Premium"
      assert serialized.price_monthly_cents == 999
      assert serialized.badge_color == "#FFD700"
    end

    test "includes limits when option set" do
      tier = insert_tier("premium", %{
        max_forums_owned: 10,
        max_storage_bytes: 5_368_709_120,
        ai_moderation_enabled: true
      })

      serialized = TierLimits.serialize_tier(tier, include_limits: true)
      assert serialized.limits.forums.max_owned == 10
      assert serialized.limits.storage.max_bytes == 5_368_709_120
      assert serialized.limits.ai.moderation_enabled == true
      assert serialized.features != nil
    end
  end
end
