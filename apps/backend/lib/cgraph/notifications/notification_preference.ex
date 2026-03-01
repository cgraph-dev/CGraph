defmodule CGraph.Notifications.NotificationPreference do
  @moduledoc """
  Schema for per-conversation, per-channel, and per-group notification preferences.

  Allows users to override global notification settings at a granular level.
  A nil record (no preference) means the default mode :all applies.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @valid_modes ["all", "mentions_only", "none"]
  @valid_target_types ["conversation", "channel", "group"]

  schema "notification_preferences" do
    belongs_to :user, CGraph.Accounts.User
    field :target_type, :string
    field :target_id, :binary_id
    field :mode, :string, default: "all"
    field :muted_until, :utc_datetime

    timestamps()
  end

  @doc "Changeset for creating or updating a notification preference."
  def changeset(preference, attrs) do
    preference
    |> cast(attrs, [:user_id, :target_type, :target_id, :mode, :muted_until])
    |> validate_required([:user_id, :target_type, :target_id, :mode])
    |> validate_inclusion(:mode, @valid_modes)
    |> validate_inclusion(:target_type, @valid_target_types)
    |> unique_constraint([:user_id, :target_type, :target_id])
  end

  @doc "Returns the list of valid notification modes."
  @spec valid_modes() :: [String.t()]
  def valid_modes, do: @valid_modes

  @doc "Returns the list of valid target types."
  @spec valid_target_types() :: [String.t()]
  def valid_target_types, do: @valid_target_types
end
