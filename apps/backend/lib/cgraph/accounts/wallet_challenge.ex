defmodule Cgraph.Accounts.WalletChallenge do
  @moduledoc """
  Schema for storing wallet authentication challenge nonces.
  
  Used during the wallet login flow to store the nonce that users
  must sign to prove ownership of their wallet address.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @timestamps_opts [type: :utc_datetime_usec]

  schema "wallet_challenges" do
    field :wallet_address, :string
    field :nonce, :string
    field :expires_at, :utc_datetime

    timestamps()
  end

  @doc """
  Changeset for creating or updating a wallet challenge.
  """
  def changeset(challenge, attrs) do
    challenge
    |> cast(attrs, [:wallet_address, :nonce, :expires_at])
    |> validate_required([:wallet_address, :nonce])
    |> unique_constraint(:wallet_address)
    |> put_expiration()
  end

  defp put_expiration(changeset) do
    case get_change(changeset, :expires_at) do
      nil ->
        # Default to 5 minutes expiration
        expires_at = DateTime.utc_now() |> DateTime.add(5 * 60, :second)
        put_change(changeset, :expires_at, expires_at)
      _ ->
        changeset
    end
  end
end
