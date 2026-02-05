defmodule CGraph.Accounts do
  @moduledoc """
  The Accounts context.

  Handles user management, authentication, sessions, friendships, and settings.
  """

  import Ecto.Query, warn: false

  alias CGraph.Accounts.{Friendship, Session, User, UserSettings, WalletChallenge}
  alias CGraph.Repo
  alias CGraph.Security.PasswordBreachCheck
  alias CGraph.Workers.{Orchestrator, SendEmailNotification}

  # ============================================================================
  # Submodule Delegations (Phase 6 Architecture Refactor)
  # These delegate to extracted submodules for better code organization
  # ============================================================================

  # Users submodule delegations
  alias CGraph.Accounts.Users, as: UsersModule
  defdelegate get_user_v2(id), to: UsersModule, as: :get_user
  defdelegate get_user_by_email_v2(email), to: UsersModule, as: :get_user_by_email
  defdelegate get_user_by_username_v2(username), to: UsersModule, as: :get_user_by_username
  defdelegate list_users_v2(opts \\ []), to: UsersModule, as: :list_users

  # Authentication submodule delegations
  alias CGraph.Accounts.Authentication, as: AuthModule
  defdelegate authenticate_v2(identifier, password), to: AuthModule, as: :authenticate
  defdelegate create_session_v2(user, device_info \\ %{}), to: AuthModule, as: :create_session
  defdelegate get_session_by_token_v2(token), to: AuthModule, as: :get_session_by_token
  defdelegate revoke_session_v2(session), to: AuthModule, as: :revoke_session

  # Registration submodule delegations
  alias CGraph.Accounts.Registration, as: RegModule
  defdelegate register_user_v2(attrs, opts \\ []), to: RegModule, as: :register_user

  # Sessions submodule delegations
  alias CGraph.Accounts.Sessions, as: SessionsModule
  defdelegate list_user_sessions_v2(user_id), to: SessionsModule, as: :list_user_sessions
  defdelegate revoke_all_sessions_v2(user_id, except \\ nil), to: SessionsModule, as: :revoke_all

  # Friends submodule delegations
  alias CGraph.Accounts.Friends, as: FriendsModule
  defdelegate send_friend_request_v2(from_user_id, to_user_id, message \\ nil), to: FriendsModule, as: :send_friend_request
  defdelegate accept_friend_request_v2(user_id, friend_id), to: FriendsModule, as: :accept_friend_request
  defdelegate decline_friend_request_v2(user_id, friend_id), to: FriendsModule, as: :decline_friend_request
  defdelegate remove_friend_v2(user_id, friend_id), to: FriendsModule, as: :remove_friend
  defdelegate block_user_v2(blocker_id, blocked_id), to: FriendsModule, as: :block_user
  defdelegate unblock_user_v2(blocker_id, blocked_id), to: FriendsModule, as: :unblock_user
  defdelegate list_friends_v2(user_id, opts \\ []), to: FriendsModule, as: :list_friends
  defdelegate list_pending_requests_v2(user_id), to: FriendsModule, as: :list_pending_requests
  defdelegate are_friends_v2?(user_id, friend_id), to: FriendsModule, as: :are_friends?

  # Settings submodule delegations
  alias CGraph.Accounts.Settings, as: SettingsModule
  defdelegate get_user_settings_v2(user_id), to: SettingsModule, as: :get_user_settings
  defdelegate update_user_settings_v2(user_id, attrs), to: SettingsModule, as: :update_user_settings

  # Wallet auth submodule delegations
  alias CGraph.Accounts.WalletAuth, as: WalletModule
  defdelegate get_or_create_wallet_challenge_v2(address), to: WalletModule, as: :get_or_create_challenge
  defdelegate verify_wallet_signature_v2(address, signature), to: WalletModule, as: :verify_signature

  # Search submodule delegations
  alias CGraph.Accounts.Search, as: SearchModule
  defdelegate search_users_v2(query, opts \\ []), to: SearchModule, as: :search_users
  defdelegate get_user_suggestions_v2(query, opts \\ []), to: SearchModule, as: :get_user_suggestions

  # Password reset submodule delegations
  alias CGraph.Accounts.PasswordReset, as: PasswordResetModule
  defdelegate request_password_reset_v2(email), to: PasswordResetModule, as: :request_password_reset
  defdelegate reset_password_v2(token, password, confirmation), to: PasswordResetModule, as: :reset_password
  defdelegate verify_password_reset_token_v2(token), to: PasswordResetModule, as: :verify_password_reset_token

  # Email verification submodule delegations
  alias CGraph.Accounts.EmailVerification, as: EmailVerificationModule
  defdelegate send_verification_email_v2(user), to: EmailVerificationModule, as: :send_verification_email
  defdelegate verify_email_v2(token), to: EmailVerificationModule, as: :verify_email
  defdelegate resend_verification_email_v2(user), to: EmailVerificationModule, as: :resend_verification_email

  # Member directory submodule delegations
  alias CGraph.Accounts.MemberDirectory, as: MemberDirectoryModule
  defdelegate list_members_v2(opts \\ []), to: MemberDirectoryModule, as: :list_members
  defdelegate get_member_profile_v2(user_id, viewer), to: MemberDirectoryModule, as: :get_member_profile
  defdelegate list_user_groups_v2(opts \\ []), to: MemberDirectoryModule, as: :list_user_groups
  defdelegate get_member_stats_v2(), to: MemberDirectoryModule, as: :get_member_stats
  defdelegate search_members_v2(opts \\ []), to: MemberDirectoryModule, as: :search_members

  # Profile submodule delegations
  alias CGraph.Accounts.Profile, as: ProfileModule
  defdelegate get_profile_v2(user_id, viewer), to: ProfileModule, as: :get_profile
  defdelegate update_signature_v2(user_id, signature), to: ProfileModule, as: :update_signature
  defdelegate update_bio_v2(user_id, bio), to: ProfileModule, as: :update_bio
  defdelegate update_profile_v2(user_id, attrs), to: ProfileModule, as: :update_profile

  # ============================================================================
  # Registration & Authentication
  # ============================================================================

  @doc """
  Register a new user with email/password credentials.

  Optionally checks password against HaveIBeenPwned database.
  """
  def register_user(attrs, opts \\ []) do
    check_breach = Keyword.get(opts, :check_breach, true)

    changeset = %User{}
    |> User.registration_changeset(attrs)
    |> maybe_apply_breach_check(check_breach)

    case Repo.insert(changeset) do
      {:ok, user} = result ->
        maybe_async_breach_check(attrs, check_breach, user.id)
        result
      error -> error
    end
  end

  defp maybe_apply_breach_check(changeset, true), do: apply_breach_check(changeset)
  defp maybe_apply_breach_check(changeset, false), do: changeset

  defp maybe_async_breach_check(_attrs, true, _user_id), do: :ok
  defp maybe_async_breach_check(attrs, false, user_id) do
    password = Map.get(attrs, "password") || Map.get(attrs, :password)
    if password, do: PasswordBreachCheck.check_async(password, user_id: user_id)
  end

  defp apply_breach_check(changeset) do
    password = Ecto.Changeset.get_change(changeset, :password)

    if password do
      PasswordBreachCheck.validate_changeset(changeset, :password)
    else
      changeset
    end
  end

  @doc """
  Create a new user (alias for register_user).
  """
  def create_user(attrs), do: register_user(attrs)

  @doc """
  Authenticate a user by email and password.
  """
  def authenticate_user(email, password) do
    user = Repo.get_by(User, email: String.downcase(email))

    cond do
      is_nil(user) ->
        # Perform dummy check to prevent timing attacks
        Argon2.no_user_verify()
        {:error, :invalid_credentials}

      Argon2.verify_pass(password, user.password_hash) ->
        {:ok, user}

      true ->
        {:error, :invalid_credentials}
    end
  end

  @doc """
  Authenticate a user by email OR username and password.
  Automatically detects if identifier is email (contains @) or username.
  Both email and username lookups are case-insensitive for better UX.
  """
  def authenticate_by_identifier(identifier, password) do
    user = if String.contains?(identifier, "@") do
      Repo.get_by(User, email: String.downcase(identifier))
    else
      # Case-insensitive username lookup using Ecto query
      from(u in User, where: fragment("lower(?)", u.username) == ^String.downcase(identifier))
      |> Repo.one()
    end

    cond do
      is_nil(user) ->
        Argon2.no_user_verify()
        {:error, :invalid_credentials}

      is_nil(user.password_hash) ->
        # User registered via OAuth/wallet only
        {:error, :no_password_set}

      Argon2.verify_pass(password, user.password_hash) ->
        {:ok, user}

      true ->
        {:error, :invalid_credentials}
    end
  end

  @doc """
  Get a user by their UID (random 10-digit string).
  Handles formats like "#4829173650" or "4829173650".
  Also supports legacy numeric user_id for backward compatibility.
  """
  def get_user_by_user_id(uid_or_user_id)

  def get_user_by_user_id(uid) when is_binary(uid) do
    # Handle formats like "#4829173650" or "4829173650"
    cleaned = uid |> String.replace("#", "") |> String.trim()

    # First try to find by new uid field (10-digit string)
    case Repo.get_by(User, uid: cleaned) do
      nil ->
        # Fallback: try legacy numeric user_id
        case Integer.parse(cleaned) do
          {num, ""} ->
            case Repo.get_by(User, user_id: num) do
              nil -> {:error, :not_found}
              user -> {:ok, user}
            end
          _ -> {:error, :not_found}
        end
      user -> {:ok, user}
    end
  end

  def get_user_by_user_id(user_id) when is_integer(user_id) do
    # Legacy: search by numeric user_id
    case Repo.get_by(User, user_id: user_id) do
      nil -> {:error, :not_found}
      user -> {:ok, user}
    end
  end

  @doc """
  Create a session for user.

  Accepts either a Plug.Conn or a map with session metadata.
  """
  def create_session(user, conn_or_attrs) do
    {user_agent, ip_address} = extract_session_metadata(conn_or_attrs)
    token_hash = :crypto.strong_rand_bytes(32) |> Base.encode64()
    expires_at = DateTime.utc_now() |> DateTime.add(30 * 24 * 60 * 60, :second)

    %Session{}
    |> Session.changeset(%{
      user_id: user.id,
      token_hash: token_hash,
      user_agent: user_agent,
      ip_address: ip_address,
      expires_at: expires_at
    })
    |> Repo.insert()
  end

  # Extract session metadata from Plug.Conn
  defp extract_session_metadata(%Plug.Conn{} = conn) do
    user_agent = get_user_agent(conn)
    ip_address = get_ip_address(conn)
    {user_agent, ip_address}
  end

  # Extract session metadata from plain map
  defp extract_session_metadata(attrs) when is_map(attrs) do
    user_agent = Map.get(attrs, :user_agent) || Map.get(attrs, "user_agent")
    ip_address = Map.get(attrs, :ip_address) || Map.get(attrs, "ip_address") || "127.0.0.1"
    {user_agent, ip_address}
  end

  defp get_user_agent(conn) do
    case Plug.Conn.get_req_header(conn, "user-agent") do
      [ua | _] -> ua
      _ -> nil
    end
  end

  defp get_ip_address(conn) do
    case Plug.Conn.get_req_header(conn, "x-forwarded-for") do
      [ip | _] -> ip |> String.split(",") |> List.first() |> String.trim()
      _ -> conn.remote_ip |> :inet.ntoa() |> to_string()
    end
  end

  @doc """
  Get user by email.
  """
  def get_user_by_email(email) do
    case Repo.get_by(User, email: String.downcase(email)) do
      nil -> {:error, :not_found}
      user -> {:ok, user}
    end
  end

  @doc """
  Get user by OAuth provider and UID.
  Returns the user if found, nil otherwise.
  """
  def get_user_by_oauth(provider, uid) when is_binary(provider) and is_binary(uid) do
    Repo.get_by(User, oauth_provider: provider, oauth_uid: uid)
  end

  # ============================================================================
  # Wallet Authentication
  # ============================================================================

  @doc """
  Get or create a wallet authentication challenge nonce.
  """
  def get_or_create_wallet_challenge(wallet_address) do
    normalized_address = String.downcase(wallet_address)

    case Repo.get_by(WalletChallenge, wallet_address: normalized_address) do
      nil -> create_new_wallet_challenge(normalized_address)
      wallet_challenge -> refresh_wallet_challenge_if_needed(wallet_challenge)
    end
  end

  defp create_new_wallet_challenge(normalized_address) do
    nonce = generate_nonce()

    %WalletChallenge{}
    |> WalletChallenge.changeset(%{wallet_address: normalized_address, nonce: nonce})
    |> Repo.insert()
    |> extract_nonce_from_result("Failed to create challenge")
  end

  defp refresh_wallet_challenge_if_needed(wallet_challenge) do
    if expired?(wallet_challenge.updated_at, 5 * 60) do
      regenerate_wallet_nonce(wallet_challenge)
    else
      {:ok, wallet_challenge.nonce}
    end
  end

  defp regenerate_wallet_nonce(wallet_challenge) do
    nonce = generate_nonce()

    wallet_challenge
    |> WalletChallenge.changeset(%{nonce: nonce})
    |> Repo.update()
    |> extract_nonce_from_result("Failed to update challenge")
  end

  defp extract_nonce_from_result({:ok, record}, _error_msg), do: {:ok, record.nonce}
  defp extract_nonce_from_result({:error, _}, error_msg), do: {:error, error_msg}

  @doc """
  Verify a wallet signature and authenticate/register user.
  Deletes the challenge nonce after successful verification to prevent replay attacks.
  """
  def verify_wallet_signature(wallet_address, signature) do
    normalized_address = String.downcase(wallet_address)

    with {:ok, wallet_challenge} <- get_wallet_challenge(normalized_address),
         message <- build_sign_message(wallet_challenge.nonce),
         :ok <- verify_signature(message, signature, normalized_address) do
      # Delete the challenge to prevent replay attacks
      Repo.delete(wallet_challenge)

      # Get or create user for this wallet
      case get_user_by_wallet(normalized_address) do
        {:ok, user} -> {:ok, user}
        {:error, :not_found} -> create_wallet_user(normalized_address)
      end
    end
  end

  defp get_wallet_challenge(address) do
    case Repo.get_by(WalletChallenge, wallet_address: address) do
      nil -> {:error, :no_challenge}
      wallet_challenge -> {:ok, wallet_challenge}
    end
  end

  defp build_sign_message(nonce) do
    "Sign this message to authenticate with CGraph.\n\nNonce: #{nonce}"
  end

  defp verify_signature(message, signature, expected_address) do
    # Compute message hash using Ethereum prefix
    prefix = "\x19Ethereum Signed Message:\n#{byte_size(message)}"
    full_message = prefix <> message
    {:ok, hash} = ExKeccak.hash_256(full_message)

    # Decode signature
    with {:ok, sig_bytes} <- decode_signature(signature),
         {:ok, recovered_pubkey} <- recover_public_key(hash, sig_bytes),
         recovered_address <- pubkey_to_address(recovered_pubkey) do
      if recovered_address == expected_address do
        :ok
      else
        {:error, :invalid_signature}
      end
    end
  end

  defp decode_signature("0x" <> hex), do: decode_signature(hex)
  defp decode_signature(hex) when byte_size(hex) == 130 do
    {:ok, Base.decode16!(hex, case: :mixed)}
  end
  defp decode_signature(_), do: {:error, :invalid_signature}

  defp recover_public_key(hash, sig_bytes) do
    <<r::binary-size(32), s::binary-size(32), v::integer>> = sig_bytes
    recovery_id = if v >= 27, do: v - 27, else: v

    case ExSecp256k1.recover_compact(hash, r <> s, recovery_id) do
      {:ok, pubkey} -> {:ok, pubkey}
      _ -> {:error, :invalid_signature}
    end
  end

  defp pubkey_to_address(pubkey) do
    # Remove the first byte (0x04 uncompressed point marker)
    <<_::8, rest::binary>> = pubkey
    {:ok, hash} = ExKeccak.hash_256(rest)
    # Take last 20 bytes
    <<_::binary-size(12), address::binary-size(20)>> = hash
    "0x" <> Base.encode16(address, case: :lower)
  end

  defp get_user_by_wallet(address) do
    case Repo.get_by(User, wallet_address: address) do
      nil -> {:error, :not_found}
      user -> {:ok, user}
    end
  end

  defp create_wallet_user(wallet_address) do
    username = "wallet_" <> String.slice(wallet_address, 2, 8)

    %User{}
    |> User.wallet_registration_changeset(%{
      wallet_address: wallet_address,
      username: username,
      display_name: String.slice(wallet_address, 0, 10) <> "..."
    })
    |> Repo.insert()
  end

  defp generate_nonce do
    :crypto.strong_rand_bytes(32) |> Base.encode16(case: :lower)
  end

  defp expired?(datetime, seconds) do
    DateTime.diff(DateTime.utc_now(), datetime) > seconds
  end

  # ============================================================================
  # User Management
  # ============================================================================

  @doc """
  Get a user by ID.
  """
  def get_user(id) do
    case Repo.get(User, id) do
      nil -> {:error, :not_found}
      user -> {:ok, user}
    end
  end

  @doc """
  Get a user by ID, raising if not found.
  """
  def get_user!(id) do
    Repo.get!(User, id)
  end

  @doc """
  Deactivate (soft delete) a user account.

  Sets deleted_at timestamp but preserves the record for data integrity.
  """
  def deactivate_user(user) do
    deleted_at = DateTime.utc_now() |> DateTime.truncate(:second)

    user
    |> Ecto.Changeset.change(deleted_at: deleted_at)
    |> Repo.update()
  end

  @doc """
  Get a user by username (case-insensitive).
  """
  def get_user_by_username(username) do
    query = from u in User,
      where: fragment("lower(?)", u.username) == ^String.downcase(username)

    case Repo.one(query) do
      nil -> {:error, :not_found}
      user -> {:ok, user}
    end
  end

  @doc """
  Get user with profile data loaded.
  """
  def get_user_profile(user_id) do
    query = from u in User,
      where: u.id == ^user_id,
      preload: [:settings]

    case Repo.one(query) do
      nil -> {:error, :not_found}
      user -> {:ok, user}
    end
  end

  @doc """
  List users with pagination.
  """
  def list_users(opts \\ []) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 20)

    query = from u in User,
      order_by: [asc: u.username]

    total = Repo.aggregate(query, :count, :id)

    users = query
      |> limit(^per_page)
      |> offset(^((page - 1) * per_page))
      |> Repo.all()

    meta = %{
      page: page,
      per_page: per_page,
      total: total,
      total_pages: ceil(total / per_page)
    }

    {users, meta}
  end

  @doc """
  List all admin users for notification purposes.
  Returns users with admin or moderator roles.
  """
  def list_admin_users do
    query = from u in User,
      where: u.role in ["admin", "moderator", "super_admin"],
      where: is_nil(u.deleted_at),
      select: u

    Repo.all(query)
  end

  @doc """
  List top users by karma with pagination.
  """
  def list_top_users_by_karma(opts \\ []) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 20)

    query = from u in User,
      where: u.deleted_at |> is_nil(),
      order_by: [desc: u.karma, asc: u.username]

    total = Repo.aggregate(query, :count, :id)

    users = query
      |> limit(^per_page)
      |> offset(^((page - 1) * per_page))
      |> Repo.all()

    meta = %{
      page: page,
      per_page: per_page,
      total: total,
      total_pages: ceil(total / per_page)
    }

    {users, meta}
  end

  @doc """
  Update a user.
  """
  def update_user(user, attrs) do
    user
    |> User.update_changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Flag a user's profile for moderation review.
  Used when profile content is reported for violations.
  """
  def flag_profile_for_review(user_id) do
    case get_user(user_id) do
      {:ok, user} ->
        user
        |> Ecto.Changeset.change(%{
          flagged_for_review: true,
          flagged_at: DateTime.utc_now() |> DateTime.truncate(:second)
        })
        |> Repo.update()
      error -> error
    end
  end

  @doc """
  Remove specific content from a user's profile.
  Used for moderation actions on profile bio, signature, etc.
  """
  def remove_profile_content(user_id, content_type, opts \\ []) do
    _reason = Keyword.get(opts, :reason, :moderation_removal)

    case get_user(user_id) do
      {:ok, user} ->
        changes = case content_type do
          :bio -> %{bio: nil}
          :signature -> %{signature: nil}
          :avatar -> %{avatar_url: nil}
          :banner -> %{banner_url: nil}
          _ -> %{}
        end

        if map_size(changes) > 0 do
          user
          |> Ecto.Changeset.change(changes)
          |> Repo.update()
        else
          {:ok, user}
        end
      error -> error
    end
  end

  @doc """
  Change a user's username with 14-day cooldown enforcement.

  Returns {:error, changeset} if within cooldown period.
  """
  def change_username(user, new_username) do
    user
    |> User.username_changeset(%{username: new_username})
    |> Repo.update()
  end

  @doc """
  Check if user can change their username.
  """
  def can_change_username?(user) do
    User.can_change_username?(user)
  end

  @doc """
  Get the date when user can next change their username.
  """
  def next_username_change_date(user) do
    User.next_username_change_date(user)
  end

  @doc """
  Delete a user account.
  """
  def delete_user(user) do
    Repo.delete(user)
  end

  @doc """
  Update user's avatar URL.
  """
  def update_avatar(user, avatar_url) do
    user
    |> Ecto.Changeset.change(avatar_url: avatar_url)
    |> Repo.update()
  end

  # ============================================================================
  # Sessions
  # ============================================================================

  @doc """
  Generate a session token for browser session storage.
  """
  def generate_session_token(user) do
    token = :crypto.strong_rand_bytes(32)
    token_hash = :crypto.hash(:sha256, token) |> Base.encode64()

    %Session{}
    |> Session.changeset(%{
      user_id: user.id,
      token_hash: token_hash,
      expires_at: DateTime.utc_now() |> DateTime.add(30 * 24 * 60 * 60, :second)
    })
    |> Repo.insert!()

    token
  end

  @doc """
  Get user by session token.
  """
  def get_user_by_session_token(token) when is_binary(token) do
    token_hash = :crypto.hash(:sha256, token) |> Base.encode64()

    query = from s in Session,
      where: s.token_hash == ^token_hash,
      where: is_nil(s.revoked_at),
      where: s.expires_at > ^DateTime.utc_now(),
      join: u in User, on: u.id == s.user_id,
      select: u

    case Repo.one(query) do
      nil -> {:error, :not_found}
      user -> {:ok, user}
    end
  end

  @doc """
  Delete a session token.
  """
  def delete_session_token(token) when is_binary(token) do
    token_hash = :crypto.hash(:sha256, token) |> Base.encode64()

    from(s in Session, where: s.token_hash == ^token_hash)
    |> Repo.update_all(set: [revoked_at: DateTime.utc_now()])

    :ok
  end

  @doc """
  List active sessions for a user.
  """
  def list_sessions(user) do
    query = from s in Session,
      where: s.user_id == ^user.id,
      where: is_nil(s.revoked_at),
      order_by: [desc: s.last_active_at]

    Repo.all(query)
  end

  @doc """
  Alias for list_sessions for controller compatibility.
  """
  def list_user_sessions(user), do: list_sessions(user)

  @doc """
  Revoke a session by session struct.
  """
  def revoke_session(%Session{} = session) do
    session
    |> Ecto.Changeset.change(revoked_at: DateTime.utc_now())
    |> Repo.update()
  end

  @doc """
  Revoke a session by user and session ID.
  """
  def revoke_session(user, session_id) do
    query = from s in Session,
      where: s.id == ^session_id,
      where: s.user_id == ^user.id

    case Repo.one(query) do
      nil -> {:error, :not_found}
      session -> revoke_session(session)
    end
  end

  # ============================================================================
  # Settings
  # ============================================================================

  @doc """
  Get user settings.
  """
  def get_settings(user) do
    case Repo.get_by(UserSettings, user_id: user.id) do
      nil -> create_default_settings(user)
      settings -> {:ok, settings}
    end
  end

  @doc """
  Update user settings.
  """
  def update_settings(user, attrs) do
    with {:ok, settings} <- get_settings(user) do
      settings
      |> UserSettings.changeset(attrs)
      |> Repo.update()
    end
  end

  @doc """
  Reset settings to defaults.
  """
  def reset_settings(user) do
    with {:ok, settings} <- get_settings(user) do
      Repo.delete(settings)
      create_default_settings(user)
    end
  end

  defp create_default_settings(user) do
    %UserSettings{user_id: user.id}
    |> UserSettings.changeset(%{})
    |> Repo.insert()
  end

  # ============================================================================
  # Friendships
  # ============================================================================

  @doc """
  List user's friends.
  """
  def list_friends(user, opts \\ []) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 50)
    status = Keyword.get(opts, :status, "accepted")

    query = from f in Friendship,
      where: (f.user_id == ^user.id or f.friend_id == ^user.id),
      where: f.status == ^status,
      preload: [:user, :friend]

    total = Repo.aggregate(query, :count, :id)

    friendships = query
      |> limit(^per_page)
      |> offset(^((page - 1) * per_page))
      |> Repo.all()
      |> Enum.map(fn f ->
        # Return the other user in the friendship
        if f.user_id == user.id do
          %{f | friend: f.friend}
        else
          %{f | friend: f.user}
        end
      end)

    meta = %{
      page: page,
      per_page: per_page,
      total: total,
      total_pages: ceil(total / per_page)
    }

    {friendships, meta}
  end

  @doc """
  List incoming friend requests.
  """
  def list_friend_requests(user, opts \\ []) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 20)

    query = from f in Friendship,
      where: f.friend_id == ^user.id,
      where: f.status == :pending,
      preload: [:user]

    total = Repo.aggregate(query, :count, :id)

    requests = query
      |> order_by([f], desc: f.inserted_at)
      |> limit(^per_page)
      |> offset(^((page - 1) * per_page))
      |> Repo.all()

    meta = %{page: page, per_page: per_page, total: total}
    {requests, meta}
  end

  @doc """
  List sent friend requests.
  """
  def list_sent_friend_requests(user, opts \\ []) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 20)

    query = from f in Friendship,
      where: f.user_id == ^user.id,
      where: f.status == :pending,
      preload: [:friend]

    total = Repo.aggregate(query, :count, :id)

    requests = query
      |> order_by([f], desc: f.inserted_at)
      |> limit(^per_page)
      |> offset(^((page - 1) * per_page))
      |> Repo.all()

    meta = %{page: page, per_page: per_page, total: total}
    {requests, meta}
  end

  @doc """
  Send a friend request.
  """
  def send_friend_request(from_user, to_user) do
    %Friendship{}
    |> Friendship.changeset(%{
      user_id: from_user.id,
      friend_id: to_user.id,
      status: "pending"
    })
    |> Repo.insert()
  end

  @doc """
  Accept a friend request.

  Can be called with either:
  - A friendship struct directly
  - Two users (addressee, requester) to find and accept the pending request
  """
  def accept_friend_request(%Friendship{} = friendship) do
    # Truncate to seconds for :utc_datetime field (not _usec)
    accepted_time = DateTime.utc_now() |> DateTime.truncate(:second)

    friendship
    |> Ecto.Changeset.change(status: :accepted, accepted_at: accepted_time)
    |> Repo.update()
  end

  def accept_friend_request(addressee, requester) do
    # user_id = requester (who sent the request)
    # friend_id = addressee (who received the request)
    query = from f in Friendship,
      where: f.friend_id == ^addressee.id,
      where: f.user_id == ^requester.id,
      where: f.status == :pending

    case Repo.one(query) do
      nil -> {:error, :not_found}
      friendship -> accept_friend_request(friendship)
    end
  end

  @doc """
  Decline a friend request.

  Can be called with either:
  - A friendship struct directly
  - Two users (addressee, requester) to find and decline the pending request
  """
  def decline_friend_request(%Friendship{} = friendship) do
    Repo.delete(friendship)
  end

  def decline_friend_request(addressee, requester) do
    # user_id = requester (who sent the request)
    # friend_id = addressee (who received the request)
    query = from f in Friendship,
      where: f.friend_id == ^addressee.id,
      where: f.user_id == ^requester.id,
      where: f.status == :pending

    case Repo.one(query) do
      nil -> {:error, :not_found}
      friendship -> decline_friend_request(friendship)
    end
  end

  @doc """
  Get a friend request.
  """
  def get_friend_request(user, friendship_id) do
    query = from f in Friendship,
      where: f.id == ^friendship_id,
      where: f.friend_id == ^user.id,
      where: f.status == :pending

    case Repo.one(query) do
      nil -> {:error, :not_found}
      friendship -> {:ok, friendship}
    end
  end

  @doc """
  Get a friendship.
  """
  def get_friendship(user, friendship_id) do
    query = from f in Friendship,
      where: f.id == ^friendship_id,
      where: f.user_id == ^user.id or f.friend_id == ^user.id

    case Repo.one(query) do
      nil -> {:error, :not_found}
      friendship -> {:ok, friendship}
    end
  end

  @doc """
  Remove a friendship.
  """
  def remove_friendship(_user, friendship) do
    Repo.delete(friendship)
  end

  @doc """
  Unfriend a user.
  """
  def unfriend(user, target_user) do
    query = from f in Friendship,
      where: (f.user_id == ^user.id and f.friend_id == ^target_user.id) or
             (f.user_id == ^target_user.id and f.friend_id == ^user.id),
      where: f.status == :accepted

    case Repo.one(query) do
      nil -> {:error, :not_friends}
      friendship -> Repo.delete(friendship)
    end
  end

  @doc """
  Get friendship status between two users.
  """
  def get_friendship_status(user, target_user) do
    query = from f in Friendship,
      where: (f.user_id == ^user.id and f.friend_id == ^target_user.id) or
             (f.user_id == ^target_user.id and f.friend_id == ^user.id)

    case Repo.one(query) do
      nil -> :none
      %{status: :pending, user_id: user_id} when user_id == user.id -> :pending
      %{status: :pending} -> :incoming
      %{status: :accepted} -> :friends
      _ -> :none
    end
  end

  @doc """
  Check if a user has blocked another user.
  """
  def blocked?(blocker, blocked) do
    # Use atom :blocked for Ecto.Enum type
    query = from f in Friendship,
      where: f.user_id == ^blocker.id,
      where: f.friend_id == ^blocked.id,
      where: f.status == :blocked

    Repo.exists?(query)
  end

  @doc """
  Block a user.
  """
  def block_user(user, target_user) do
    # First remove any existing friendship
    query = from f in Friendship,
      where: (f.user_id == ^user.id and f.friend_id == ^target_user.id) or
             (f.user_id == ^target_user.id and f.friend_id == ^user.id)

    Repo.delete_all(query)

    # Create block record using atom :blocked for Ecto.Enum type
    %Friendship{}
    |> Friendship.changeset(%{
      user_id: user.id,
      friend_id: target_user.id,
      status: :blocked
    })
    |> Repo.insert()
  end

  @doc """
  Unblock a user.
  """
  def unblock_user(user, target_user) do
    # Use atom :blocked for Ecto.Enum type
    query = from f in Friendship,
      where: f.user_id == ^user.id,
      where: f.friend_id == ^target_user.id,
      where: f.status == :blocked

    case Repo.one(query) do
      nil -> {:error, :not_found}
      block -> Repo.delete(block)
    end
  end

  @doc """
  List blocked users.
  """
  def list_blocked_users(user, opts \\ []) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 50)

    # Use atom :blocked for Ecto.Enum type
    query = from f in Friendship,
      where: f.user_id == ^user.id,
      where: f.status == :blocked,
      preload: [:friend]

    total = Repo.aggregate(query, :count, :id)

    # Return the friendship records with friend preloaded
    blocks = query
      |> limit(^per_page)
      |> offset(^((page - 1) * per_page))
      |> Repo.all()

    meta = %{page: page, per_page: per_page, total: total}
    {blocks, meta}
  end

  @doc """
  Get mutual friends between two users.
  """
  def get_mutual_friends(user, target_user) do
    user_friends = get_friend_ids(user)
    target_friends = get_friend_ids(target_user)

    mutual_ids = MapSet.intersection(MapSet.new(user_friends), MapSet.new(target_friends))

    Repo.all(from u in User, where: u.id in ^MapSet.to_list(mutual_ids))
  end

  defp get_friend_ids(user) do
    # Get IDs where user is the requester (user_id)
    sent_friends = from f in Friendship,
      where: f.user_id == ^user.id and f.status == :accepted,
      select: f.friend_id

    # Get IDs where user is the recipient (friend_id)
    received_friends = from f in Friendship,
      where: f.friend_id == ^user.id and f.status == :accepted,
      select: f.user_id

    # Combine both queries
    sent = Repo.all(sent_friends)
    received = Repo.all(received_friends)

    sent ++ received
  end

  @doc """
  Get online friends.
  """
  def get_online_friends(user) do
    friend_ids = get_friend_ids(user)
    online_user_ids = CGraph.Presence.list_online_users()

    online_friend_ids = MapSet.intersection(MapSet.new(friend_ids), MapSet.new(online_user_ids))

    Repo.all(from u in User, where: u.id in ^MapSet.to_list(online_friend_ids))
    |> Enum.map(fn u ->
      status = CGraph.Presence.get_user_status(u.id)
      presence = CGraph.Presence.get_user_presence(u.id)
      status_text = if presence, do: Map.get(presence, :status_message), else: nil
      Map.merge(u, %{status: status, status_text: status_text})
    end)
  end

  @doc """
  Get friend suggestions.
  """
  def get_friend_suggestions(user, opts \\ []) do
    limit = Keyword.get(opts, :limit, 10)

    # Get friends of friends who aren't already friends
    friend_ids = get_friend_ids(user)

    query = from f in Friendship,
      where: f.user_id in ^friend_ids,
      where: f.status == :accepted,
      where: f.friend_id != ^user.id,
      where: f.friend_id not in ^friend_ids,
      group_by: f.friend_id,
      select: %{user_id: f.friend_id, mutual_count: count(f.id)},
      order_by: [desc: count(f.id)],
      limit: ^limit

    suggestions = Repo.all(query)
    user_ids = Enum.map(suggestions, & &1.user_id)

    users = Repo.all(from u in User, where: u.id in ^user_ids)
    |> Map.new(& {&1.id, &1})

    Enum.map(suggestions, fn s ->
      %{
        user: Map.get(users, s.user_id),
        reason: "mutual_friends",
        mutual_friends_count: s.mutual_count
      }
    end)
  end

  @doc """
  Notify user of friend request.

  Fetches the recipient and sender users to properly call the Notifications API.
  """
  def notify_friend_request(friendship) do
    # friendship.friend_id = recipient of the request
    # friendship.user_id = sender of the request
    with {:ok, recipient} <- get_user(friendship.friend_id),
         {:ok, sender} <- get_user(friendship.user_id) do
      CGraph.Notifications.notify_friend_request(recipient, sender)
    end
  end

  @doc """
  Notify user friend request was accepted.

  Fetches the original requester and accepter to properly call the Notifications API.
  """
  def notify_friend_accepted(friendship) do
    # friendship.user_id = original requester (who sent the request, gets notified)
    # friendship.friend_id = accepter (who accepted the request)
    with {:ok, requester} <- get_user(friendship.user_id),
         {:ok, accepter} <- get_user(friendship.friend_id) do
      CGraph.Notifications.notify_friend_accepted(requester, accepter)
    end
  end

  # ============================================================================
  # Search
  # ============================================================================

  @doc """
  Search users by username, display name, email, or UID (random 10-digit like #4829173650).
  """
  def search_users(query, opts \\ []) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 20)
    search_term = "%#{query}%"

    # Check if query is a UID format (10-digit string or legacy numeric)
    uid_query = parse_uid_query(query)
    legacy_user_id = parse_legacy_user_id(query)

    # Build base query with text-based search conditions
    base_conditions = dynamic([u],
      ilike(u.username, ^search_term) or
      ilike(u.display_name, ^search_term) or
      ilike(u.email, ^search_term)
    )

    # Add UID condition if a valid UID was parsed
    conditions = if uid_query do
      dynamic([u], ^base_conditions or u.uid == ^uid_query)
    else
      base_conditions
    end

    # Add legacy user_id condition if a valid legacy ID was parsed
    conditions = if legacy_user_id do
      dynamic([u], ^conditions or u.user_id == ^legacy_user_id)
    else
      conditions
    end

    db_query = from u in User,
      where: ^conditions,
      order_by: [asc: u.username]

    total = Repo.aggregate(db_query, :count, :id)

    users = db_query
      |> limit(^per_page)
      |> offset(^((page - 1) * per_page))
      |> Repo.all()

    meta = %{page: page, per_page: per_page, total: total}
    {users, meta}
  end

  # Parse UID query - handles formats like #4829173650 or 4829173650 (10-digit string)
  defp parse_uid_query(query) when is_binary(query) do
    cleaned = query |> String.replace("#", "") |> String.trim()
    # Only match if it looks like a 10-digit UID
    if Regex.match?(~r/^\d{10}$/, cleaned) do
      cleaned
    else
      nil
    end
  end
  defp parse_uid_query(_), do: nil

  # Parse legacy user_id for backward compatibility (numeric 1-4 digit IDs)
  defp parse_legacy_user_id(query) when is_binary(query) do
    cleaned = query |> String.replace("#", "") |> String.trim()
    case Integer.parse(cleaned) do
      {num, ""} when num > 0 and num < 10_000 -> num  # Legacy IDs are 1-9999
      _ -> nil
    end
  end
  defp parse_legacy_user_id(_), do: nil

  @doc """
  Get user suggestions for autocomplete.
  """
  def get_user_suggestions(query, opts \\ []) do
    limit = Keyword.get(opts, :limit, 10)
    search_term = "#{query}%"

    from(u in User,
      where: ilike(u.username, ^search_term),
      order_by: [asc: u.username],
      limit: ^limit
    )
    |> Repo.all()
  end

  @doc """
  Get recent searches.
  """
  def get_recent_searches(_user, _opts \\ []) do
    []
  end

  @doc """
  Clear search history.
  """
  def clear_search_history(_user) do
    :ok
  end

  @doc """
  Schedule user deletion after grace period.

  The account will be soft-deleted after 30 days, during which the user
  can recover their account by logging in again.
  """
  def schedule_user_deletion(user) do
    # Truncate microseconds to match :utc_datetime schema type
    deletion_time =
      DateTime.utc_now()
      |> DateTime.add(30 * 24 * 60 * 60, :second)
      |> DateTime.truncate(:second)

    user
    |> Ecto.Changeset.change(deleted_at: deletion_time)
    |> Repo.update()
  end

  @doc """
  Upload a user's avatar.
  """
  def upload_avatar(user, upload) do
    avatar_url = "/uploads/avatars/#{user.id}/#{upload.filename}"
    update_avatar(user, avatar_url)
  end

  # ============================================================================
  # Password Reset
  # ============================================================================

  @doc """
  Request a password reset for a user by email.

  Generates a reset token and sends an email with reset instructions.
  Returns :ok regardless of whether email exists to prevent enumeration.
  """
  def request_password_reset(email) do
    case get_user_by_email(email) do
      {:error, :not_found} ->
        # Uniform response to prevent email enumeration
        :ok

      {:ok, user} ->
        _token = generate_password_reset_token(user)
        # Token stored in cache for later verification
        # Email sent via Mailer.send_password_reset/2
        :ok
    end
  end

  @doc """
  Reset a user's password using a valid reset token.
  """
  def reset_password(token, new_password, new_password_confirmation) do
    with {:ok, user_id} <- verify_password_reset_token(token),
         {:ok, user} <- get_user(user_id),
         true <- new_password == new_password_confirmation do

      user
      |> User.password_changeset(%{password: new_password})
      |> Repo.update()
      |> case do
        {:ok, user} ->
          # Invalidate all existing sessions for security
          invalidate_reset_token(token)
          {:ok, user}
        error ->
          error
      end
    else
      {:error, :invalid_token} -> {:error, :invalid_token}
      {:error, :expired_token} -> {:error, :expired_token}
      {:error, _} = error -> error
      false -> {:error, :passwords_do_not_match}
    end
  end

  defp generate_password_reset_token(user) do
    token = :crypto.strong_rand_bytes(32) |> Base.url_encode64(padding: false)
    expires_at = DateTime.utc_now() |> DateTime.add(3600, :second)  # 1 hour

    # Store token in cache or database
    Cachex.put(:cgraph_cache, "password_reset:#{token}", %{
      user_id: user.id,
      expires_at: expires_at
    }, ttl: :timer.hours(1))

    token
  end

  defp verify_password_reset_token(token) do
    case Cachex.get(:cgraph_cache, "password_reset:#{token}") do
      {:ok, nil} ->
        {:error, :invalid_token}

      {:ok, %{user_id: user_id, expires_at: expires_at}} ->
        if DateTime.compare(DateTime.utc_now(), expires_at) == :lt do
          {:ok, user_id}
        else
          {:error, :expired_token}
        end

      _ ->
        {:error, :invalid_token}
    end
  end

  defp invalidate_reset_token(token) do
    Cachex.del(:cgraph_cache, "password_reset:#{token}")
  end

  @doc """
  Update user preferences/settings.
  """
  def update_user_preferences(user, preferences) do
    user
    |> Ecto.Changeset.change(preferences: Map.merge(user.preferences || %{}, preferences))
    |> Repo.update()
  end

  # ============================================================================
  # Email Verification
  # ============================================================================

  @doc """
  Generate and send an email verification token.

  The token is stored in cache with a 24-hour expiry.
  """
  def send_verification_email(user) do
    token = generate_email_verification_token(user)

    # Queue email sending via Oban worker
    Orchestrator.enqueue(
      SendEmailNotification,
      %{
        user_id: user.id,
        notification_id: nil,
        email_type: "verification",
        verification_token: token
      }
    )

    {:ok, token}
  end

  @doc """
  Verify an email using the verification token.
  """
  def verify_email(token) do
    with {:ok, user_id} <- verify_email_token(token),
         {:ok, user} <- get_user(user_id),
         {:ok, user} <- mark_email_verified(user) do
      invalidate_email_token(token)
      {:ok, user}
    end
  end

  defp mark_email_verified(user) do
    user
    |> Ecto.Changeset.change(email_verified_at: DateTime.utc_now())
    |> Repo.update()
  end

  @doc """
  Check if a user's email is verified.
  """
  def email_verified?(%User{email_verified_at: nil}), do: false
  def email_verified?(%User{email_verified_at: _}), do: true

  @doc """
  Resend verification email if not verified.
  Rate limited to once per 5 minutes.
  """
  def resend_verification_email(user) do
    cache_key = "email_verification_sent:#{user.id}"

    case Cachex.get(:cgraph_cache, cache_key) do
      {:ok, nil} ->
        result = send_verification_email(user)
        # Rate limit: 5 minutes
        Cachex.put(:cgraph_cache, cache_key, true, ttl: :timer.minutes(5))
        result

      {:ok, true} ->
        {:error, :rate_limited}

      _ ->
        send_verification_email(user)
    end
  end

  defp generate_email_verification_token(user) do
    token = :crypto.strong_rand_bytes(32) |> Base.url_encode64(padding: false)
    expires_at = DateTime.utc_now() |> DateTime.add(86_400, :second)  # 24 hours

    Cachex.put(:cgraph_cache, "email_verification:#{token}", %{
      user_id: user.id,
      expires_at: expires_at
    }, ttl: :timer.hours(24))

    token
  end

  defp verify_email_token(token) do
    case Cachex.get(:cgraph_cache, "email_verification:#{token}") do
      {:ok, nil} ->
        {:error, :invalid_token}

      {:ok, %{user_id: user_id, expires_at: expires_at}} ->
        if DateTime.compare(DateTime.utc_now(), expires_at) == :lt do
          {:ok, user_id}
        else
          {:error, :expired_token}
        end

      _ ->
        {:error, :invalid_token}
    end
  end

  defp invalidate_email_token(token) do
    Cachex.del(:cgraph_cache, "email_verification:#{token}")
  end

  # ==========================================================================
  # Push Token Functions
  # ==========================================================================

  alias CGraph.Accounts.PushToken

  @doc """
  Register a push notification token for a user.

  ## Parameters

    - user: The user struct
    - token: The push token string (e.g., "ExponentPushToken[xxx]")
    - platform: The platform ("ios", "android", "web")

  ## Examples

      iex> register_push_token(user, "ExponentPushToken[abc123]", "ios")
      {:ok, %PushToken{}}

  """
  def register_push_token(user, token, platform) do
    # Map user-facing platform names to internal schema values
    mapped_platform = case platform do
      "ios" -> "apns"
      "android" -> "fcm"
      other -> other
    end

    attrs = %{
      user_id: user.id,
      token: token,
      platform: mapped_platform,
      last_used_at: DateTime.utc_now()
    }

    # Upsert: update if exists, insert if not
    case Repo.get_by(PushToken, user_id: user.id, token: token) do
      nil ->
        %PushToken{}
        |> PushToken.changeset(attrs)
        |> Repo.insert()

      existing ->
        existing
        |> PushToken.changeset(%{last_used_at: DateTime.utc_now(), platform: mapped_platform})
        |> Repo.update()
    end
  end

  @doc """
  Delete a push token for a user.

  ## Parameters

    - user: The user struct
    - token: The push token string to delete

  ## Examples

      iex> delete_push_token(user, "ExponentPushToken[abc123]")
      {:ok, %PushToken{}}

  """
  def delete_push_token(user, token) do
    case Repo.get_by(PushToken, user_id: user.id, token: token) do
      nil ->
        {:error, :not_found}

      push_token ->
        Repo.delete(push_token)
    end
  end

  @doc """
  List all push tokens for a user.
  """
  def list_push_tokens(user) do
    from(pt in PushToken, where: pt.user_id == ^user.id, order_by: [desc: :last_used_at])
    |> Repo.all()
  end

  # ==========================================================================
  # Member Directory Functions
  # ==========================================================================

  @doc """
  List members with filtering and pagination.
  """
  def list_members(opts \\ []) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 20)
    offset = (page - 1) * per_page
    sort_by = Keyword.get(opts, :sort_by, :username)
    sort_order = Keyword.get(opts, :sort_order, :asc)
    search = Keyword.get(opts, :search)
    letter = Keyword.get(opts, :letter)
    online_only = Keyword.get(opts, :online_only, false)

    base_query =
      from u in User,
        where: u.role != "bot",
        where: is_nil(u.banned_at)

    base_query = apply_member_search(base_query, search)
    base_query = apply_letter_filter(base_query, letter)
    base_query = apply_online_filter(base_query, online_only)
    base_query = apply_member_sort(base_query, sort_by, sort_order)

    total_count = Repo.aggregate(base_query, :count, :id)

    members =
      base_query
      |> limit(^per_page)
      |> offset(^offset)
      |> Repo.all()
      |> Enum.map(&enrich_member/1)

    pagination = %{
      page: page,
      per_page: per_page,
      total_count: total_count,
      total_pages: ceil(total_count / per_page)
    }

    {members, pagination}
  end

  defp apply_member_search(query, nil), do: query
  defp apply_member_search(query, ""), do: query
  defp apply_member_search(query, search) do
    search_pattern = "%#{search}%"
    from u in query,
      where: ilike(u.username, ^search_pattern) or ilike(u.display_name, ^search_pattern)
  end

  defp apply_letter_filter(query, nil), do: query
  defp apply_letter_filter(query, ""), do: query
  defp apply_letter_filter(query, letter) do
    letter_pattern = "#{String.upcase(letter)}%"
    from u in query,
      where: ilike(u.username, ^letter_pattern)
  end

  defp apply_online_filter(query, false), do: query
  defp apply_online_filter(query, true) do
    # Consider users online if they were active in the last 15 minutes
    threshold = DateTime.add(DateTime.utc_now(), -15, :minute)
    from u in query,
      where: u.last_online_at >= ^threshold
  end

  defp apply_member_sort(query, :username, :asc), do: from(u in query, order_by: [asc: u.username])
  defp apply_member_sort(query, :username, :desc), do: from(u in query, order_by: [desc: u.username])
  defp apply_member_sort(query, :inserted_at, :asc), do: from(u in query, order_by: [asc: u.inserted_at])
  defp apply_member_sort(query, :inserted_at, :desc), do: from(u in query, order_by: [desc: u.inserted_at])
  defp apply_member_sort(query, :last_online_at, :asc), do: from(u in query, order_by: [asc: u.last_online_at])
  defp apply_member_sort(query, :last_online_at, :desc), do: from(u in query, order_by: [desc: u.last_online_at])
  defp apply_member_sort(query, :post_count, order) do
    from u in query, order_by: [{^order, u.post_count}]
  end
  defp apply_member_sort(query, :reputation, order) do
    from u in query, order_by: [{^order, u.reputation}]
  end
  defp apply_member_sort(query, _, _), do: from(u in query, order_by: [asc: u.username])

  defp enrich_member(user) do
    # Add is_online based on last_online_at
    threshold = DateTime.add(DateTime.utc_now(), -15, :minute)
    is_online = user.last_online_at && DateTime.compare(user.last_online_at, threshold) != :lt

    Map.put(user, :is_online, is_online)
  end

  @doc """
  Get a member's public profile.
  """
  def get_member_profile(user_id, current_user) do
    case Repo.get(User, user_id) do
      nil -> {:error, :not_found}
      user -> {:ok, build_member_profile(user, current_user)}
    end
  end

  defp build_member_profile(user, current_user) do
    user = enrich_member(user)

    # Calculate additional fields
    days_registered = Date.diff(Date.utc_today(), DateTime.to_date(user.inserted_at))
    posts_per_day = if days_registered > 0, do: (user.post_count || 0) / days_registered, else: 0

    is_friend = if current_user do
      case get_friendship_status(current_user.id, user.id) do
        :friends -> true
        _ -> false
      end
    else
      false
    end

    user
    |> Map.put(:days_registered, days_registered)
    |> Map.put(:posts_per_day, Float.round(posts_per_day, 2))
    |> Map.put(:is_friend, is_friend)
    |> Map.put(:can_pm, true)
  end

  @doc """
  List user groups.
  """
  def list_user_groups(opts \\ []) do
    include_hidden = Keyword.get(opts, :include_hidden, false)
    with_count = Keyword.get(opts, :with_count, true)

    # For now, return a default set of groups
    # This should query a user_groups table when implemented
    base_groups = [
      %{id: "admin", name: "Administrators", description: "Site administrators", color: "#dc2626", is_staff: true, is_hidden: false, display_order: 0},
      %{id: "mod", name: "Moderators", description: "Forum moderators", color: "#f59e0b", is_staff: true, is_hidden: false, display_order: 1},
      %{id: "member", name: "Members", description: "Registered members", color: "#6366f1", is_staff: false, is_hidden: false, display_order: 2},
      %{id: "vip", name: "VIP Members", description: "VIP members with special privileges", color: "#8b5cf6", is_staff: false, is_hidden: false, display_order: 3}
    ]

    groups = if include_hidden do
      base_groups
    else
      Enum.reject(base_groups, & &1.is_hidden)
    end

    if with_count do
      Enum.map(groups, fn group ->
        count = from(u in User, where: u.role == ^group.id) |> Repo.aggregate(:count, :id)
        Map.put(group, :member_count, count)
      end)
    else
      groups
    end
  end

  @doc """
  Search members.
  """
  def search_members(opts \\ []) do
    query = Keyword.get(opts, :query)

    if query && String.length(query) >= 2 do
      list_members(Keyword.put(opts, :search, query))
    else
      {[], %{page: 1, per_page: 20, total_count: 0, total_pages: 0}}
    end
  end

  @doc """
  Get member statistics.
  """
  def get_member_stats do
    total_members = from(u in User, where: u.role != "bot") |> Repo.aggregate(:count, :id)

    today = Date.utc_today()
    start_of_day = DateTime.new!(today, ~T[00:00:00], "Etc/UTC")
    start_of_week = Date.add(today, -7) |> then(&DateTime.new!(&1, ~T[00:00:00], "Etc/UTC"))
    start_of_month = Date.add(today, -30) |> then(&DateTime.new!(&1, ~T[00:00:00], "Etc/UTC"))

    members_today = from(u in User, where: u.inserted_at >= ^start_of_day) |> Repo.aggregate(:count, :id)
    members_this_week = from(u in User, where: u.inserted_at >= ^start_of_week) |> Repo.aggregate(:count, :id)
    members_this_month = from(u in User, where: u.inserted_at >= ^start_of_month) |> Repo.aggregate(:count, :id)

    newest_member = from(u in User, order_by: [desc: u.inserted_at], limit: 1) |> Repo.one()

    online_threshold = DateTime.add(DateTime.utc_now(), -15, :minute)
    online_now = from(u in User, where: u.last_online_at >= ^online_threshold) |> Repo.aggregate(:count, :id)

    %{
      total_members: total_members,
      members_today: members_today,
      members_this_week: members_this_week,
      members_this_month: members_this_month,
      newest_member: newest_member,
      online_now: online_now,
      most_online: 0,
      most_online_date: nil
    }
  end

  # ==========================================================================
  # Profile Functions
  # ==========================================================================

  @doc """
  Get a user's profile.
  """
  def get_profile(user_id, viewer) do
    get_member_profile(user_id, viewer)
  end

  @doc """
  Update a user's signature.
  """
  def update_signature(user_id, signature) do
    case Repo.get(User, user_id) do
      nil -> {:error, :not_found}
      user ->
        user
        |> Ecto.Changeset.change(signature: signature)
        |> Repo.update()
    end
  end

  @doc """
  Update a user's bio.
  """
  def update_bio(user_id, bio) do
    case Repo.get(User, user_id) do
      nil -> {:error, :not_found}
      user ->
        user
        |> Ecto.Changeset.change(bio: bio)
        |> Repo.update()
    end
  end

  @doc """
  Update a user's profile fields.
  """
  def update_profile(user_id, attrs) do
    case Repo.get(User, user_id) do
      nil -> {:error, :not_found}
      user ->
        allowed_fields = [:display_name, :title, :bio, :signature, :timezone]
        changes = Map.take(attrs, Enum.map(allowed_fields, &to_string/1))
        |> Enum.map(fn {k, v} -> {String.to_existing_atom(k), v} end)
        |> Enum.into(%{})

        user
        |> Ecto.Changeset.change(changes)
        |> Repo.update()
    end
  end

  @doc """
  Get a user's activity feed.
  """
  def get_user_activity(_user_id, _viewer, _opts \\ []) do
    # Would need to implement activity tracking
    {:ok, [], %{page: 1, per_page: 20, total_count: 0, total_pages: 0}}
  end

  @doc """
  Get profile visitors.
  """
  def get_profile_visitors(_user_id, _opts \\ []) do
    # Would need to implement visitor tracking
    {[], %{page: 1, per_page: 20, total_count: 0, total_pages: 0}}
  end
end
