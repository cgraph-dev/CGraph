defmodule CGraph.Customizations.UserCustomization do
  @moduledoc """
  Schema for user customizations (avatar borders, titles, themes, chat styles, effects).
  """

  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "user_customizations" do
    field :user_id, :binary_id

    # Identity
    field :avatar_border_id, :string
    field :title_id, :string
    field :equipped_badges, {:array, :string}, default: []
    field :profile_layout, :string, default: "classic"

    # Themes
    field :profile_theme, :string, default: "classic-purple"
    field :chat_theme, :string, default: "default"
    field :forum_theme, :string
    field :app_theme, :string, default: "dark"

    # Chat Styling
    field :bubble_style, :string, default: "default"
    field :message_effect, :string, default: "none"
    field :reaction_style, :string, default: "bounce"

    # Effects
    field :particle_effect, :string, default: "none"
    field :background_effect, :string, default: "solid"
    field :animation_speed, :string, default: "normal"

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(user_customization, attrs) do
    user_customization
    |> cast(attrs, [
      :user_id,
      # Identity
      :avatar_border_id,
      :title_id,
      :equipped_badges,
      :profile_layout,
      # Themes
      :profile_theme,
      :chat_theme,
      :forum_theme,
      :app_theme,
      # Chat Styling
      :bubble_style,
      :message_effect,
      :reaction_style,
      # Effects
      :particle_effect,
      :background_effect,
      :animation_speed
    ])
    |> validate_required([:user_id])
    |> validate_length(:equipped_badges, max: 5)
    |> unique_constraint(:user_id)
  end
end
