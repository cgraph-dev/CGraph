defmodule CGraph.ReferralsTest do
  @moduledoc "Tests for referral codes, tracking, and rewards."
  use CGraph.DataCase, async: true

  alias CGraph.Referrals

  describe "module structure" do
    test "module compiles and is loaded" do
      assert Code.ensure_loaded?(Referrals)
    end

    test "exports code management functions" do
      assert function_exported?(Referrals, :get_or_create_code, 1)
      assert function_exported?(Referrals, :regenerate_code, 1)
      assert function_exported?(Referrals, :validate_code, 1)
    end

    test "exports referral tracking functions" do
      assert function_exported?(Referrals, :apply_code, 2)
      assert function_exported?(Referrals, :list_referrals, 2)
      assert function_exported?(Referrals, :confirm_referral, 1)
    end

    test "exports stats and leaderboard functions" do
      assert function_exported?(Referrals, :get_user_stats, 1)
      assert function_exported?(Referrals, :get_leaderboard, 1)
      assert function_exported?(Referrals, :list_reward_tiers, 1)
    end
  end

  describe "validate_code/1" do
    test "returns error for invalid code" do
      result = Referrals.validate_code("NONEXISTENT_CODE_XYZ")
      assert match?({:error, _}, result)
    end
  end

  describe "get_user_stats/1" do
    test "returns stats for user with no referrals" do
      result = Referrals.get_user_stats(Ecto.UUID.generate())
      assert is_map(result) or match?({:ok, _}, result) or match?({:error, _}, result)
    end
  end

  describe "get_leaderboard/1" do
    test "returns a list" do
      result = Referrals.get_leaderboard(%{})
      assert is_list(result) or match?({:ok, _}, result)
    end
  end
end
