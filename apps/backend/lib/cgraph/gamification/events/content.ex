defmodule CGraph.Gamification.Events.Content do
  @moduledoc """
  Battle pass tiers and event quests management.

  Handles creating, reading, and updating battle pass tier configurations
  and event quest/challenge definitions within seasonal events.
  """

  alias CGraph.Gamification.SeasonalEvent
  alias CGraph.Gamification.Events.Crud

  # ============================================================================
  # Battle Pass Tiers
  # ============================================================================

  @doc """
  List battle pass tiers for an event.
  """
  @spec list_battle_pass_tiers(String.t()) :: {:ok, list(map())} | {:error, term()}
  def list_battle_pass_tiers(event_id) do
    case Crud.get_event(event_id) do
      {:ok, event} ->
        tiers = event.battle_pass_tiers || []
        tiers_with_index = tiers
        |> Enum.with_index(1)
        |> Enum.map(fn {tier, idx} -> Map.put(tier, "tier", idx) end)
        {:ok, tiers_with_index}
      error -> error
    end
  end

  @doc """
  Get a specific battle pass tier.
  """
  @spec get_battle_pass_tier(String.t(), integer()) :: {:ok, map()} | {:error, term()}
  def get_battle_pass_tier(event_id, tier_number) do
    case list_battle_pass_tiers(event_id) do
      {:ok, tiers} ->
        case Enum.find(tiers, & &1["tier"] == tier_number) do
          nil -> {:error, :not_found}
          tier -> {:ok, tier}
        end
      error -> error
    end
  end

  @doc """
  Create a battle pass tier.
  """
  @spec create_battle_pass_tier(String.t() | SeasonalEvent.t(), map()) ::
          {:ok, SeasonalEvent.t()} | {:error, term()}
  def create_battle_pass_tier(event_id, tier_attrs) when is_binary(event_id) do
    case Crud.get_event(event_id) do
      {:ok, event} -> create_battle_pass_tier(event, tier_attrs)
      error -> error
    end
  end

  def create_battle_pass_tier(%SeasonalEvent{} = event, tier_attrs) do
    existing_tiers = event.battle_pass_tiers || []
    new_tiers = existing_tiers ++ [tier_attrs]
    Crud.update_event(event, %{battle_pass_tiers: new_tiers, has_battle_pass: true})
  end

  @doc """
  Update a battle pass tier.
  """
  @spec update_battle_pass_tier(String.t() | SeasonalEvent.t(), integer(), map()) ::
          {:ok, SeasonalEvent.t()} | {:error, term()}
  def update_battle_pass_tier(event_id, tier_number, tier_attrs) when is_binary(event_id) do
    case Crud.get_event(event_id) do
      {:ok, event} -> update_battle_pass_tier(event, tier_number, tier_attrs)
      error -> error
    end
  end

  def update_battle_pass_tier(%SeasonalEvent{} = event, tier_number, tier_attrs) do
    existing_tiers = event.battle_pass_tiers || []
    idx = tier_number - 1

    if idx >= 0 and idx < length(existing_tiers) do
      updated_tier = Map.merge(Enum.at(existing_tiers, idx), tier_attrs)
      new_tiers = List.replace_at(existing_tiers, idx, updated_tier)
      Crud.update_event(event, %{battle_pass_tiers: new_tiers})
    else
      {:error, :tier_not_found}
    end
  end

  @doc """
  Bulk create/replace tiers.
  """
  @spec bulk_create_tiers(String.t() | SeasonalEvent.t(), list(map())) ::
          {:ok, list(map())} | {:error, term()}
  def bulk_create_tiers(event_id, tiers_attrs) when is_binary(event_id) do
    case Crud.get_event(event_id) do
      {:ok, event} -> bulk_create_tiers(event, tiers_attrs)
      error -> error
    end
  end

  def bulk_create_tiers(%SeasonalEvent{} = event, tiers_attrs) when is_list(tiers_attrs) do
    case Crud.update_event(event, %{battle_pass_tiers: tiers_attrs, has_battle_pass: true}) do
      {:ok, updated} -> {:ok, updated.battle_pass_tiers}
      error -> error
    end
  end

  # ============================================================================
  # Event Quests
  # ============================================================================

  @doc """
  List quests for an event.
  """
  @spec list_event_quests(String.t()) :: {:ok, list(map())} | {:error, term()}
  def list_event_quests(event_id) do
    case Crud.get_event(event_id) do
      {:ok, event} ->
        quests = event.daily_challenges || []
        {:ok, quests}
      error -> error
    end
  end

  @doc """
  Get a specific quest by ID.
  """
  @spec get_quest(String.t(), String.t()) :: {:ok, map()} | {:error, term()}
  def get_quest(event_id, quest_id) do
    case list_event_quests(event_id) do
      {:ok, quests} ->
        case Enum.find(quests, & &1["id"] == quest_id) do
          nil -> {:error, :not_found}
          quest -> {:ok, quest}
        end
      error -> error
    end
  end

  @doc """
  Create a quest for an event.
  """
  @spec create_quest(String.t() | SeasonalEvent.t(), map()) :: {:ok, map()} | {:error, term()}
  def create_quest(event_id, quest_attrs) when is_binary(event_id) do
    case Crud.get_event(event_id) do
      {:ok, event} -> create_quest(event, quest_attrs)
      error -> error
    end
  end

  def create_quest(%SeasonalEvent{} = event, quest_attrs) do
    existing_quests = event.daily_challenges || []
    quest_id = quest_attrs["id"] || Ecto.UUID.generate()
    quest_with_id = Map.put(quest_attrs, "id", quest_id)
    new_quests = existing_quests ++ [quest_with_id]

    case Crud.update_event(event, %{daily_challenges: new_quests}) do
      {:ok, _} -> {:ok, quest_with_id}
      error -> error
    end
  end

  @doc """
  Update a quest.
  """
  @spec update_quest(String.t() | SeasonalEvent.t(), String.t(), map()) ::
          {:ok, map()} | {:error, term()}
  def update_quest(event_id, quest_id, quest_attrs) when is_binary(event_id) do
    case Crud.get_event(event_id) do
      {:ok, event} -> update_quest(event, quest_id, quest_attrs)
      error -> error
    end
  end

  def update_quest(%SeasonalEvent{} = event, quest_id, quest_attrs) do
    existing_quests = event.daily_challenges || []

    case Enum.find_index(existing_quests, & &1["id"] == quest_id) do
      nil -> {:error, :quest_not_found}
      idx ->
        updated_quest = Map.merge(Enum.at(existing_quests, idx), quest_attrs)
        new_quests = List.replace_at(existing_quests, idx, updated_quest)
        case Crud.update_event(event, %{daily_challenges: new_quests}) do
          {:ok, _} -> {:ok, updated_quest}
          error -> error
        end
    end
  end
end
