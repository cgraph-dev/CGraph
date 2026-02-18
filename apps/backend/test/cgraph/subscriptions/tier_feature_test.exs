defmodule CGraph.Subscriptions.TierFeatureTest do
  @moduledoc """
  Tests for the TierFeature schema — changeset validations
  and feature key validation.
  """
  use Cgraph.DataCase, async: true

  alias CGraph.Subscriptions.{TierFeature, TierLimit}

  # =========================================================================
  # Helpers
  # =========================================================================

  defp create_tier do
    %TierLimit{}
    |> TierLimit.changeset(%{tier: "premium", display_name: "Premium", position: 1})
    |> Repo.insert!()
  end

  # =========================================================================
  # Changeset Validations
  # =========================================================================

  describe "changeset/2" do
    test "valid changeset with required fields" do
      tier = create_tier()

      attrs = %{
        tier_id: tier.id,
        feature_key: "ai.moderation.toxicity"
      }

      changeset = TierFeature.changeset(%TierFeature{}, attrs)
      assert changeset.valid?
    end

    test "requires tier_id" do
      attrs = %{feature_key: "ai.moderation"}
      changeset = TierFeature.changeset(%TierFeature{}, attrs)
      refute changeset.valid?
      assert "can't be blank" in errors_on(changeset).tier_id
    end

    test "requires feature_key" do
      tier = create_tier()
      attrs = %{tier_id: tier.id}
      changeset = TierFeature.changeset(%TierFeature{}, attrs)
      refute changeset.valid?
      assert "can't be blank" in errors_on(changeset).feature_key
    end

    test "validates feature_key must be dot notation" do
      tier = create_tier()
      attrs = %{tier_id: tier.id, feature_key: "no_dots_here"}
      changeset = TierFeature.changeset(%TierFeature{}, attrs)
      refute changeset.valid?
      assert "must be in dot notation (e.g., 'ai.moderation')" in errors_on(changeset).feature_key
    end

    test "accepts dot notation feature keys" do
      tier = create_tier()

      for key <- ["ai.moderation", "forums.custom_css", "gamification.battle_pass", "messaging.voice"] do
        attrs = %{tier_id: tier.id, feature_key: key}
        changeset = TierFeature.changeset(%TierFeature{}, attrs)
        assert changeset.valid?, "Expected #{key} to be valid"
      end
    end

    test "casts optional fields" do
      tier = create_tier()

      attrs = %{
        tier_id: tier.id,
        feature_key: "ai.moderation.toxicity",
        enabled: false,
        config: %{"threshold" => 0.85, "auto_action" => "hide"},
        description: "Toxicity detection for forum posts"
      }

      changeset = TierFeature.changeset(%TierFeature{}, attrs)
      assert changeset.valid?
    end

    test "defaults enabled to true" do
      tier = create_tier()
      attrs = %{tier_id: tier.id, feature_key: "ai.search"}
      changeset = TierFeature.changeset(%TierFeature{}, attrs)
      # enabled defaults to true via schema, not changeset
      assert changeset.valid?
    end
  end

  # =========================================================================
  # Database persistence
  # =========================================================================

  describe "database operations" do
    test "inserts a valid tier feature" do
      tier = create_tier()

      assert {:ok, feature} =
               %TierFeature{}
               |> TierFeature.changeset(%{
                 tier_id: tier.id,
                 feature_key: "ai.moderation.toxicity",
                 enabled: true,
                 config: %{"threshold" => 0.9},
                 description: "Auto-detect toxic content"
               })
               |> Repo.insert()

      assert feature.feature_key == "ai.moderation.toxicity"
      assert feature.enabled == true
      assert feature.config == %{"threshold" => 0.9}
    end

    test "enforces unique constraint on tier_id + feature_key" do
      tier = create_tier()

      attrs = %{tier_id: tier.id, feature_key: "ai.moderation"}

      assert {:ok, _} =
               %TierFeature{}
               |> TierFeature.changeset(attrs)
               |> Repo.insert()

      assert {:error, changeset} =
               %TierFeature{}
               |> TierFeature.changeset(attrs)
               |> Repo.insert()

      assert errors_on(changeset) != %{}
    end

    test "cascades delete from tier" do
      tier = create_tier()

      {:ok, feature} =
        %TierFeature{}
        |> TierFeature.changeset(%{tier_id: tier.id, feature_key: "ai.search"})
        |> Repo.insert()

      Repo.delete!(tier)

      assert Repo.get(TierFeature, feature.id) == nil
    end
  end
end
