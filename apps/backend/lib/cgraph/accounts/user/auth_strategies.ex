defmodule CGraph.Accounts.User.AuthStrategies do
  @moduledoc """
  Authentication strategy changesets for `CGraph.Accounts.User`.

  Contains changesets for wallet-based, OAuth, TOTP, and subscription
  authentication/registration flows, along with their private validators.
  """

  import Ecto.Changeset

  alias CGraph.Accounts.User

  # ---------------------------------------------------------------------------
  # TOTP / 2FA
  # ---------------------------------------------------------------------------

  @doc """
  Changeset for TOTP 2FA settings.
  """
  @spec totp_changeset(User.t(), map()) :: Ecto.Changeset.t()
  def totp_changeset(user, attrs) do
    user
    |> cast(attrs, [:totp_enabled, :totp_secret, :totp_backup_codes, :totp_enabled_at])
  end

  # ---------------------------------------------------------------------------
  # OAuth
  # ---------------------------------------------------------------------------

  @doc """
  Changeset for OAuth account updates.
  Used when updating OAuth-related fields on existing users.
  """
  @spec oauth_changeset(User.t(), map()) :: Ecto.Changeset.t()
  def oauth_changeset(user, attrs) do
    user
    |> cast(attrs, [:oauth_provider, :oauth_uid, :oauth_data, :avatar_url, :display_name, :email_verified_at])
    |> validate_oauth_provider()
  end

  @doc """
  Registration changeset for OAuth users.
  Creates a new user from OAuth provider data without password.
  """
  @spec oauth_registration_changeset(User.t(), map()) :: Ecto.Changeset.t()
  def oauth_registration_changeset(user, attrs) do
    user
    |> cast(attrs, [
      :email, :username, :display_name, :avatar_url,
      :auth_type, :oauth_provider, :oauth_uid, :oauth_data,
      :email_verified_at
    ])
    |> validate_required([:oauth_provider, :oauth_uid])
    |> maybe_validate_username()
    |> validate_email_format()
    |> validate_oauth_provider()
    |> unique_constraint(:email)
    |> unique_constraint(:username)
  end

  # ---------------------------------------------------------------------------
  # Wallet Authentication
  # ---------------------------------------------------------------------------

  @doc """
  Wallet registration changeset for Web3 users.
  """
  @spec wallet_registration_changeset(User.t(), map()) :: Ecto.Changeset.t()
  def wallet_registration_changeset(user, attrs) do
    user
    |> cast(attrs, [:username, :wallet_address, :display_name])
    |> validate_required([:username, :wallet_address])
    |> validate_username()
    |> validate_wallet_address()
    |> generate_wallet_nonce()
  end

  @doc """
  Anonymous wallet registration changeset (PIN-based auth).
  """
  @spec wallet_pin_registration_changeset(User.t(), map()) :: Ecto.Changeset.t()
  def wallet_pin_registration_changeset(user, attrs) do
    user
    |> cast(attrs, [:username, :wallet_address, :crypto_alias, :pin_hash, :display_name, :auth_type])
    |> validate_required([:wallet_address, :crypto_alias, :pin_hash])
    |> validate_cgraph_wallet_address()
    |> validate_crypto_alias()
    |> unique_constraint(:wallet_address)
    |> unique_constraint(:crypto_alias)
    |> put_default_username()
  end

  # ---------------------------------------------------------------------------
  # Subscription
  # ---------------------------------------------------------------------------

  @doc """
  Changeset for subscription-related fields.
  Used by Subscriptions context for tier updates and Stripe linking.
  """
  @spec subscription_changeset(User.t(), map()) :: Ecto.Changeset.t()
  def subscription_changeset(user, attrs) do
    user
    |> cast(attrs, [
      :subscription_tier,
      :subscription_expires_at,
      :stripe_customer_id,
      :is_premium
    ])
    |> validate_inclusion(:subscription_tier, ~w(free premium enterprise))
  end

  # ---------------------------------------------------------------------------
  # Private Validators
  # ---------------------------------------------------------------------------

  defp validate_oauth_provider(changeset) do
    changeset
    |> validate_inclusion(:oauth_provider, ["google", "apple", "facebook", "tiktok", nil])
  end

  defp validate_email_format(changeset) do
    case get_change(changeset, :email) do
      nil -> changeset
      _ ->
        changeset
        |> validate_format(:email, ~r/^[^\s]+@[^\s]+$/, message: "must be a valid email address")
        |> validate_length(:email, max: 160)
    end
  end

  defp maybe_validate_username(changeset) do
    case get_change(changeset, :username) do
      nil -> changeset
      "" -> changeset
      _ -> validate_username(changeset)
    end
  end

  defp validate_username(changeset) do
    changeset
    |> validate_length(:username, min: 3, max: 30)
    |> validate_format(:username, ~r/^[a-zA-Z0-9_]+$/,
      message: "can only contain letters, numbers, and underscores"
    )
    |> unsafe_validate_unique(:username, CGraph.Repo)
    |> unique_constraint(:username)
  end

  defp validate_wallet_address(changeset) do
    changeset
    |> validate_format(:wallet_address, ~r/^0x[a-fA-F0-9]{40}$/,
      message: "must be a valid Ethereum address"
    )
    |> unsafe_validate_unique(:wallet_address, CGraph.Repo)
    |> unique_constraint(:wallet_address)
    |> update_change(:wallet_address, &String.downcase/1)
  end

  defp validate_cgraph_wallet_address(changeset) do
    changeset
    |> validate_format(:wallet_address, ~r/^0x[0-9A-F]{24}$/,
      message: "must be a valid CGraph wallet address (0x + 24 hex chars)"
    )
    |> unique_constraint(:wallet_address)
  end

  defp validate_crypto_alias(changeset) do
    changeset
    |> validate_format(:crypto_alias, ~r/^[a-z]+-[a-z]+-[A-Z0-9]{6}$/,
      message: "must be a valid crypto alias (word-word-XXXXXX format)"
    )
    |> unique_constraint(:crypto_alias)
  end

  defp put_default_username(changeset) do
    case get_field(changeset, :username) do
      nil ->
        alias_val = get_change(changeset, :crypto_alias) || ""
        username = String.replace(alias_val, "-", "_")
        put_change(changeset, :username, username)
      _ ->
        changeset
    end
  end

  defp generate_wallet_nonce(changeset) do
    nonce = :crypto.strong_rand_bytes(32) |> Base.encode16(case: :lower)
    put_change(changeset, :wallet_nonce, nonce)
  end
end
