defmodule CGraph.Repo.Migrations.SeedRemainingAchievementsAndQuests do
  @moduledoc """
  Seeds 3 additional achievements (37→40) and 2 additional weekly quests (8→10)
  to match the gamification spec distribution:
  - 40 achievements across 6 categories
  - 10 daily / 10 weekly / 3 monthly quest templates
  Uses ON CONFLICT (slug) DO UPDATE for idempotency.
  """
  use Ecto.Migration

  def up do
    # ==================== 3 ADDITIONAL ACHIEVEMENTS (37 → 40) ====================
    execute """
    INSERT INTO achievements (id, slug, title, description, category, rarity, icon, xp_reward, coin_reward, max_progress, is_hidden, sort_order, inserted_at, updated_at) VALUES
    -- Legendary: Voice pioneer
    (gen_random_uuid(), 'voice_pioneer', 'Voice Pioneer', 'Complete your first voice call', 'legendary', 'rare', '🎤', 300, 75, 1, false, 201, NOW(), NOW()),
    -- Mastery: Daily consistency
    (gen_random_uuid(), 'daily_grinder', 'Daily Grinder', 'Complete 10 daily quests', 'mastery', 'uncommon', '⚙️', 250, 60, 10, false, 26, NOW(), NOW()),
    -- Secret: Easter egg
    (gen_random_uuid(), 'early_bird', 'Early Bird', 'Be active between 5-6 AM', 'secret', 'rare', '🐦', 250, 100, 1, true, 102, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      category = EXCLUDED.category,
      rarity = EXCLUDED.rarity,
      icon = EXCLUDED.icon,
      xp_reward = EXCLUDED.xp_reward,
      coin_reward = EXCLUDED.coin_reward,
      max_progress = EXCLUDED.max_progress,
      is_hidden = EXCLUDED.is_hidden,
      sort_order = EXCLUDED.sort_order,
      updated_at = NOW()
    """

    # ==================== 2 ADDITIONAL WEEKLY QUESTS (8 → 10) ====================
    execute """
    INSERT INTO quests (id, slug, title, description, type, xp_reward, coin_reward, objectives, is_active, repeatable, sort_order, inserted_at, updated_at) VALUES
    -- Weekly quest 9: Voice engagement
    (gen_random_uuid(), 'weekly_voice_calls', 'Voice Connector', 'Make 3 voice calls this week', 'weekly', 300, 60, '{"objectives": [{"id": "voice_call", "description": "Make 3 voice calls", "type": "voice_call", "target": 3}]}', true, true, 28, NOW(), NOW()),
    -- Weekly quest 10: Achievement hunter
    (gen_random_uuid(), 'weekly_achievements', 'Achievement Hunter', 'Unlock 2 achievements this week', 'weekly', 350, 75, '{"objectives": [{"id": "achievement_unlocked", "description": "Unlock 2 achievements", "type": "achievement_unlocked", "target": 2}]}', true, true, 29, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      type = EXCLUDED.type,
      xp_reward = EXCLUDED.xp_reward,
      coin_reward = EXCLUDED.coin_reward,
      objectives = EXCLUDED.objectives,
      is_active = EXCLUDED.is_active,
      repeatable = EXCLUDED.repeatable,
      sort_order = EXCLUDED.sort_order,
      updated_at = NOW()
    """
  end

  def down do
    for slug <- ["voice_pioneer", "daily_grinder", "early_bird"] do
      execute "DELETE FROM achievements WHERE slug = '#{slug}'"
    end

    for slug <- ["weekly_voice_calls", "weekly_achievements"] do
      execute "DELETE FROM quests WHERE slug = '#{slug}'"
    end
  end
end
