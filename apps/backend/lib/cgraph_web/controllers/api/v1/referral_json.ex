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
      code: code[:code] || code["code"],
      created_at: code[:created_at] || code["created_at"],
      uses: code[:uses] || code["uses"] || 0
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
        total_referrals: stats[:total_referrals] || stats["total_referrals"] || 0,
        pending_referrals: stats[:pending_referrals] || stats["pending_referrals"] || 0,
        confirmed_referrals: stats[:confirmed_referrals] || stats["confirmed_referrals"] || 0,
        total_rewards_earned: stats[:total_rewards_earned] || stats["total_rewards_earned"] || 0,
        current_tier: stats[:current_tier] || stats["current_tier"],
        next_tier_progress: stats[:next_tier_progress] || stats["next_tier_progress"] || 0,
        referrals_this_month: stats[:referrals_this_month] || stats["referrals_this_month"] || 0,
        referrals_this_week: stats[:referrals_this_week] || stats["referrals_this_week"] || 0,
        rank: stats[:rank] || stats["rank"]
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
        id: entry[:user_id] || entry["user_id"],
        username: entry[:username] || entry["username"],
        display_name: entry[:display_name] || entry["display_name"],
        avatar: entry[:avatar] || entry["avatar"]
      },
      referral_count: entry[:referral_count] || entry["referral_count"],
      points: entry[:points] || entry["points"] || 0
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
      id: tier[:id] || tier["id"],
      name: tier[:name] || tier["name"],
      description: tier[:description] || tier["description"],
      required_referrals: tier[:required_referrals] || tier["required_referrals"],
      reward_type: tier[:reward_type] || tier["reward_type"],
      reward_value: tier[:reward_value] || tier["reward_value"],
      icon: tier[:icon] || tier["icon"],
      unlocked: tier[:unlocked] || tier["unlocked"] || false,
      claimed: tier[:claimed] || tier["claimed"] || false,
      progress: tier[:progress] || tier["progress"] || 0
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
      page: pagination[:page] || pagination["page"],
      per_page: pagination[:per_page] || pagination["per_page"],
      total_count: pagination[:total_count] || pagination["total_count"],
      total_pages: pagination[:total_pages] || pagination["total_pages"]
    }
  end
end
