defmodule Cgraph.Groups.Invite do
  @moduledoc """
  Group invite links with optional expiry and usage limits.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  schema "invites" do
    field :code, :string
    field :max_uses, :integer
    field :uses, :integer, default: 0
    field :expires_at, :utc_datetime
    field :is_temporary, :boolean, default: false  # Kick if they leave
    field :is_revoked, :boolean, default: false

    belongs_to :group, Cgraph.Groups.Group
    belongs_to :channel, Cgraph.Groups.Channel
    belongs_to :created_by, Cgraph.Accounts.User

    timestamps()
  end

  @doc """
  Create a new invite.
  """
  def changeset(invite, attrs) do
    invite
    |> cast(attrs, [:max_uses, :expires_at, :is_temporary, :group_id, :channel_id, :created_by_id])
    |> validate_required([:group_id, :created_by_id])
    |> generate_code()
    |> validate_number(:max_uses, greater_than: 0)
    |> validate_expiry()
    |> foreign_key_constraint(:group_id)
    |> foreign_key_constraint(:channel_id)
    |> foreign_key_constraint(:created_by_id)
    |> unique_constraint(:code)
  end

  @doc """
  Increment usage count.
  """
  def use_changeset(invite) do
    change(invite, uses: invite.uses + 1)
  end

  @doc """
  Revoke an invite.
  """
  def revoke_changeset(invite) do
    change(invite, is_revoked: true)
  end

  @doc """
  Check if invite is valid (not expired, not revoked, uses not exceeded).
  """
  def valid?(%__MODULE__{is_revoked: true}), do: false
  def valid?(%__MODULE__{max_uses: max, uses: uses}) when is_integer(max) and uses >= max, do: false
  def valid?(%__MODULE__{expires_at: nil}), do: true
  def valid?(%__MODULE__{expires_at: expires_at}) do
    DateTime.compare(expires_at, DateTime.utc_now()) == :gt
  end

  defp generate_code(changeset) do
    code = :crypto.strong_rand_bytes(6) |> Base.url_encode64(padding: false)
    put_change(changeset, :code, code)
  end

  defp validate_expiry(changeset) do
    case get_change(changeset, :expires_at) do
      nil -> changeset
      expires_at ->
        if DateTime.compare(expires_at, DateTime.utc_now()) == :lt do
          add_error(changeset, :expires_at, "must be in the future")
        else
          changeset
        end
    end
  end
end
