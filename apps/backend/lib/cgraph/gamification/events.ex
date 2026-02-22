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

  alias CGraph.Gamification.SeasonalEvent
  alias CGraph.Gamification.UserEventProgress

  # ============================================================================
  # Event CRUD & State Management — delegated to Events.Crud
  # ============================================================================

  @spec list_events_paginated(map(), keyword()) :: {:ok, map()} | {:error, term()}
  defdelegate list_events_paginated(filters \\ %{}, opts \\ []),
    to: CGraph.Gamification.Events.Crud

  @spec get_event(String.t()) :: {:ok, SeasonalEvent.t()} | {:error, :not_found}
  defdelegate get_event(id),
    to: CGraph.Gamification.Events.Crud

  @spec get_event_by_slug(String.t()) :: {:ok, SeasonalEvent.t()} | {:error, :not_found}
  defdelegate get_event_by_slug(slug),
    to: CGraph.Gamification.Events.Crud

  @spec get_event_with_analytics(String.t()) :: {:ok, map()} | {:error, :not_found}
  defdelegate get_event_with_analytics(id),
    to: CGraph.Gamification.Events.Crud

  @spec create_event(map(), keyword()) :: {:ok, SeasonalEvent.t()} | {:error, Ecto.Changeset.t()}
  defdelegate create_event(attrs, opts \\ []),
    to: CGraph.Gamification.Events.Crud

  @spec update_event(SeasonalEvent.t() | String.t(), map()) :: {:ok, SeasonalEvent.t()} | {:error, term()}
  defdelegate update_event(event_or_id, attrs),
    to: CGraph.Gamification.Events.Crud

  @spec delete_event(SeasonalEvent.t() | String.t()) :: {:ok, SeasonalEvent.t()} | {:error, term()}
  defdelegate delete_event(event_or_id),
    to: CGraph.Gamification.Events.Crud

  @spec start_event(SeasonalEvent.t() | String.t()) :: {:ok, SeasonalEvent.t()} | {:error, term()}
  defdelegate start_event(event_or_id),
    to: CGraph.Gamification.Events.Crud

  @spec pause_event(SeasonalEvent.t() | String.t()) :: {:ok, SeasonalEvent.t()} | {:error, term()}
  defdelegate pause_event(event_or_id),
    to: CGraph.Gamification.Events.Crud

  @spec resume_event(SeasonalEvent.t() | String.t()) :: {:ok, SeasonalEvent.t()} | {:error, term()}
  defdelegate resume_event(event_or_id),
    to: CGraph.Gamification.Events.Crud

  @spec end_event(SeasonalEvent.t() | String.t()) :: {:ok, SeasonalEvent.t()} | {:error, term()}
  defdelegate end_event(event_or_id),
    to: CGraph.Gamification.Events.Crud

  # ============================================================================
  # Battle Pass Tiers — delegated to Events.Content
  # ============================================================================

  @spec list_battle_pass_tiers(String.t()) :: {:ok, list(map())} | {:error, term()}
  defdelegate list_battle_pass_tiers(event_id),
    to: CGraph.Gamification.Events.Content

  @spec get_battle_pass_tier(String.t(), integer()) :: {:ok, map()} | {:error, term()}
  defdelegate get_battle_pass_tier(event_id, tier_number),
    to: CGraph.Gamification.Events.Content

  @spec create_battle_pass_tier(String.t() | SeasonalEvent.t(), map()) :: {:ok, SeasonalEvent.t()} | {:error, term()}
  defdelegate create_battle_pass_tier(event_id_or_event, tier_attrs),
    to: CGraph.Gamification.Events.Content

  @spec update_battle_pass_tier(String.t() | SeasonalEvent.t(), integer(), map()) :: {:ok, SeasonalEvent.t()} | {:error, term()}
  defdelegate update_battle_pass_tier(event_id_or_event, tier_number, tier_attrs),
    to: CGraph.Gamification.Events.Content

  @spec bulk_create_tiers(String.t() | SeasonalEvent.t(), list(map())) :: {:ok, list(map())} | {:error, term()}
  defdelegate bulk_create_tiers(event_id_or_event, tiers_attrs),
    to: CGraph.Gamification.Events.Content

  # ============================================================================
  # Event Quests — delegated to Events.Content
  # ============================================================================

  @spec list_event_quests(String.t()) :: {:ok, list(map())} | {:error, term()}
  defdelegate list_event_quests(event_id),
    to: CGraph.Gamification.Events.Content

  @spec get_quest(String.t(), String.t()) :: {:ok, map()} | {:error, term()}
  defdelegate get_quest(event_id, quest_id),
    to: CGraph.Gamification.Events.Content

  @spec create_quest(String.t() | SeasonalEvent.t(), map()) :: {:ok, map()} | {:error, term()}
  defdelegate create_quest(event_id_or_event, quest_attrs),
    to: CGraph.Gamification.Events.Content

  @spec update_quest(String.t() | SeasonalEvent.t(), String.t(), map()) :: {:ok, map()} | {:error, term()}
  defdelegate update_quest(event_id_or_event, quest_id, quest_attrs),
    to: CGraph.Gamification.Events.Content

  # ============================================================================
  # User Participation — delegated to Events.Participation
  # ============================================================================

  @spec join_event(String.t(), String.t()) :: {:ok, UserEventProgress.t()} | {:error, term()}
  defdelegate join_event(user_id, event_id),
    to: CGraph.Gamification.Events.Participation

  @spec get_user_progress(String.t(), String.t()) :: {:ok, UserEventProgress.t()} | {:error, :not_found}
  defdelegate get_user_progress(user_id, event_id),
    to: CGraph.Gamification.Events.Participation

  @spec add_event_points(String.t(), String.t(), integer()) :: {:ok, UserEventProgress.t()} | {:error, term()}
  defdelegate add_event_points(user_id, event_id, points),
    to: CGraph.Gamification.Events.Participation

  # ============================================================================
  # Leaderboards & Analytics — delegated to Events.Participation
  # ============================================================================

  @spec get_leaderboard(String.t(), keyword()) :: {:ok, {list(map()), map()}}
  defdelegate get_leaderboard(event_id, opts \\ []),
    to: CGraph.Gamification.Events.Participation

  @spec get_event_analytics(String.t()) :: {:ok, map()}
  defdelegate get_event_analytics(event_id),
    to: CGraph.Gamification.Events.Participation
end
