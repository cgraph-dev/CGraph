defmodule CGraph.Repo.Migrations.SeedAchievementsAndQuests do
  @moduledoc """
  Seeds 30+ achievements across 6 categories and 20+ quest templates.
  Uses ON CONFLICT (slug) DO UPDATE to augment existing seeds without duplication.
  """
  use Ecto.Migration

  def up do
    # ==================== SEED ACHIEVEMENTS (30+) ====================
    # Uses ON CONFLICT to handle the 12 existing achievements from
    # migration 20260111000002_create_gamification_tables.exs
    execute """
    INSERT INTO achievements (id, slug, title, description, category, rarity, icon, xp_reward, coin_reward, max_progress, is_hidden, sort_order, inserted_at, updated_at) VALUES
    -- Social: Friends
    (gen_random_uuid(), 'first_friend', 'First Friend', 'Add your first friend', 'social', 'common', '🤝', 50, 10, 1, false, 4, NOW(), NOW()),
    (gen_random_uuid(), 'social_butterfly', 'Social Butterfly', 'Add 10 friends', 'social', 'uncommon', '🦋', 200, 50, 10, false, 3, NOW(), NOW()),
    (gen_random_uuid(), 'social_maven', 'Social Maven', 'Add 50 friends', 'social', 'rare', '🌐', 500, 100, 50, false, 5, NOW(), NOW()),
    (gen_random_uuid(), 'group_explorer', 'Group Explorer', 'Join 3 groups', 'social', 'common', '👥', 75, 15, 3, false, 6, NOW(), NOW()),
    (gen_random_uuid(), 'community_builder', 'Community Builder', 'Join 10 groups', 'social', 'uncommon', '🏗️', 200, 40, 10, false, 7, NOW(), NOW()),
    (gen_random_uuid(), 'networking_legend', 'Networking Legend', 'Add 100 friends', 'social', 'epic', '🏆', 1000, 250, 100, false, 8, NOW(), NOW()),
    -- Social: Messaging
    (gen_random_uuid(), 'first_message', 'Hello World', 'Send your first message', 'social', 'common', '💬', 50, 10, 1, false, 1, NOW(), NOW()),
    (gen_random_uuid(), 'chatterbox', 'Chatterbox', 'Send 100 messages', 'social', 'uncommon', '🗨️', 200, 50, 100, false, 9, NOW(), NOW()),
    (gen_random_uuid(), 'motor_mouth', 'Motor Mouth', 'Send 1000 messages', 'social', 'rare', '📢', 500, 100, 1000, false, 10, NOW(), NOW()),
    (gen_random_uuid(), 'conversation_starter', 'Conversation Starter', 'Start 5 conversations', 'social', 'common', '🗣️', 100, 20, 5, false, 2, NOW(), NOW()),
    (gen_random_uuid(), 'megaphone', 'Megaphone', 'Send 5000 messages', 'social', 'rare', '📣', 750, 200, 5000, false, 11, NOW(), NOW()),
    (gen_random_uuid(), 'legendary_talker', 'Legendary Talker', 'Send 10000 messages', 'social', 'epic', '🎙️', 1500, 400, 10000, false, 12, NOW(), NOW()),
    -- Content
    (gen_random_uuid(), 'first_thread', 'First Thread', 'Create your first forum thread', 'content', 'common', '📝', 75, 15, 1, false, 13, NOW(), NOW()),
    (gen_random_uuid(), 'forum_regular', 'Forum Regular', 'Create 10 forum threads', 'content', 'uncommon', '📋', 200, 40, 10, false, 14, NOW(), NOW()),
    (gen_random_uuid(), 'forum_veteran', 'Forum Veteran', 'Create 50 forum threads', 'content', 'rare', '🏅', 500, 100, 50, false, 15, NOW(), NOW()),
    (gen_random_uuid(), 'helpful_poster', 'Helpful Poster', 'Receive 50 upvotes on posts', 'content', 'uncommon', '👍', 200, 50, 50, false, 16, NOW(), NOW()),
    (gen_random_uuid(), 'respected_voice', 'Respected Voice', 'Receive 200 upvotes on posts', 'content', 'rare', '🌟', 500, 150, 200, false, 17, NOW(), NOW()),
    (gen_random_uuid(), 'forum_legend', 'Forum Legend', 'Receive 1000 upvotes on posts', 'content', 'epic', '💫', 1500, 400, 1000, false, 18, NOW(), NOW()),
    -- Exploration: Levels
    (gen_random_uuid(), 'level_5', 'Rising Star', 'Reach level 5', 'exploration', 'common', '⭐', 100, 50, 1, false, 31, NOW(), NOW()),
    (gen_random_uuid(), 'level_10', 'Seasoned Member', 'Reach level 10', 'exploration', 'uncommon', '🌟', 250, 100, 1, false, 32, NOW(), NOW()),
    (gen_random_uuid(), 'level_25', 'Veteran', 'Reach level 25', 'exploration', 'rare', '💫', 500, 250, 1, false, 33, NOW(), NOW()),
    (gen_random_uuid(), 'level_50', 'Legend', 'Reach level 50', 'exploration', 'epic', '🏆', 1000, 500, 1, false, 34, NOW(), NOW()),
    (gen_random_uuid(), 'first_quest', 'Quest Beginner', 'Complete your first quest', 'exploration', 'common', '📜', 75, 20, 1, false, 35, NOW(), NOW()),
    (gen_random_uuid(), 'quest_master', 'Quest Master', 'Complete 50 quests', 'exploration', 'rare', '🗡️', 750, 200, 50, false, 36, NOW(), NOW()),
    (gen_random_uuid(), 'explorer', 'Explorer', 'Visit 10 different forums', 'exploration', 'common', '🧭', 100, 20, 10, false, 30, NOW(), NOW()),
    (gen_random_uuid(), 'first_purchase', 'First Purchase', 'Buy your first item from the shop', 'exploration', 'common', '🛒', 50, 10, 1, false, 37, NOW(), NOW()),
    (gen_random_uuid(), 'border_collector', 'Border Collector', 'Own 5 avatar borders', 'exploration', 'uncommon', '🖼️', 200, 50, 5, false, 38, NOW(), NOW()),
    (gen_random_uuid(), 'title_collector', 'Title Collector', 'Own 5 titles', 'exploration', 'uncommon', '🏷️', 200, 50, 5, false, 39, NOW(), NOW()),
    -- Mastery: Streaks
    (gen_random_uuid(), 'week_warrior', 'Week Warrior', 'Maintain a 7-day login streak', 'mastery', 'uncommon', '🔥', 200, 50, 7, false, 20, NOW(), NOW()),
    (gen_random_uuid(), 'month_master', 'Month Master', 'Maintain a 30-day login streak', 'mastery', 'epic', '💎', 1000, 500, 30, false, 21, NOW(), NOW()),
    (gen_random_uuid(), 'year_legend', 'Year Legend', 'Maintain a 365-day login streak', 'mastery', 'legendary', '👑', 10000, 5000, 365, false, 22, NOW(), NOW()),
    (gen_random_uuid(), 'week_streak', 'Dedicated', 'Maintain a 7-day streak', 'mastery', 'uncommon', '📅', 150, 30, 7, false, 23, NOW(), NOW()),
    (gen_random_uuid(), 'month_streak', 'Committed', 'Maintain a 30-day streak', 'mastery', 'rare', '📆', 750, 200, 30, false, 24, NOW(), NOW()),
    (gen_random_uuid(), 'hundred_days', 'Century Club', 'Maintain a 100-day streak', 'mastery', 'epic', '💯', 2000, 750, 100, false, 25, NOW(), NOW()),
    -- Legendary
    (gen_random_uuid(), 'early_adopter', 'Early Adopter', 'Join during the first year', 'legendary', 'legendary', '🚀', 5000, 1000, 1, false, 200, NOW(), NOW()),
    -- Secret
    (gen_random_uuid(), 'night_owl', 'Night Owl', 'Be active between 2-4 AM', 'secret', 'rare', '🦉', 250, 100, 1, true, 100, NOW(), NOW()),
    (gen_random_uuid(), 'speed_demon', 'Speed Demon', 'Send 10 messages in under a minute', 'secret', 'rare', '⚡', 300, 75, 1, true, 101, NOW(), NOW())
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

    # ==================== SEED QUEST TEMPLATES (20+) ====================
    # Templates are repeatable quests with no specific start/end dates.
    # QuestRotationWorker will create active instances from these.
    execute """
    INSERT INTO quests (id, slug, title, description, type, xp_reward, coin_reward, objectives, is_active, repeatable, sort_order, inserted_at, updated_at) VALUES
    -- Daily quests (10)
    (gen_random_uuid(), 'daily_messenger', 'Daily Messenger', 'Send messages to stay connected', 'daily', 100, 25, '{"objectives": [{"id": "message_sent", "description": "Send 5 messages", "type": "message_sent", "target": 5}]}', true, true, 1, NOW(), NOW()),
    (gen_random_uuid(), 'daily_reader', 'Daily Reader', 'Browse the forums', 'daily', 50, 10, '{"objectives": [{"id": "forum_view", "description": "View 3 forum posts", "type": "forum_view", "target": 3}]}', true, true, 2, NOW(), NOW()),
    (gen_random_uuid(), 'daily_voter', 'Community Supporter', 'Vote on content', 'daily', 75, 15, '{"objectives": [{"id": "forum_upvote", "description": "Vote on 5 posts", "type": "forum_upvote", "target": 5}]}', true, true, 3, NOW(), NOW()),
    (gen_random_uuid(), 'send_messages_25', 'Talkative', 'Send 25 messages today', 'daily', 150, 30, '{"objectives": [{"id": "message_sent", "description": "Send 25 messages", "type": "message_sent", "target": 25}]}', true, true, 4, NOW(), NOW()),
    (gen_random_uuid(), 'create_thread_daily', 'Thread Starter', 'Create a forum thread', 'daily', 75, 20, '{"objectives": [{"id": "forum_thread", "description": "Create a forum thread", "type": "forum_thread", "target": 1}]}', true, true, 5, NOW(), NOW()),
    (gen_random_uuid(), 'reply_threads_3', 'Active Replier', 'Reply to 3 forum threads', 'daily', 60, 15, '{"objectives": [{"id": "forum_post", "description": "Reply to 3 threads", "type": "forum_post", "target": 3}]}', true, true, 6, NOW(), NOW()),
    (gen_random_uuid(), 'add_friend_daily', 'Friendly Face', 'Add a new friend', 'daily', 40, 10, '{"objectives": [{"id": "friend_added", "description": "Add 1 friend", "type": "friend_added", "target": 1}]}', true, true, 7, NOW(), NOW()),
    (gen_random_uuid(), 'upvote_5_daily', 'Upvoter', 'Upvote 5 forum posts', 'daily', 40, 10, '{"objectives": [{"id": "forum_upvote", "description": "Upvote 5 posts", "type": "forum_upvote", "target": 5}]}', true, true, 8, NOW(), NOW()),
    (gen_random_uuid(), 'earn_xp_100', 'XP Hunter', 'Earn 100 XP today', 'daily', 30, 10, '{"objectives": [{"id": "xp_earned", "description": "Earn 100 XP", "type": "xp_earned", "target": 100}]}', true, true, 9, NOW(), NOW()),
    (gen_random_uuid(), 'earn_xp_250', 'XP Seeker', 'Earn 250 XP today', 'daily', 75, 25, '{"objectives": [{"id": "xp_earned", "description": "Earn 250 XP", "type": "xp_earned", "target": 250}]}', true, true, 10, NOW(), NOW()),
    -- Weekly quests (8)
    (gen_random_uuid(), 'weekly_creator', 'Weekly Creator', 'Share your thoughts this week', 'weekly', 300, 75, '{"objectives": [{"id": "forum_thread", "description": "Create 3 forum threads", "type": "forum_thread", "target": 3}]}', true, true, 20, NOW(), NOW()),
    (gen_random_uuid(), 'weekly_helper', 'Weekly Helper', 'Help the community this week', 'weekly', 400, 100, '{"objectives": [{"id": "forum_upvote_received", "description": "Get 10 upvotes", "type": "forum_upvote_received", "target": 10}]}', true, true, 21, NOW(), NOW()),
    (gen_random_uuid(), 'weekly_socializer', 'Social Week', 'Make new connections this week', 'weekly', 250, 50, '{"objectives": [{"id": "friend_added", "description": "Add 2 friends", "type": "friend_added", "target": 2}]}', true, true, 22, NOW(), NOW()),
    (gen_random_uuid(), 'weekly_messages_100', 'Weekly Chatter', 'Send 100 messages this week', 'weekly', 400, 80, '{"objectives": [{"id": "message_sent", "description": "Send 100 messages", "type": "message_sent", "target": 100}]}', true, true, 23, NOW(), NOW()),
    (gen_random_uuid(), 'weekly_threads_5', 'Prolific Poster', 'Create 5 threads this week', 'weekly', 350, 70, '{"objectives": [{"id": "forum_thread", "description": "Create 5 threads", "type": "forum_thread", "target": 5}]}', true, true, 24, NOW(), NOW()),
    (gen_random_uuid(), 'weekly_xp_500', 'XP Grinder', 'Earn 500 XP this week', 'weekly', 250, 50, '{"objectives": [{"id": "xp_earned", "description": "Earn 500 XP", "type": "xp_earned", "target": 500}]}', true, true, 25, NOW(), NOW()),
    (gen_random_uuid(), 'weekly_streak_3', 'Streak Builder', 'Log in 3 days in a row', 'weekly', 200, 50, '{"objectives": [{"id": "login_streak", "description": "Login 3 days", "type": "login_streak", "target": 3}]}', true, true, 26, NOW(), NOW()),
    (gen_random_uuid(), 'weekly_replies_10', 'Reply Champion', 'Reply to 10 threads this week', 'weekly', 300, 60, '{"objectives": [{"id": "forum_post", "description": "Reply to 10 threads", "type": "forum_post", "target": 10}]}', true, true, 27, NOW(), NOW()),
    -- Monthly quests (3)
    (gen_random_uuid(), 'monthly_xp_2000', 'Monthly Achiever', 'Earn 2000 XP this month', 'monthly', 600, 150, '{"objectives": [{"id": "xp_earned", "description": "Earn 2000 XP", "type": "xp_earned", "target": 2000}]}', true, true, 40, NOW(), NOW()),
    (gen_random_uuid(), 'monthly_threads_20', 'Content Creator', 'Create 20 threads this month', 'monthly', 750, 200, '{"objectives": [{"id": "forum_thread", "description": "Create 20 threads", "type": "forum_thread", "target": 20}]}', true, true, 41, NOW(), NOW()),
    (gen_random_uuid(), 'monthly_friends_10', 'Networking Month', 'Add 10 friends this month', 'monthly', 500, 125, '{"objectives": [{"id": "friend_added", "description": "Add 10 friends", "type": "friend_added", "target": 10}]}', true, true, 42, NOW(), NOW()),
    -- Special quests (2)
    (gen_random_uuid(), 'special_all_rounder', 'All-Rounder', 'Complete 3 different activity types', 'special', 500, 100, '{"objectives": [{"id": "message_sent", "description": "Send a message", "type": "message_sent", "target": 1}, {"id": "forum_thread", "description": "Create a thread", "type": "forum_thread", "target": 1}, {"id": "friend_added", "description": "Add a friend", "type": "friend_added", "target": 1}]}', true, true, 50, NOW(), NOW()),
    (gen_random_uuid(), 'special_power_user', 'Power User', 'Show mastery across all areas', 'special', 1000, 250, '{"objectives": [{"id": "message_sent", "description": "Send 50 messages", "type": "message_sent", "target": 50}, {"id": "forum_thread", "description": "Create 5 threads", "type": "forum_thread", "target": 5}, {"id": "forum_upvote", "description": "Upvote 10 posts", "type": "forum_upvote", "target": 10}]}', true, true, 51, NOW(), NOW())
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
    # Remove only the new achievements added by this migration
    new_achievement_slugs = [
      "first_friend", "social_maven", "group_explorer", "community_builder",
      "networking_legend", "chatterbox", "motor_mouth", "megaphone",
      "legendary_talker", "first_thread", "forum_regular", "forum_veteran",
      "helpful_poster", "respected_voice", "forum_legend",
      "level_5", "level_10", "level_25", "level_50",
      "first_quest", "quest_master", "first_purchase",
      "border_collector", "title_collector",
      "week_streak", "month_streak", "hundred_days",
      "speed_demon"
    ]

    for slug <- new_achievement_slugs do
      execute "DELETE FROM achievements WHERE slug = '#{slug}'"
    end

    new_quest_slugs = [
      "send_messages_25", "create_thread_daily", "reply_threads_3",
      "add_friend_daily", "upvote_5_daily", "earn_xp_100", "earn_xp_250",
      "weekly_messages_100", "weekly_threads_5", "weekly_xp_500",
      "weekly_streak_3", "weekly_replies_10",
      "monthly_xp_2000", "monthly_threads_20", "monthly_friends_10",
      "special_all_rounder", "special_power_user"
    ]

    for slug <- new_quest_slugs do
      execute "DELETE FROM quests WHERE slug = '#{slug}'"
    end
  end
end
