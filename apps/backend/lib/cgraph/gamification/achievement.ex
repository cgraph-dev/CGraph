defmodule Cgraph.Gamification.Achievement do
  @moduledoc """
  Schema for achievement definitions.

  Achievements are unlockable rewards that users can earn by completing
  specific actions or milestones in the application.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @categories ~w(social content exploration mastery legendary secret)
  @rarities ~w(common uncommon rare epic legendary mythic)

  schema "achievements" do
    field :slug, :string
    field :title, :string
    field :description, :string
    field :category, :string
    field :rarity, :string
    field :icon, :string
    field :xp_reward, :integer, default: 0
    field :coin_reward, :integer, default: 0
    field :max_progress, :integer, default: 1
    field :is_hidden, :boolean, default: false
    field :title_reward, :string
    field :badge_reward, :string
    field :sort_order, :integer, default: 0

    has_many :user_achievements, Cgraph.Gamification.UserAchievement

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(achievement, attrs) do
    achievement
    |> cast(attrs, [
      :slug, :title, :description, :category, :rarity, :icon,
      :xp_reward, :coin_reward, :max_progress, :is_hidden,
      :title_reward, :badge_reward, :sort_order
    ])
    |> validate_required([:slug, :title, :description, :category, :rarity, :icon])
    |> validate_inclusion(:category, @categories)
    |> validate_inclusion(:rarity, @rarities)
    |> validate_number(:xp_reward, greater_than_or_equal_to: 0)
    |> validate_number(:coin_reward, greater_than_or_equal_to: 0)
    |> validate_number(:max_progress, greater_than_or_equal_to: 1)
    |> unique_constraint(:slug)
  end

  @doc """
  Returns the list of valid categories.
  """
  def categories, do: @categories

  @doc """
  Returns the list of valid rarities.
  """
  def rarities, do: @rarities
end
