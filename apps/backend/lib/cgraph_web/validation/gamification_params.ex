defmodule CGraphWeb.Validation.GamificationParams do
  @moduledoc """
  Strong parameter validation for gamification endpoints.

  Covers:
  - Leaderboard queries
  - Achievement claims
  - Quest completions
  - XP grants (admin)
  - Title/badge selections
  """

  use Ecto.Schema
  import Ecto.Changeset

  @valid_categories ~w(xp level karma streak messages posts friends achievements)
  @valid_periods ~w(daily weekly monthly alltime)
  @max_leaderboard_limit 100

  embedded_schema do
    # Leaderboard
    field :category, :string
    field :period, :string
    field :page, :integer, default: 1
    field :per_page, :integer, default: 20
    field :friends_only, :boolean, default: false

    # Achievement
    field :achievement_id, Ecto.UUID

    # Quest
    field :quest_id, Ecto.UUID
    field :progress, :integer

    # Title/Badge
    field :title_id, Ecto.UUID
    field :badge_id, Ecto.UUID

    # Admin XP grant
    field :user_id, Ecto.UUID
    field :amount, :integer
    field :reason, :string
  end

  @doc """
  Validate leaderboard query parameters.
  """
  def validate_leaderboard(params) do
    %__MODULE__{}
    |> cast(params, [:category, :period, :page, :per_page, :friends_only], empty_values: [""])
    |> validate_inclusion(:category, @valid_categories)
    |> validate_inclusion(:period, @valid_periods)
    |> validate_number(:page, greater_than: 0)
    |> validate_number(:per_page, greater_than: 0, less_than_or_equal_to: @max_leaderboard_limit)
    |> apply_defaults()
    |> result_from_changeset()
  end

  @doc """
  Validate achievement claim.
  """
  def validate_claim_achievement(params) do
    %__MODULE__{}
    |> cast(params, [:achievement_id], empty_values: [""])
    |> validate_required([:achievement_id])
    |> result_from_changeset()
  end

  @doc """
  Validate quest progress update.
  """
  def validate_quest_progress(params) do
    %__MODULE__{}
    |> cast(params, [:quest_id, :progress], empty_values: [""])
    |> validate_required([:quest_id, :progress])
    |> validate_number(:progress, greater_than_or_equal_to: 0)
    |> result_from_changeset()
  end

  @doc """
  Validate title selection.
  """
  def validate_select_title(params) do
    %__MODULE__{}
    |> cast(params, [:title_id], empty_values: [""])
    |> validate_required([:title_id])
    |> result_from_changeset()
  end

  @doc """
  Validate badge selection for display.
  """
  def validate_select_badges(params) do
    # Use embedded schema approach for array validation
    %__MODULE__{}
    |> cast(%{"badge_id" => List.first(Map.get(params, "badge_ids") || [])}, [:badge_id])
    |> validate_badges_from_params(params)
    |> result_from_changeset()
  end

  defp validate_badges_from_params(changeset, params) do
    badge_ids = Map.get(params, "badge_ids") || Map.get(params, :badge_ids) || []

    cond do
      not is_list(badge_ids) ->
        add_error(changeset, :badge_ids, "must be an array")

      length(badge_ids) > 5 ->
        add_error(changeset, :badge_ids, "cannot display more than 5 badges")

      true ->
        # Validate each badge_id is a valid UUID
        invalid = Enum.filter(badge_ids, fn id ->
          case Ecto.UUID.cast(id) do
            {:ok, _} -> false
            :error -> true
          end
        end)

        if length(invalid) > 0 do
          add_error(changeset, :badge_ids, "contains invalid UUIDs")
        else
          # Store validated badge_ids in changeset for return
          put_change(changeset, :badge_id, badge_ids)
        end
    end
  end

  @doc """
  Validate admin XP grant.
  """
  def validate_admin_grant_xp(params) do
    %__MODULE__{}
    |> cast(params, [:user_id, :amount, :reason], empty_values: [""])
    |> validate_required([:user_id, :amount, :reason])
    |> validate_number(:amount, greater_than: 0, less_than_or_equal_to: 100_000)
    |> validate_length(:reason, min: 3, max: 500)
    |> result_from_changeset()
  end

  # ============================================================================
  # Private Validation Functions
  # ============================================================================

  defp apply_defaults(changeset) do
    changeset
    |> put_default(:category, "xp")
    |> put_default(:period, "alltime")
    |> put_default(:page, 1)
    |> put_default(:per_page, 20)
  end

  defp put_default(changeset, field, default) do
    if get_field(changeset, field) do
      changeset
    else
      put_change(changeset, field, default)
    end
  end

  # ============================================================================
  # Result Helpers
  # ============================================================================

  defp result_from_changeset(%Ecto.Changeset{} = changeset) do
    case apply_action(changeset, :validate) do
      {:ok, struct} -> {:ok, to_map(struct)}
      {:error, cs} -> {:error, cs}
    end
  end

  defp to_map(%__MODULE__{} = struct) do
    struct
    |> Map.from_struct()
    |> Map.delete(:__meta__)
    |> Enum.reject(fn {_k, v} -> is_nil(v) end)
    |> Map.new()
  end
end
