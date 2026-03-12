defmodule CGraph.PaidDm.PaidDmSetting do
  @moduledoc """
  Schema for per-user paid DM settings.

  Controls whether a user accepts paid DM files, pricing,
  accepted file types, and friend auto-accept behavior.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime]

  schema "paid_dm_settings" do
    belongs_to :user, CGraph.Accounts.User

    field :enabled, :boolean, default: false
    field :price_per_file, :integer
    field :accepted_types, {:array, :string}
    field :auto_accept_friends, :boolean, default: false

    timestamps()
  end

  @required_fields ~w(user_id)a
  @optional_fields ~w(enabled price_per_file accepted_types auto_accept_friends)a

  @doc false
  def changeset(paid_dm_setting, attrs) do
    paid_dm_setting
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_number(:price_per_file, greater_than: 0)
    |> unique_constraint(:user_id)
  end
end
