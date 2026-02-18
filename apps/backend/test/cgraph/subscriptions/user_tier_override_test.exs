defmodule CGraph.Subscriptions.UserTierOverrideTest do
  @moduledoc """
  Tests for the UserTierOverride schema — changeset validations,
  parse_value/2, and expired?/1.
  """
  use Cgraph.DataCase, async: true

  import CGraph.Factory

  alias CGraph.Subscriptions.UserTierOverride

  # =========================================================================
  # Changeset Validations
  # =========================================================================

  describe "changeset/2" do
    test "valid changeset with required fields" do
      user = insert(:user)

      attrs = %{
        user_id: user.id,
        limit_key: "max_forums_owned",
        override_value: "100"
      }

      changeset = UserTierOverride.changeset(%UserTierOverride{}, attrs)
      assert changeset.valid?
    end

    test "requires user_id" do
      attrs = %{limit_key: "max_forums_owned", override_value: "100"}
      changeset = UserTierOverride.changeset(%UserTierOverride{}, attrs)
      refute changeset.valid?
      assert "can't be blank" in errors_on(changeset).user_id
    end

    test "requires limit_key" do
      user = insert(:user)
      attrs = %{user_id: user.id, override_value: "100"}
      changeset = UserTierOverride.changeset(%UserTierOverride{}, attrs)
      refute changeset.valid?
      assert "can't be blank" in errors_on(changeset).limit_key
    end

    test "requires override_value" do
      user = insert(:user)
      attrs = %{user_id: user.id, limit_key: "max_forums_owned"}
      changeset = UserTierOverride.changeset(%UserTierOverride{}, attrs)
      refute changeset.valid?
      assert "can't be blank" in errors_on(changeset).override_value
    end

    test "validates limit_key is in valid_limit_keys" do
      user = insert(:user)

      attrs = %{
        user_id: user.id,
        limit_key: "invalid_key",
        override_value: "100"
      }

      changeset = UserTierOverride.changeset(%UserTierOverride{}, attrs)
      refute changeset.valid?
      assert "is invalid" in errors_on(changeset).limit_key
    end

    test "accepts all valid limit keys" do
      user = insert(:user)

      for key <- UserTierOverride.valid_limit_keys() do
        attrs = %{user_id: user.id, limit_key: key, override_value: "10"}
        changeset = UserTierOverride.changeset(%UserTierOverride{}, attrs)
        assert changeset.valid?, "Expected #{key} to be valid"
      end
    end

    test "casts optional fields" do
      user = insert(:user)
      admin = insert(:user, is_admin: true)

      attrs = %{
        user_id: user.id,
        limit_key: "max_forums_owned",
        override_value: "50",
        reason: "Beta tester bonus",
        granted_by_id: admin.id,
        expires_at: DateTime.utc_now() |> DateTime.add(30 * 86_400, :second)
      }

      changeset = UserTierOverride.changeset(%UserTierOverride{}, attrs)
      assert changeset.valid?
    end
  end

  # =========================================================================
  # valid_limit_keys/0
  # =========================================================================

  describe "valid_limit_keys/0" do
    test "returns a non-empty list of strings" do
      keys = UserTierOverride.valid_limit_keys()
      assert is_list(keys)
      assert length(keys) > 0
      assert Enum.all?(keys, &is_binary/1)
    end

    test "includes common limit keys" do
      keys = UserTierOverride.valid_limit_keys()
      assert "max_forums_owned" in keys
      assert "max_storage_bytes" in keys
      assert "max_friends" in keys
      assert "concurrent_sessions" in keys
    end
  end

  # =========================================================================
  # parse_value/2
  # =========================================================================

  describe "parse_value/2" do
    test "parses integer value for standard keys" do
      assert {:ok, 42} = UserTierOverride.parse_value("max_forums_owned", "42")
    end

    test "parses integer for storage keys" do
      assert {:ok, 5_368_709_120} = UserTierOverride.parse_value("max_storage_bytes", "5368709120")
    end

    test "returns error for non-integer string on integer key" do
      assert {:error, _} = UserTierOverride.parse_value("max_forums_owned", "abc")
    end

    test "returns error for float string on integer key" do
      assert {:error, _} = UserTierOverride.parse_value("max_forums_owned", "1.5")
    end

    test "parses float value for rate_limit_multiplier" do
      assert {:ok, 2.5} = UserTierOverride.parse_value("rate_limit_multiplier", "2.5")
    end

    test "returns error for non-float on rate_limit_multiplier" do
      assert {:error, _} = UserTierOverride.parse_value("rate_limit_multiplier", "abc")
    end
  end

  # =========================================================================
  # expired?/1
  # =========================================================================

  describe "expired?/1" do
    test "returns false when expires_at is nil (never expires)" do
      override = %UserTierOverride{expires_at: nil}
      refute UserTierOverride.expired?(override)
    end

    test "returns true when expires_at is in the past" do
      past = DateTime.utc_now() |> DateTime.add(-86_400, :second)
      override = %UserTierOverride{expires_at: past}
      assert UserTierOverride.expired?(override)
    end

    test "returns false when expires_at is in the future" do
      future = DateTime.utc_now() |> DateTime.add(86_400, :second)
      override = %UserTierOverride{expires_at: future}
      refute UserTierOverride.expired?(override)
    end
  end

  # =========================================================================
  # Database persistence
  # =========================================================================

  describe "database operations" do
    test "inserts a valid override" do
      user = insert(:user)

      assert {:ok, override} =
               %UserTierOverride{}
               |> UserTierOverride.changeset(%{
                 user_id: user.id,
                 limit_key: "max_forums_owned",
                 override_value: "50",
                 reason: "Community moderator"
               })
               |> Repo.insert()

      assert override.user_id == user.id
      assert override.limit_key == "max_forums_owned"
      assert override.override_value == "50"
      assert override.reason == "Community moderator"
    end

    test "enforces unique constraint on user_id + limit_key" do
      user = insert(:user)

      attrs = %{
        user_id: user.id,
        limit_key: "max_forums_owned",
        override_value: "50"
      }

      assert {:ok, _} =
               %UserTierOverride{}
               |> UserTierOverride.changeset(attrs)
               |> Repo.insert()

      assert {:error, changeset} =
               %UserTierOverride{}
               |> UserTierOverride.changeset(Map.put(attrs, :override_value, "100"))
               |> Repo.insert()

      assert errors_on(changeset) != %{}
    end
  end
end
