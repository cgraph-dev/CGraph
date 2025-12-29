defmodule Cgraph.Accounts.RecoveryCode do
  @moduledoc """
  Schema for wallet recovery codes.

  Each user can have up to 8 recovery codes that can be used
  once each to regain access to their wallet account.
  """

  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "recovery_codes" do
    field :code_hash, :string
    field :used, :boolean, default: false
    field :used_at, :utc_datetime

    belongs_to :user, Cgraph.Accounts.User

    timestamps()
  end

  @doc false
  def changeset(recovery_code, attrs) do
    recovery_code
    |> cast(attrs, [:user_id, :code_hash, :used, :used_at])
    |> validate_required([:user_id, :code_hash])
    |> foreign_key_constraint(:user_id)
  end
end
