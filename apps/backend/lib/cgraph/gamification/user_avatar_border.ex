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

    belongs_to :user, CGraph.Accounts.User
    belongs_to :avatar_border, CGraph.Gamification.AvatarBorder

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(user_border, attrs) do
    user_border
    |> cast(attrs, [
      :user_id, :avatar_border_id, :is_equipped, :unlock_source,
      :unlock_data, :expires_at, :custom_colors, :custom_animation_speed
    ])
    |> validate_required([:user_id, :avatar_border_id, :unlock_source])
    |> validate_inclusion(:unlock_source, @unlock_sources)
    |> validate_number(:custom_animation_speed, greater_than: 0, less_than_or_equal_to: 5)
    |> foreign_key_constraint(:user_id)
    |> foreign_key_constraint(:avatar_border_id)
    |> unique_constraint([:user_id, :avatar_border_id])
  end

  def equip_changeset(user_border, attrs) do
    user_border
    |> cast(attrs, [:is_equipped])
  end

  def unlock_sources, do: @unlock_sources
end
