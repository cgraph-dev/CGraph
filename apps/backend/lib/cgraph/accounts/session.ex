defmodule Cgraph.Accounts.Session do
  @moduledoc """
  User session tracking for multi-device support.
  
  Stores JWT refresh tokens and device information
  to allow users to manage and revoke sessions.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  schema "sessions" do
    field :token_hash, :string
    field :device_name, :string
    field :device_type, :string  # "web", "ios", "android", "desktop"
    field :ip_address, :string
    field :user_agent, :string
    field :location, :string
    field :last_active_at, :utc_datetime_usec
    field :expires_at, :utc_datetime_usec
    field :revoked_at, :utc_datetime_usec

    belongs_to :user, Cgraph.Accounts.User

    timestamps()
  end

  @doc """
  Changeset for creating a new session.
  """
  def changeset(session, attrs) do
    session
    |> cast(attrs, [
      :user_id, :token_hash, :device_name, :device_type,
      :ip_address, :user_agent, :location, :expires_at
    ])
    |> validate_required([:user_id, :token_hash, :expires_at])
    |> put_change(:last_active_at, DateTime.utc_now())
    |> foreign_key_constraint(:user_id)
  end

  @doc """
  Update last active timestamp.
  """
  def touch_changeset(session) do
    change(session, last_active_at: DateTime.utc_now())
  end

  @doc """
  Revoke a session.
  """
  def revoke_changeset(session) do
    change(session, revoked_at: DateTime.utc_now())
  end

  @doc """
  Check if session is valid (not expired or revoked).
  """
  def valid?(%__MODULE__{revoked_at: nil, expires_at: expires_at}) do
    DateTime.compare(expires_at, DateTime.utc_now()) == :gt
  end
  def valid?(_), do: false
end
