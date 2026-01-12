defmodule Cgraph.Gamification.Quest do
  @moduledoc """
  Schema for quest definitions.

  Quests are time-limited challenges that reward users for completing
  specific objectives within the given timeframe.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @types ~w(daily weekly monthly seasonal special)

  schema "quests" do
    field :slug, :string
    field :title, :string
    field :description, :string
    field :type, :string
    field :xp_reward, :integer, default: 0
    field :coin_reward, :integer, default: 0
    field :objectives, :map, default: %{}
    field :is_active, :boolean, default: true
    field :starts_at, :utc_datetime
    field :ends_at, :utc_datetime
    field :repeatable, :boolean, default: false
    field :sort_order, :integer, default: 0

    has_many :user_quests, Cgraph.Gamification.UserQuest

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(quest, attrs) do
    quest
    |> cast(attrs, [
      :slug, :title, :description, :type, :xp_reward, :coin_reward,
      :objectives, :is_active, :starts_at, :ends_at, :repeatable, :sort_order
    ])
    |> validate_required([:slug, :title, :description, :type])
    |> validate_inclusion(:type, @types)
    |> validate_number(:xp_reward, greater_than_or_equal_to: 0)
    |> validate_number(:coin_reward, greater_than_or_equal_to: 0)
    |> unique_constraint(:slug)
  end

  @doc """
  Returns the list of valid quest types.
  """
  def types, do: @types

  @doc """
  Returns true if the quest is currently active based on time constraints.
  """
  def available?(%__MODULE__{is_active: false}), do: false
  def available?(%__MODULE__{starts_at: nil, ends_at: nil}), do: true
  def available?(%__MODULE__{starts_at: starts_at, ends_at: ends_at}) do
    now = DateTime.utc_now()

    starts_ok = is_nil(starts_at) || DateTime.compare(now, starts_at) in [:gt, :eq]
    ends_ok = is_nil(ends_at) || DateTime.compare(now, ends_at) == :lt

    starts_ok && ends_ok
  end
end
