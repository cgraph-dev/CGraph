defmodule CGraphWeb.API.V1.ReferralJSON do
  @moduledoc """
  JSON rendering for Referral endpoints.
  """

  # ========================================
  # CODE
  # ========================================

  def code(%{code: code}) do
    %{data: code_data(code)}
  end

  defp code_data(code) when is_binary(code) do
    %{code: code}
  end
  defp code_data(code) when is_map(code) do
    %{
      code: get_val(code, :code),
      created_at: get_val(code, :created_at),
      uses: get_val(code, :uses, 0)
    }
  end

  # ========================================
  # VALIDATION
  # ========================================

  def validation(%{valid: valid, referrer: referrer}) do
    %{
      data: %{
        valid: valid,
        referrer: referrer_data(referrer)
      }
    }
  end

  def validation(%{valid: valid, error: error}) do
    %{
      data: %{
        valid: valid,
        error: error
      }
    }
  end

  defp referrer_data(nil), do: nil
  defp referrer_data(referrer) do
    %{
      id: referrer.id,
      username: referrer.username,
      display_name: referrer.display_name,
      avatar: referrer.avatar
    }
  end

  # ========================================
  # REFERRALS
  # ========================================

  def referrals(%{referrals: referrals, pagination: pagination}) do
    %{
      data: for(ref <- referrals, do: referral_data(ref)),
      pagination: pagination_data(pagination)
    }
  end

  def referral(%{referral: referral}) do
    %{data: referral_data(referral)}
  end

  defp referral_data(referral) do
    %{
      id: referral.id,
      referrer_id: referral.referrer_id,
      referred_id: referral.referred_id,
      referred_user: referred_user_data(referral.referred_user),
      status: referral.status,
      reward_earned: referral.reward_earned,
      confirmed_at: referral.confirmed_at,
      inserted_at: referral.inserted_at
    }
  end

  defp referred_user_data(nil), do: nil
  defp referred_user_data(%Ecto.Association.NotLoaded{}), do: nil
  defp referred_user_data(user) do
    %{
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      avatar: user.avatar,
      joined_at: user.inserted_at
    }
  end

  # ========================================
  # STATS
  # ========================================

  def stats(%{stats: stats}) do
    %{
      data: %{
        total_referrals: get_val(stats, :total_referrals, 0),
        pending_referrals: get_val(stats, :pending_referrals, 0),
        confirmed_referrals: get_val(stats, :confirmed_referrals, 0),
        total_rewards_earned: get_val(stats, :total_rewards_earned, 0),
        current_tier: get_val(stats, :current_tier),
        next_tier_progress: get_val(stats, :next_tier_progress, 0),
        referrals_this_month: get_val(stats, :referrals_this_month, 0),
        referrals_this_week: get_val(stats, :referrals_this_week, 0),
        rank: get_val(stats, :rank)
      }
    }
  end

  # ========================================
  # LEADERBOARD
  # ========================================

  def leaderboard(%{leaderboard: leaderboard}) do
    %{
      data: for({entry, index} <- Enum.with_index(leaderboard, 1), do: leaderboard_entry(entry, index))
    }
  end

  defp leaderboard_entry(entry, rank) do
    %{
      rank: rank,
      user: %{
        id: get_val(entry, :user_id),
        username: get_val(entry, :username),
        display_name: get_val(entry, :display_name),
        avatar: get_val(entry, :avatar)
      },
      referral_count: get_val(entry, :referral_count),
      points: get_val(entry, :points, 0)
    }
  end

  # ========================================
  # REWARDS
  # ========================================

  def reward_tiers(%{tiers: tiers}) do
    %{data: for(tier <- tiers, do: tier_data(tier))}
  end

  def reward(%{reward: reward}) do
    %{data: reward_data(reward)}
  end

  defp tier_data(tier) do
    %{
      id: get_val(tier, :id),
      name: get_val(tier, :name),
      description: get_val(tier, :description),
      required_referrals: get_val(tier, :required_referrals),
      reward_type: get_val(tier, :reward_type),
      reward_value: get_val(tier, :reward_value),
      icon: get_val(tier, :icon),
      unlocked: get_val(tier, :unlocked, false),
      claimed: get_val(tier, :claimed, false),
      progress: get_val(tier, :progress, 0)
    }
  end

  defp reward_data(reward) do
    %{
      id: reward.id,
      tier_id: reward.tier_id,
      tier: tier_data(reward.tier),
      claimed_at: reward.inserted_at,
      status: reward.status
    }
  end

  # ========================================
  # HELPERS
  # ========================================

  defp pagination_data(nil), do: nil
  defp pagination_data(pagination) do
    %{
      page: get_val(pagination, :page),
      per_page: get_val(pagination, :per_page),
      total_count: get_val(pagination, :total_count),
      total_pages: get_val(pagination, :total_pages)
    }
  end

  # Flexible key access: tries atom key, then string key, with optional default.
  defp get_val(map, key, default \\ nil) do
    map[key] || map[to_string(key)] || default
  end
end
