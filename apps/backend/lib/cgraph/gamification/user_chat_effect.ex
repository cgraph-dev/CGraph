defmodule CGraph.Gamification.UserChatEffect do
  @moduledoc """
  Schema for tracking user's unlocked and active chat effects.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @unlock_sources ~w(default achievement purchase event gift level)

  schema "user_chat_effects" do
    field :is_active, :boolean, default: false
    field :unlock_source, :string
    field :unlock_data, :map, default: %{}
    field :expires_at, :utc_datetime

    # Custom configuration overrides
    field :custom_config, :map

    belongs_to :user, CGraph.Accounts.User
    belongs_to :chat_effect, CGraph.Gamification.ChatEffect, foreign_key: :effect_id

    timestamps(type: :utc_datetime)
  end

  @doc false
  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(user_effect, attrs) do
    user_effect
    |> cast(attrs, [
      :user_id, :effect_id, :is_active, :unlock_source,
      :unlock_data, :expires_at, :custom_config
    ])
    |> validate_required([:user_id, :effect_id, :unlock_source])
    |> validate_inclusion(:unlock_source, @unlock_sources)
    |> foreign_key_constraint(:user_id)
    |> foreign_key_constraint(:effect_id)
    |> unique_constraint([:user_id, :effect_id])
  end

  @doc "Builds a changeset for activating a record."
  @spec activate_changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def activate_changeset(user_effect, attrs) do
    user_effect
    |> cast(attrs, [:is_active])
  end

  @doc "Returns the list of valid unlock sources."
  @spec unlock_sources() :: [String.t()]
  def unlock_sources, do: @unlock_sources
end
