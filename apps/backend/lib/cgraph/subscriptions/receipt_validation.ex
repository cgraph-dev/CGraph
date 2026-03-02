defmodule CGraph.Subscriptions.ReceiptValidation do
  @moduledoc """
  Schema for the `iap_receipts` table.

  Stores validated IAP receipts from Apple App Store and Google Play Store.
  Each receipt maps a native purchase to a CGraph user and tracks validation
  status, expiry, and auto-renewal state.
  """

  use Ecto.Schema
  import Ecto.Changeset

  @type t :: %__MODULE__{}

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "iap_receipts" do
    field :user_id, :binary_id
    field :platform, :string
    field :product_id, :string
    field :original_transaction_id, :string
    field :receipt_data, :string
    field :validation_status, :string
    field :expires_at, :utc_datetime
    field :purchase_date, :utc_datetime
    field :environment, :string
    field :auto_renewing, :boolean, default: true
    field :cancellation_date, :utc_datetime

    timestamps()
  end

  @required_fields ~w(user_id platform product_id original_transaction_id validation_status)a
  @optional_fields ~w(receipt_data expires_at purchase_date environment auto_renewing cancellation_date)a

  @doc "Changeset for creating or updating an IAP receipt."
  @spec changeset(t() | Ecto.Changeset.t(), map()) :: Ecto.Changeset.t()
  def changeset(receipt, attrs) do
    receipt
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_inclusion(:platform, ~w(apple google))
    |> validate_inclusion(:validation_status, ~w(valid expired refunded pending))
    |> validate_inclusion(:environment, ~w(sandbox production))
    |> unique_constraint([:platform, :original_transaction_id],
      name: :iap_receipts_platform_original_transaction_id_index
    )
  end
end
