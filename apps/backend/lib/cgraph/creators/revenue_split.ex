defmodule CGraph.Creators.RevenueSplit do
  @moduledoc """
  Schema for revenue split configuration on premium threads.

  Defines how revenue from a premium thread is distributed between
  the creator, platform, and optional referral partners.
  Shares must sum to 1.0 (100%).
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime]

  schema "revenue_splits" do
    belongs_to :thread, CGraph.Forums.Thread

    field :creator_share, :decimal
    field :platform_share, :decimal
    field :referral_share, :decimal

    timestamps()
  end

  @required_fields ~w(thread_id creator_share platform_share referral_share)a

  def changeset(split, attrs) do
    split
    |> cast(attrs, @required_fields)
    |> validate_required(@required_fields)
    |> validate_number(:creator_share, greater_than_or_equal_to: 0, less_than_or_equal_to: 1)
    |> validate_number(:platform_share, greater_than_or_equal_to: 0, less_than_or_equal_to: 1)
    |> validate_number(:referral_share, greater_than_or_equal_to: 0, less_than_or_equal_to: 1)
    |> validate_shares_sum()
    |> unique_constraint(:thread_id)
    |> foreign_key_constraint(:thread_id)
  end

  defp validate_shares_sum(changeset) do
    creator = get_field(changeset, :creator_share)
    platform = get_field(changeset, :platform_share)
    referral = get_field(changeset, :referral_share)

    if creator && platform && referral do
      sum = Decimal.add(Decimal.add(creator, platform), referral)

      if Decimal.equal?(sum, Decimal.new("1.0")) do
        changeset
      else
        add_error(changeset, :creator_share, "shares must sum to 1.0, got #{sum}")
      end
    else
      changeset
    end
  end
end
