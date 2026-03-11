# Plan 16-02 Summary: Achievement Triggers & Quest Rotation Engine

**Status:** COMPLETE **Commits:** 8 tasks, 8 commits

## Completed Tasks

### Task 1 — Seed 40 achievements and 23 quest templates

- **Commit:** `cbd27756`
- Migration seeds 40 achievements across 6 categories (social, content, exploration, mastery,
  legendary, secret) with proper rarity chains (common → uncommon → rare → epic)
- 23 quest templates seeded as repeatable entries across daily, weekly, and monthly types
- Uses `ON CONFLICT (slug) DO UPDATE` to safely augment existing seed data

### Task 2 — AchievementTriggers module

- **Commit:** `8118d104`
- `CGraph.Gamification.AchievementTriggers.check_all/2` maps action types to relevant achievement
  slugs
- `check_level_achievements/2` replaces the no-op stub with actual level-based unlock logic
- Action→achievement mapping: `message_sent`, `forum_thread`, `forum_post`, `forum_upvote_received`,
  `friend_added`, `group_joined`, `quest_completed`

### Task 3 — Wire achievement triggers into XpEventHandler

- **Commit:** `4850fb28`
- `XpEventHandler.handle_action/3` calls `AchievementTriggers.check_all/2` via fire-and-forget Task
  after every XP-earning action
- Achievement checks fire even when daily cap is reached (so counting still works)
- Facade delegate `check_achievement_triggers/2` added to `Gamification`

### Task 4 — QuestTemplates module with 23 templates

- **Commit:** `350ae9b7`
- 10 daily templates (messages, forum replies, threads, friends, XP, upvotes, browsing, reactions,
  group messages, voice)
- 10 weekly templates (messages, threads, XP, friends, forum replies, upvotes, streak, voice,
  reactions, upvotes received)
- 3 monthly templates (XP, threads, friends)
- `pick_daily/1`, `pick_weekly/1`, `pick_monthly/1` select random templates with random difficulty
  tiers

### Task 5 — Quest rotation Oban worker

- **Commit:** `0ac0429f`
- `QuestRotationWorker` uses `Oban.Worker` with `:gamification` queue
- Cron schedule: daily at 00:00 UTC, weekly on Mondays, monthly on 1st
- Worker expires old quests, generates new from templates, broadcasts availability
- Oban config updated with `:gamification` queue (5 concurrency) and cron entries

### Task 6 — Wire quest objective tracking

- **Commit:** `488218a0`
- `QuestSystem.update_quest_progress/3` now resolves XP action atoms to quest objective type strings
  via `@action_to_objective_types` map
- Mapping: `:message` → `"message_sent"`, `:forum_thread_created` → `"forum_thread"`,
  `:forum_post_created` → `"forum_post"`, etc.
- Quest completion broadcasts `{:quest_completed, data}` to PubSub
- `claim_quest_rewards/2` now triggers `AchievementTriggers.check_all(user_id, :quest_completed)`
  and broadcasts `{:quest_claimed, ...}`

### Task 7 — Web achievement/quest notification enhancements

- **Commit:** `50d1621e`
- Gamification channel subscribes to `"gamification:lobby"` for lobby-wide quest rotation broadcasts
- Added `handle_info` handlers for `:quest_completed`, `:quest_claimed`, `:new_quests_available`
- New socket event types: `QuestCompletedEvent`, `QuestClaimedEvent`, `NewQuestsAvailableEvent`
- New hooks: `useQuestCompleted`, `useQuestClaimed`, `useNewQuestsAvailable`
- `useGamificationToasts` enhanced with `quest_complete` and `new_quests` toast types

### Task 8 — Mobile achievement/quest notifications

- **Commit:** `f66de0ce`
- Mobile gamification store enhanced with `handleAchievementUnlocked`, `handleQuestCompleted`,
  `handleNewQuestsAvailable` handlers
- Achievement unlock updates `achievementsUnlocked` count and marks achievement in loaded list
- Quest completion marks quest as completed in active quests
- New quests available triggers automatic quest list refresh

## Architecture

```
User Action → XpEventHandler
  ├── award_xp (XP + coins)
  ├── async_quest_progress → QuestSystem.update_quest_progress
  │     ├── resolve_objective_types (atom → string mapping)
  │     ├── increment matching objectives
  │     └── broadcast :quest_completed on completion
  └── async_achievement_triggers → AchievementTriggers.check_all
        └── increment_achievement_progress for matched slugs

QuestRotationWorker (Oban cron)
  ├── expire old quests
  ├── pick from QuestTemplates pool
  ├── generate new Quest records
  └── broadcast :new_quests_available

Gamification Channel
  └── pushes quest_completed, quest_claimed, new_quests_available to clients

Web: useQuestCompleted/useNewQuestsAvailable hooks → toast notifications
Mobile: handleQuestCompleted/handleNewQuestsAvailable → store updates + quest refresh
```

## Verification

- Backend compiles cleanly (`mix compile` — zero errors)
- All 8 tasks committed with proper `feat(16-02):` prefix
- Achievement triggers fire on every XP action type
- Quest objectives auto-progress from matching XP events
- Quest rotation worker registered in Oban cron config
- Real-time notifications flow: PubSub → Channel → Socket → Web hooks / Mobile store
