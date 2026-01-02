defmodule Cgraph.Accounts.User do
  @moduledoc """
  User schema for CGraph accounts.
  
  Supports both email/password and Ethereum wallet authentication.
  Uses UUIDs for primary keys and soft deletes.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  @derive {Jason.Encoder, only: [
    :id, :user_id, :username, :display_name, :email, :avatar_url, :bio,
    :wallet_address, :is_verified, :is_premium, :status, :last_seen_at,
    :inserted_at
  ]}

  # 14 days in seconds for username change cooldown
  @username_change_cooldown_days 14

  schema "users" do
    # Unique sequential ID for display (e.g., #0001)
    field :user_id, :integer, read_after_writes: true
    field :username, :string
    field :username_changed_at, :utc_datetime
    field :display_name, :string
    field :email, :string
    field :password_hash, :string
    field :password, :string, virtual: true
    field :password_confirmation, :string, virtual: true

    # Wallet authentication
    field :wallet_address, :string
    field :wallet_nonce, :string
    field :crypto_alias, :string
    field :pin_hash, :string
    field :auth_type, Ecto.Enum, values: [:email, :wallet, :both], default: :email

    # Profile
    field :avatar_url, :string
    field :banner_url, :string
    field :bio, :string
    field :status, :string, default: "online"
    field :custom_status, :string
    field :status_message, :string

    # Account status
    field :is_active, :boolean, default: true
    field :is_verified, :boolean, default: false
    field :is_premium, :boolean, default: false
    field :is_admin, :boolean, default: false
    field :is_suspended, :boolean, default: false
    field :karma, :integer, default: 0

    # Ban management
    field :banned_at, :utc_datetime
    field :banned_until, :utc_datetime
    field :ban_reason, :string
    belongs_to :banned_by, __MODULE__, foreign_key: :banned_by_id

    # Suspension
    field :suspended_at, :utc_datetime
    field :suspended_until, :utc_datetime
    field :suspension_reason, :string

    # 2FA / TOTP
    field :totp_secret, :string
    field :totp_enabled, :boolean, default: false
    field :totp_enabled_at, :utc_datetime
    field :totp_backup_codes, {:array, :string}, default: []
    field :totp_backup_hashes, {:array, :string}, default: []
    field :recovery_codes, {:array, :string}, default: []

    # Tracking
    field :last_seen_at, :utc_datetime
    field :last_active_at, :utc_datetime
    field :last_login_at, :utc_datetime
    field :login_count, :integer, default: 0
    field :email_verified_at, :utc_datetime
    field :deleted_at, :utc_datetime
    field :previous_usernames, {:array, :string}, default: []

    # Associations
    has_many :sessions, Cgraph.Accounts.Session
    has_many :push_tokens, Cgraph.Accounts.PushToken
    has_many :owned_groups, Cgraph.Groups.Group, foreign_key: :owner_id
    has_many :group_memberships, Cgraph.Groups.Member
    has_many :messages, Cgraph.Messaging.Message, foreign_key: :sender_id
    has_many :posts, Cgraph.Forums.Post, foreign_key: :author_id
    has_many :comments, Cgraph.Forums.Comment, foreign_key: :author_id

    timestamps()
  end

  @doc """
  Changeset for TOTP 2FA settings.
  """
  def totp_changeset(user, attrs) do
    user
    |> cast(attrs, [:totp_enabled, :totp_secret, :totp_backup_codes, :totp_enabled_at])
  end

  @doc """
  Registration changeset for new users.
  Requires username, email, and password.
  Password confirmation is optional but validated if provided.
  """
  def registration_changeset(user, attrs) do
    user
    |> cast(attrs, [:username, :email, :password, :password_confirmation, :display_name])
    |> validate_required([:email, :password])  # username is now optional
    |> maybe_validate_username()
    |> validate_email()
    |> validate_password()
    |> hash_password()
  end

  defp maybe_validate_username(changeset) do
    case get_change(changeset, :username) do
      nil -> changeset
      "" -> changeset
      _ -> validate_username(changeset)
    end
  end

  @doc """
  Wallet registration changeset for Web3 users.
  """
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
        alias = get_change(changeset, :crypto_alias) || ""
        username = String.replace(alias, "-", "_")
        put_change(changeset, :username, username)
      _ ->
        changeset
    end
  end

  @doc """
  Profile update changeset.
  """
  def profile_changeset(user, attrs) do
    user
    |> cast(attrs, [:display_name, :bio, :avatar_url, :banner_url, :custom_status])
    |> validate_length(:bio, max: 500)
    |> validate_length(:custom_status, max: 100)
  end

  @doc """
  Username change changeset with 14-day cooldown.
  """
  def username_changeset(user, attrs) do
    user
    |> cast(attrs, [:username])
    |> validate_required([:username])
    |> validate_username()
    |> validate_username_cooldown()
    |> put_change(:username_changed_at, DateTime.utc_now() |> DateTime.truncate(:second))
  end

  defp validate_username_cooldown(changeset) do
    user = changeset.data
    
    case user.username_changed_at do
      nil ->
        # First time setting username, no cooldown
        changeset
      
      last_changed ->
        cooldown_end = DateTime.add(last_changed, @username_change_cooldown_days * 24 * 60 * 60, :second)
        now = DateTime.utc_now()
        
        if DateTime.compare(now, cooldown_end) == :lt do
          days_remaining = div(DateTime.diff(cooldown_end, now, :second), 86400) + 1
          add_error(changeset, :username, "can only be changed every 14 days. #{days_remaining} day(s) remaining")
        else
          changeset
        end
    end
  end

  @doc """
  Returns true if the user can change their username.
  """
  def can_change_username?(%__MODULE__{username_changed_at: nil}), do: true
  def can_change_username?(%__MODULE__{username_changed_at: last_changed}) do
    cooldown_end = DateTime.add(last_changed, @username_change_cooldown_days * 24 * 60 * 60, :second)
    DateTime.compare(DateTime.utc_now(), cooldown_end) != :lt
  end

  @doc """
  Returns the date when the user can next change their username.
  """
  def next_username_change_date(%__MODULE__{username_changed_at: nil}), do: nil
  def next_username_change_date(%__MODULE__{username_changed_at: last_changed}) do
    DateTime.add(last_changed, @username_change_cooldown_days * 24 * 60 * 60, :second)
  end

  @doc """
  Formats user_id as display string (e.g., #0001).
  """
  def format_user_id(%__MODULE__{user_id: nil}), do: nil
  def format_user_id(%__MODULE__{user_id: user_id}) do
    "#" <> String.pad_leading(Integer.to_string(user_id), 4, "0")
  end

  @doc """
  Password change changeset.
  """
  def password_changeset(user, attrs) do
    user
    |> cast(attrs, [:password, :password_confirmation])
    |> validate_required([:password, :password_confirmation])
    |> validate_password()
    |> hash_password()
  end

  @doc """
  Email change changeset.
  """
  def email_changeset(user, attrs) do
    user
    |> cast(attrs, [:email])
    |> validate_required([:email])
    |> validate_email()
    |> put_change(:email_verified_at, nil)
  end

  @doc """
  General update changeset for user attributes.
  Allows updating profile fields and admin-controlled fields.
  """
  def update_changeset(user, attrs) do
    user
    |> cast(attrs, [
      :username, :display_name, :bio, :avatar_url, :banner_url, 
      :custom_status, :status, :is_admin, :is_verified, :is_premium
    ])
    |> validate_length(:bio, max: 500)
    |> validate_length(:custom_status, max: 100)
    |> validate_format(:username, ~r/^[a-zA-Z0-9_]+$/,
      message: "can only contain letters, numbers, and underscores"
    )
    |> validate_length(:username, min: 3, max: 30)
    |> unsafe_validate_unique(:username, Cgraph.Repo)
    |> unique_constraint(:username)
  end

  # Private functions

  defp validate_username(changeset) do
    changeset
    |> validate_length(:username, min: 3, max: 30)
    |> validate_format(:username, ~r/^[a-zA-Z0-9_]+$/,
      message: "can only contain letters, numbers, and underscores"
    )
    |> unsafe_validate_unique(:username, Cgraph.Repo)
    |> unique_constraint(:username)
  end

  defp validate_email(changeset) do
    changeset
    |> validate_format(:email, ~r/^[^\s]+@[^\s]+\.[^\s]+$/,
      message: "must be a valid email address"
    )
    |> validate_length(:email, max: 160)
    |> unsafe_validate_unique(:email, Cgraph.Repo)
    |> unique_constraint(:email)
    |> update_change(:email, &String.downcase/1)
  end

  defp validate_password(changeset) do
    changeset
    |> validate_length(:password, min: 8, max: 72)
    |> validate_format(:password, ~r/[a-z]/,
      message: "must contain at least one lowercase letter"
    )
    |> validate_format(:password, ~r/[A-Z]/,
      message: "must contain at least one uppercase letter"
    )
    |> validate_format(:password, ~r/[0-9]/,
      message: "must contain at least one number"
    )
    |> validate_format(:password, ~r/[!@#$%^&*(),.?":{}|<>]/,
      message: "must contain at least one special character"
    )
    |> validate_confirmation(:password, message: "passwords do not match")
  end

  defp validate_wallet_address(changeset) do
    changeset
    |> validate_format(:wallet_address, ~r/^0x[a-fA-F0-9]{40}$/,
      message: "must be a valid Ethereum address"
    )
    |> unsafe_validate_unique(:wallet_address, Cgraph.Repo)
    |> unique_constraint(:wallet_address)
    |> update_change(:wallet_address, &String.downcase/1)
  end

  defp hash_password(changeset) do
    case get_change(changeset, :password) do
      nil -> changeset
      password ->
        changeset
        |> put_change(:password_hash, Argon2.hash_pwd_salt(password))
        |> delete_change(:password)
        |> delete_change(:password_confirmation)
    end
  end

  defp generate_wallet_nonce(changeset) do
    nonce = :crypto.strong_rand_bytes(32) |> Base.encode16(case: :lower)
    put_change(changeset, :wallet_nonce, nonce)
  end
end
