defmodule CGraph.Gamification.UserAvatarBorder do
  @moduledoc """
  Schema for tracking user's unlocked and equipped avatar borders.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @unlock_sources ~w(default achievement purchase event gift level prestige)

  schema "user_avatar_borders" do
    field :is_equipped, :boolean, default: false
    field :unlock_source, :string
    field :unlock_data, :map, default: %{}
    field :expires_at, :utc_datetime
    field :custom_colors, {:array, :string}
    field :custom_animation_speed, :float
    field :acquired_at, :utc_datetime
    field :acquisition_type, :string, default: "default"
    field :acquisition_source, :map
    field :is_tradeable, :boolean, default: false
    field :is_expired, :boolean, default: false
    field :equip_count, :integer, default: 0
    field :last_equipped_at, :utc_datetime
    field :custom_primary_color, :string
    field :custom_secondary_color, :string
    field :custom_glow_color, :string
    field :custom_particle_density, :integer
    field :trade_locked_until, :utc_datetime

    belongs_to :user, CGraph.Accounts.User
    belongs_to :avatar_border, CGraph.Gamification.AvatarBorder, foreign_key: :border_id

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(user_border, attrs) do
    user_border
    |> cast(attrs, [
      :user_id, :border_id, :is_equipped, :unlock_source, :acquired_at,
      :unlock_data, :expires_at, :custom_colors, :custom_animation_speed
    ])
    |> validate_required([:user_id, :border_id, :unlock_source])
    |> validate_inclusion(:unlock_source, @unlock_sources)
    |> validate_number(:custom_animation_speed, greater_than: 0, less_than_or_equal_to: 5)
    |> foreign_key_constraint(:user_id)
    |> foreign_key_constraint(:border_id)
    |> unique_constraint([:user_id, :border_id])
  end

  def equip_changeset(user_border, attrs) do
    user_border
    |> cast(attrs, [:is_equipped])
  end

  def unlock_sources, do: @unlock_sources
end
