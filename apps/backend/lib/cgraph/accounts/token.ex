defmodule CGraph.Accounts.Token do
  @moduledoc """
  Schema and functions for managing authentication tokens.

  Handles:
  - Session tokens
  - Password reset tokens
  - Email verification tokens
  - API tokens
  """

  use Ecto.Schema
  import Ecto.Changeset
  import Ecto.Query

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "tokens" do
    field :token, :binary
    field :type, :string  # session, reset_password, email_verification, api
    field :expires_at, :utc_datetime
    field :used_at, :utc_datetime
    field :revoked_at, :utc_datetime
    field :metadata, :map, default: %{}

    belongs_to :user, CGraph.Accounts.User

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(token, attrs) do
    token
    |> cast(attrs, [:token, :type, :expires_at, :used_at, :revoked_at, :metadata, :user_id])
    |> validate_required([:token, :type, :user_id])
    |> validate_inclusion(:type, ["session", "reset_password", "email_verification", "api"])
    |> unique_constraint(:token)
  end

  @doc """
  Create a new token for a user.
  """
  def create(user_id, type, opts \\ []) do
    expires_in = Keyword.get(opts, :expires_in, default_expiry(type))
    metadata = Keyword.get(opts, :metadata, %{})

    %__MODULE__{
      token: generate_token(),
      type: to_string(type),
      user_id: user_id,
      expires_at: DateTime.add(DateTime.utc_now(), expires_in, :second),
      metadata: metadata
    }
  end

  @doc """
  Generate a secure random token.
  """
  def generate_token do
    :crypto.strong_rand_bytes(32) |> Base.url_encode64(padding: false)
  end

  @doc """
  Check if a token is expired.
  """
  def expired?(%__MODULE__{expires_at: nil}), do: false
  def expired?(%__MODULE__{expires_at: expires_at}) do
    DateTime.compare(DateTime.utc_now(), expires_at) == :gt
  end

  @doc """
  Check if a token is valid (not expired, not used, not revoked).
  """
  def valid?(%__MODULE__{} = token) do
    !expired?(token) && is_nil(token.used_at) && is_nil(token.revoked_at)
  end

  @doc """
  Query for expired tokens.
  """
  def expired_query do
    from t in __MODULE__,
      where: t.expires_at < ^DateTime.utc_now()
  end

  defp default_expiry("session"), do: 7 * 24 * 60 * 60  # 7 days
  defp default_expiry("reset_password"), do: 60 * 60    # 1 hour
  defp default_expiry("email_verification"), do: 24 * 60 * 60  # 24 hours
  defp default_expiry("api"), do: 365 * 24 * 60 * 60    # 1 year
  defp default_expiry(_), do: 24 * 60 * 60              # 24 hours default
end
