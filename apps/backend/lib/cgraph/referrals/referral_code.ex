defmodule CGraph.Referrals.ReferralCode do
  @moduledoc """
  Schema for referral codes.
  """
  use Ecto.Schema
  import Ecto.Changeset

  alias CGraph.Accounts.User

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "referral_codes" do
    field :code, :string
    field :is_active, :boolean, default: true
    field :uses, :integer, default: 0
    field :max_uses, :integer

    belongs_to :user, User

    timestamps(type: :utc_datetime)
  end

  @required_fields ~w(user_id code)a
  @optional_fields ~w(is_active uses max_uses)a

  def changeset(code, attrs) do
    code
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_length(:code, min: 4, max: 20)
    |> unique_constraint(:code)
    |> unique_constraint(:user_id)
    |> foreign_key_constraint(:user_id)
  end
end
