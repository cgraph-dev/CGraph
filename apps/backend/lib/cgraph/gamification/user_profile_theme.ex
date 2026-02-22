defmodule CGraph.Gamification.UserProfileTheme do
  @moduledoc """
  Schema for tracking user's unlocked and active profile themes.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @unlock_sources ~w(default achievement purchase event gift level)

  schema "user_profile_themes" do
    field :is_active, :boolean, default: false
    field :unlock_source, :string
    field :unlock_data, :map, default: %{}
    field :expires_at, :utc_datetime

    # Custom overrides
    field :custom_colors, :map
    field :custom_background, :map
    field :custom_layout, :map
    field :custom_effects, :map

    belongs_to :user, CGraph.Accounts.User
    belongs_to :profile_theme, CGraph.Gamification.ProfileTheme, foreign_key: :theme_id

    timestamps(type: :utc_datetime)
  end

  @doc false
  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(user_theme, attrs) do
    user_theme
    |> cast(attrs, [
      :user_id, :theme_id, :is_active, :unlock_source, :unlock_data,
      :expires_at, :custom_colors, :custom_background, :custom_layout, :custom_effects
    ])
    |> validate_required([:user_id, :theme_id, :unlock_source])
    |> validate_inclusion(:unlock_source, @unlock_sources)
    |> foreign_key_constraint(:user_id)
    |> foreign_key_constraint(:theme_id)
    |> unique_constraint([:user_id, :theme_id])
  end

  @spec activate_changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def activate_changeset(user_theme, attrs) do
    user_theme
    |> cast(attrs, [:is_active])
  end

  @spec customize_changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def customize_changeset(user_theme, attrs) do
    user_theme
    |> cast(attrs, [:custom_colors, :custom_background, :custom_layout, :custom_effects])
  end

  @spec unlock_sources() :: [String.t()]
  def unlock_sources, do: @unlock_sources
end
