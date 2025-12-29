defmodule Cgraph.Accounts.PushToken do
  @moduledoc """
  Push notification tokens for mobile and web push.
  
  Supports:
  - Expo Push (React Native)
  - Firebase Cloud Messaging (Android)
  - Apple Push Notification Service (iOS)
  - Web Push (browsers)
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  schema "push_tokens" do
    field :token, :string
    field :platform, :string  # "expo", "fcm", "apns", "web"
    field :device_id, :string
    field :is_active, :boolean, default: true
    field :last_used_at, :utc_datetime

    belongs_to :user, Cgraph.Accounts.User

    timestamps()
  end

  @doc """
  Changeset for registering a push token.
  """
  def changeset(push_token, attrs) do
    push_token
    |> cast(attrs, [:user_id, :token, :platform, :device_id])
    |> validate_required([:user_id, :token, :platform])
    |> validate_inclusion(:platform, ["expo", "fcm", "apns", "web"])
    |> unique_constraint([:user_id, :token])
    |> foreign_key_constraint(:user_id)
  end

  @doc """
  Deactivate a token (e.g., after failed delivery).
  """
  def deactivate_changeset(push_token) do
    change(push_token, is_active: false)
  end
end
