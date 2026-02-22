defmodule CGraph.Gamification.Events do
  @moduledoc """
  Context module for managing seasonal events and battle passes.

  Handles:
  - Creating and managing seasonal events
  - Battle pass tiers and rewards
  - Event quests and challenges
  - Leaderboards and analytics

  ## Architecture

  Events are time-limited campaigns with:
  - Configurable start/end dates with grace periods
  - Battle pass progression (free + premium tiers)
  - Event-specific currency and rewards
  - Leaderboards with ranking
  - Community milestones

  ## Submodules

  Implementation is split across:
  - `CGraph.Gamification.Events.Crud` — CRUD and state management
  - `CGraph.Gamification.Events.Content` — Battle pass tiers and quests
  - `CGraph.Gamification.Events.Participation` — User progress, leaderboards, analytics

  ## Security

  - All admin operations require proper authorization
  - Event creation validates date ranges and configurations
  - Reward claims are atomic with proper locking
  """

  # ============================================================================
  # Event CRUD & State Management — delegated to Events.Crud
  # ============================================================================

  defdelegate list_events_paginated(filters \\ %{}, opts \\ []),
    to: CGraph.Gamification.Events.Crud

  defdelegate get_event(id),
    to: CGraph.Gamification.Events.Crud

  defdelegate get_event_by_slug(slug),
    to: CGraph.Gamification.Events.Crud

  defdelegate get_event_with_analytics(id),
    to: CGraph.Gamification.Events.Crud

  defdelegate create_event(attrs, opts \\ []),
    to: CGraph.Gamification.Events.Crud

  defdelegate update_event(event_or_id, attrs),
    to: CGraph.Gamification.Events.Crud

  defdelegate delete_event(event_or_id),
    to: CGraph.Gamification.Events.Crud

  defdelegate start_event(event_or_id),
    to: CGraph.Gamification.Events.Crud

  defdelegate pause_event(event_or_id),
    to: CGraph.Gamification.Events.Crud

  defdelegate resume_event(event_or_id),
    to: CGraph.Gamification.Events.Crud

  defdelegate end_event(event_or_id),
    to: CGraph.Gamification.Events.Crud

  # ============================================================================
  # Battle Pass Tiers — delegated to Events.Content
  # ============================================================================

  defdelegate list_battle_pass_tiers(event_id),
    to: CGraph.Gamification.Events.Content

  defdelegate get_battle_pass_tier(event_id, tier_number),
    to: CGraph.Gamification.Events.Content

  defdelegate create_battle_pass_tier(event_id_or_event, tier_attrs),
    to: CGraph.Gamification.Events.Content

  defdelegate update_battle_pass_tier(event_id_or_event, tier_number, tier_attrs),
    to: CGraph.Gamification.Events.Content

  defdelegate bulk_create_tiers(event_id_or_event, tiers_attrs),
    to: CGraph.Gamification.Events.Content

  # ============================================================================
  # Event Quests — delegated to Events.Content
  # ============================================================================

  defdelegate list_event_quests(event_id),
    to: CGraph.Gamification.Events.Content

  defdelegate get_quest(event_id, quest_id),
    to: CGraph.Gamification.Events.Content

  defdelegate create_quest(event_id_or_event, quest_attrs),
    to: CGraph.Gamification.Events.Content

  defdelegate update_quest(event_id_or_event, quest_id, quest_attrs),
    to: CGraph.Gamification.Events.Content

  # ============================================================================
  # User Participation — delegated to Events.Participation
  # ============================================================================

  defdelegate join_event(user_id, event_id),
    to: CGraph.Gamification.Events.Participation

  defdelegate get_user_progress(user_id, event_id),
    to: CGraph.Gamification.Events.Participation

  defdelegate add_event_points(user_id, event_id, points),
    to: CGraph.Gamification.Events.Participation

  # ============================================================================
  # Leaderboards & Analytics — delegated to Events.Participation
  # ============================================================================

  defdelegate get_leaderboard(event_id, opts \\ []),
    to: CGraph.Gamification.Events.Participation

  defdelegate get_event_analytics(event_id),
    to: CGraph.Gamification.Events.Participation
end
