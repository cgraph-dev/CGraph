defmodule CGraph.Accounts.User do
  @moduledoc """
  User schema for CGraph accounts.

  Supports both email/password and Ethereum wallet authentication.
  Uses UUIDs for primary keys and soft deletes.

  ## Submodules

  - `CGraph.Accounts.User.AuthStrategies` — Wallet, OAuth, TOTP, and subscription changesets
  - `CGraph.Accounts.User.Helpers` — Password verification, display-ID formatting, cooldown checks
  """
  use Ecto.Schema
  import Ecto.Changeset

  alias CGraph.Accounts.User.{AuthStrategies, Helpers}

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  @derive {Jason.Encoder, only: [
    :id, :uid, :user_id, :username, :display_name, :email, :avatar_url, :bio,
    :pronouns, :wallet_address, :is_verified, :is_premium, :status, :last_seen_at,
    :inserted_at
  ]}

  # 14 days in seconds for username change cooldown
  @username_change_cooldown_days 14

  schema "users" do
    # Random 10-digit UID for public display (e.g., #4829173650)
    # Security: Non-sequential to prevent enumeration attacks
    field :uid, :string, read_after_writes: true
    # Legacy sequential ID (kept for backward compatibility)
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
    field :signature, :string
    field :pronouns, :string
    field :status, :string, default: "online"
    field :custom_status, :string
    field :status_message, :string

    # Account status
    field :is_active, :boolean, default: true
    field :is_verified, :boolean, default: false
    field :is_premium, :boolean, default: false
    field :is_admin, :boolean, default: false
    field :is_suspended, :boolean, default: false
    field :is_profile_private, :boolean, default: false  # When true, non-friends see limited info
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

    # OAuth authentication
    field :oauth_provider, :string  # Primary OAuth provider (google, apple, facebook, tiktok)
    field :oauth_uid, :string       # User ID from the primary OAuth provider
    field :oauth_data, :map         # JSON map of all linked OAuth accounts with metadata

    # Email Digest Preferences
    field :email_digest_enabled, :boolean, default: true
    field :email_digest_frequency, :string, default: "weekly"
    field :last_digest_sent_at, :utc_datetime

    # Tracking
    field :last_seen_at, :utc_datetime
    field :last_active_at, :utc_datetime
    field :last_login_at, :utc_datetime
    field :login_count, :integer, default: 0
    field :email_verified_at, :utc_datetime
    field :deleted_at, :utc_datetime
    field :deactivated_at, :utc_datetime
    field :previous_usernames, {:array, :string}, default: []

    # Gamification
    field :xp, :integer, default: 0
    field :level, :integer, default: 1
    field :coins, :integer, default: 0
    field :streak_days, :integer, default: 0
    field :streak_last_claimed, :date
    field :streak_longest, :integer, default: 0
    field :equipped_title_id, :binary_id
    field :equipped_badge_ids, {:array, :binary_id}, default: []
    field :subscription_tier, :string, default: "free"
    field :subscription_expires_at, :utc_datetime
    field :daily_bonus_claimed_at, :date
    field :total_messages_sent, :integer, default: 0
    field :total_posts_created, :integer, default: 0

    # Avatar Border Customization (150+ designs with full configuration)
    field :avatar_border_id, :string
    field :avatar_border_animation, :string
    field :avatar_border_color_primary, :string
    field :avatar_border_color_secondary, :string
    field :avatar_border_particle_effect, :string
    field :avatar_border_glow_intensity, :integer, default: 50
    field :avatar_border_config, :map, default: %{}
    field :avatar_border_equipped_at, :utc_datetime

    # Stripe integration
    field :stripe_customer_id, :string

    # Associations
    has_many :sessions, CGraph.Accounts.Session
    has_many :push_tokens, CGraph.Accounts.PushToken
    has_many :owned_groups, CGraph.Groups.Group, foreign_key: :owner_id
    has_many :group_memberships, CGraph.Groups.Member
    has_many :messages, CGraph.Messaging.Message, foreign_key: :sender_id
    has_many :posts, CGraph.Forums.Post, foreign_key: :author_id
    has_many :comments, CGraph.Forums.Comment, foreign_key: :author_id
    has_one :customization, CGraph.Customizations.UserCustomization, foreign_key: :user_id

    timestamps()
  end

  # -- Delegated Functions ----------------------------------------------------

  defdelegate totp_changeset(user, attrs), to: AuthStrategies
  defdelegate oauth_changeset(user, attrs), to: AuthStrategies
  defdelegate oauth_registration_changeset(user, attrs), to: AuthStrategies
  defdelegate wallet_registration_changeset(user, attrs), to: AuthStrategies
  defdelegate wallet_pin_registration_changeset(user, attrs), to: AuthStrategies
  defdelegate subscription_changeset(user, attrs), to: AuthStrategies

  defdelegate valid_password?(user, password), to: Helpers
  defdelegate format_user_id(user), to: Helpers
  defdelegate can_change_username?(user), to: Helpers
  defdelegate next_username_change_date(user), to: Helpers

  @doc "Builds a changeset for validating user attributes."
  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(user, attrs) do
    user
    |> cast(attrs, [
      :username,
      :email,
      :display_name,
      :bio,
      :avatar_url,
      :banner_url,
      :status,
      :role,
      :last_username_change_at,
      :username_changes_count,
      :subscription_tier,
      :subscription_status
    ])
    |> validate_length(:username, min: 3, max: 30)
    |> validate_length(:display_name, max: 100)
    |> validate_length(:bio, max: 500)
    |> unique_constraint(:username)
    |> unique_constraint(:email)
  end

  @doc """
  Registration changeset for new users.
  Requires username, email, and password.
  Password confirmation is optional but validated if provided.
  """
  @spec registration_changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
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
  Profile update changeset.
  """
  @spec profile_changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def profile_changeset(user, attrs) do
    user
    |> cast(attrs, [:display_name, :bio, :signature, :avatar_url, :banner_url, :custom_status, :pronouns])
    |> validate_length(:bio, max: 500)
    |> validate_length(:custom_status, max: 100)
    |> validate_length(:pronouns, max: 50)
  end

  @doc """
  Username change changeset with 14-day cooldown.
  """
  @spec username_changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def username_changeset(user, attrs) do
    user
    |> cast(attrs, [:username])
    |> validate_required([:username])
    |> validate_username()
    |> validate_username_cooldown()
    |> put_change(:username_changed_at, DateTime.truncate(DateTime.utc_now(), :second))
  end

  defp validate_username_cooldown(changeset) do
    user = changeset.data

    case user.username_changed_at do
      nil ->
        # First time setting username, no cooldown
        changeset

      last_changed ->
        cooldown_end = DateTime.add(last_changed, @username_change_cooldown_days * 24 * 60 * 60, :second)
        now = DateTime.truncate(DateTime.utc_now(), :second)

        if DateTime.compare(now, cooldown_end) == :lt do
          days_remaining = div(DateTime.diff(cooldown_end, now, :second), 86_400) + 1
          add_error(changeset, :username, "can only be changed every 14 days. #{days_remaining} day(s) remaining")
        else
          changeset
        end
    end
  end

  @doc """
  Password change changeset.
  """
  @spec password_changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
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
  @spec email_changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
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
  @spec update_changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def update_changeset(user, attrs) do
    user
    |> cast(attrs, [
      :username, :display_name, :bio, :avatar_url, :banner_url,
      :custom_status, :pronouns, :status, :is_admin, :is_verified, :is_premium, :is_profile_private
    ])
    |> validate_length(:bio, max: 500)
    |> validate_length(:custom_status, max: 100)
    |> validate_format(:username, ~r/^[a-zA-Z0-9_]+$/,
      message: "can only contain letters, numbers, and underscores"
    )
    |> validate_length(:username, min: 3, max: 30)
    |> unsafe_validate_unique(:username, CGraph.Repo)
    |> unique_constraint(:username)
  end

  # -- Private Validators ------------------------------------------------------

  defp validate_username(changeset) do
    changeset
    |> validate_length(:username, min: 3, max: 30)
    |> validate_format(:username, ~r/^[a-zA-Z0-9_]+$/,
      message: "can only contain letters, numbers, and underscores"
    )
    |> unsafe_validate_unique(:username, CGraph.Repo)
    |> unique_constraint(:username)
  end

  defp validate_email(changeset) do
    changeset
    |> validate_format(:email, ~r/^[^\s]+@[^\s]+\.[^\s]+$/,
      message: "must be a valid email address"
    )
    |> validate_length(:email, max: 160)
    |> unsafe_validate_unique(:email, CGraph.Repo)
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
end
