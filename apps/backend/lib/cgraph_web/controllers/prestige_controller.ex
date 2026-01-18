defmodule CGraphWeb.PrestigeController do
  @moduledoc """
  Controller for prestige system endpoints.

  ## Endpoints
  
  - GET /api/v1/prestige - Get user's prestige status
  - POST /api/v1/prestige/reset - Perform prestige reset
  - GET /api/v1/prestige/rewards - Get available prestige rewards
  - GET /api/v1/prestige/leaderboard - Get prestige leaderboard
  """
  use CGraphWeb, :controller

  import Ecto.Query, warn: false

  alias CGraph.Repo
  alias CGraph.Gamification.UserPrestige

  action_fallback CGraphWeb.FallbackController

  @doc """
  GET /api/v1/prestige
  Get current user's prestige status and bonuses.
  """
  def show(conn, _params) do
    user = conn.assigns.current_user
    
    prestige = get_or_create_prestige(user.id)
    
    conn
    |> put_status(:ok)
    |> json(%{
      prestige: serialize_prestige(prestige),
      nextPrestigeRequirements: calculate_next_prestige_requirements(prestige),
      canPrestige: can_prestige?(prestige)
    })
  end

  @doc """
  POST /api/v1/prestige/reset
  Perform a prestige reset, gaining bonuses and exclusive rewards.
  """
  def reset(conn, _params) do
    user = conn.assigns.current_user
    prestige = get_or_create_prestige(user.id)
    
    if can_prestige?(prestige) do
      {:ok, updated} = perform_prestige_reset(prestige)
      
      # Award exclusive rewards for this prestige level
      exclusive_rewards = get_exclusive_rewards(updated.prestige_level)
      
      conn
      |> put_status(:ok)
      |> json(%{
        success: true,
        prestige: serialize_prestige(updated),
        rewards: exclusive_rewards,
        newBonuses: %{
          xpBonus: updated.xp_bonus,
          coinBonus: updated.coin_bonus,
          karmaBonus: updated.karma_bonus,
          dropRateBonus: updated.drop_rate_bonus
        }
      })
    else
      conn
      |> put_status(:bad_request)
      |> json(%{
        error: "Cannot prestige yet",
        requirements: calculate_next_prestige_requirements(prestige)
      })
    end
  end

  @doc """
  GET /api/v1/prestige/rewards
  Get all available prestige rewards by tier.
  """
  def rewards(conn, _params) do
    rewards = get_all_prestige_rewards()
    
    conn
    |> put_status(:ok)
    |> json(%{rewards: rewards})
  end

  @doc """
  GET /api/v1/prestige/leaderboard
  Get prestige leaderboard.
  """
  def leaderboard(conn, params) do
    limit = min(String.to_integer(params["limit"] || "50"), 100)
    offset = String.to_integer(params["offset"] || "0")
    
    query = from p in UserPrestige,
      join: u in assoc(p, :user),
      where: p.prestige_level > 0,
      order_by: [desc: p.prestige_level, desc: p.lifetime_xp],
      limit: ^limit,
      offset: ^offset,
      select: %{
        user_id: u.id,
        username: u.username,
        display_name: u.display_name,
        avatar_url: u.avatar_url,
        prestige_level: p.prestige_level,
        lifetime_xp: p.lifetime_xp,
        total_resets: p.total_resets
      }
    
    entries = Repo.all(query)
    
    # Add rank
    entries_with_rank = entries
    |> Enum.with_index(offset + 1)
    |> Enum.map(fn {entry, rank} -> Map.put(entry, :rank, rank) end)
    
    conn
    |> put_status(:ok)
    |> json(%{
      leaderboard: entries_with_rank,
      pagination: %{
        limit: limit,
        offset: offset,
        hasMore: length(entries) == limit
      }
    })
  end

  # ==================== PRIVATE HELPERS ====================

  defp get_or_create_prestige(user_id) do
    case Repo.get_by(UserPrestige, user_id: user_id) do
      nil ->
        {:ok, prestige} = %UserPrestige{}
        |> UserPrestige.changeset(%{user_id: user_id})
        |> Repo.insert()
        prestige
      prestige -> prestige
    end
  end

  defp can_prestige?(prestige) do
    required_xp = UserPrestige.xp_required_for_prestige(prestige.prestige_level)
    prestige.prestige_xp >= required_xp
  end

  defp perform_prestige_reset(prestige) do
    new_level = prestige.prestige_level + 1
    
    # Calculate new bonuses
    new_xp_bonus = UserPrestige.bonus_for_prestige_level(new_level, :xp)
    new_coin_bonus = UserPrestige.bonus_for_prestige_level(new_level, :coin)
    new_karma_bonus = UserPrestige.bonus_for_prestige_level(new_level, :karma)
    new_drop_rate_bonus = UserPrestige.bonus_for_prestige_level(new_level, :drop_rate)
    
    # Record history entry
    history_entry = %{
      "level" => new_level,
      "prestiged_at" => DateTime.utc_now() |> DateTime.to_iso8601(),
      "xp_at_prestige" => prestige.prestige_xp,
      "lifetime_xp_at_prestige" => prestige.lifetime_xp
    }
    
    new_history = [history_entry | prestige.prestige_history || []]
    
    prestige
    |> UserPrestige.prestige_changeset(%{
      prestige_level: new_level,
      prestige_xp: 0,
      xp_to_next_prestige: UserPrestige.xp_required_for_prestige(new_level),
      xp_bonus: new_xp_bonus,
      coin_bonus: new_coin_bonus,
      karma_bonus: new_karma_bonus,
      drop_rate_bonus: new_drop_rate_bonus,
      prestige_history: new_history,
      total_resets: (prestige.total_resets || 0) + 1,
      last_prestige_at: DateTime.utc_now()
    })
    |> Repo.update()
  end

  defp calculate_next_prestige_requirements(prestige) do
    required_xp = UserPrestige.xp_required_for_prestige(prestige.prestige_level)
    
    %{
      requiredXp: required_xp,
      currentXp: prestige.prestige_xp,
      progress: if(required_xp > 0, do: prestige.prestige_xp / required_xp * 100, else: 0),
      nextLevel: prestige.prestige_level + 1
    }
  end

  defp get_exclusive_rewards(prestige_level) do
    # Define exclusive rewards for each prestige level
    base_rewards = [
      %{type: "title", name: "Prestige #{prestige_level}"},
      %{type: "xp_bonus", amount: 0.05}
    ]
    
    # Add special rewards at milestone levels
    milestone_rewards = cond do
      prestige_level >= 10 -> [%{type: "border", name: "Prestige Master Border"}]
      prestige_level >= 5 -> [%{type: "effect", name: "Prestige Glow Effect"}]
      prestige_level >= 3 -> [%{type: "badge", name: "Dedicated Player Badge"}]
      true -> []
    end
    
    base_rewards ++ milestone_rewards
  end

  defp get_all_prestige_rewards do
    # Return all available prestige rewards by tier
    1..20
    |> Enum.map(fn level ->
      %{
        level: level,
        xpRequired: UserPrestige.xp_required_for_prestige(level - 1),
        bonuses: %{
          xp: UserPrestige.bonus_for_prestige_level(level, :xp),
          coins: UserPrestige.bonus_for_prestige_level(level, :coin),
          karma: UserPrestige.bonus_for_prestige_level(level, :karma),
          dropRate: UserPrestige.bonus_for_prestige_level(level, :drop_rate)
        },
        exclusiveRewards: get_exclusive_rewards(level)
      }
    end)
  end

  defp serialize_prestige(prestige) do
    %{
      level: prestige.prestige_level,
      xp: prestige.prestige_xp,
      xpToNext: prestige.xp_to_next_prestige,
      bonuses: %{
        xp: prestige.xp_bonus,
        coins: prestige.coin_bonus,
        karma: prestige.karma_bonus,
        dropRate: prestige.drop_rate_bonus
      },
      lifetime: %{
        xp: prestige.lifetime_xp,
        karma: prestige.lifetime_karma,
        coinsEarned: prestige.lifetime_coins_earned,
        messages: prestige.lifetime_messages
      },
      totalResets: prestige.total_resets,
      lastPrestigeAt: prestige.last_prestige_at,
      exclusiveTitles: prestige.exclusive_titles,
      exclusiveBorders: prestige.exclusive_borders,
      exclusiveEffects: prestige.exclusive_effects
    }
  end
end
