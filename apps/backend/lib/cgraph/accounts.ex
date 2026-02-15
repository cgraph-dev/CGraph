defmodule CGraph.Accounts do
  @moduledoc """
  The Accounts context.

  Handles user management, authentication, sessions, friendships, and settings.
  """

  import Ecto.Query, warn: false

  alias CGraph.Accounts.{Friendship, Session, User}
  alias CGraph.Repo
  alias CGraph.Security.PasswordBreachCheck

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
  defdelegate register_user_v2(attrs), to: RegModule, as: :register

  # Sessions submodule delegations
  alias CGraph.Accounts.Sessions, as: SessionsModule
  defdelegate list_user_sessions_v2(user), to: SessionsModule, as: :list_sessions
  defdelegate revoke_all_sessions_v2(user), to: SessionsModule, as: :revoke_all_sessions

  # Friends submodule delegations
  alias CGraph.Accounts.Friends, as: FriendsModule
  defdelegate send_friend_request_v2(from_user_id, to_user_id, message \\ nil), to: FriendsModule, as: :send_friend_request
  defdelegate accept_friend_request_v2(user_id, friend_id), to: FriendsModule, as: :accept_friend_request
  defdelegate decline_friend_request_v2(user_id, friend_id), to: FriendsModule, as: :decline_friend_request
  defdelegate remove_friend_v2(user_id, friend_id), to: FriendsModule, as: :remove_friend
  defdelegate block_user_v2(blocker_id, blocked_id), to: FriendsModule, as: :block_user
  defdelegate unblock_user_v2(blocker_id, blocked_id), to: FriendsModule, as: :unblock_user
  defdelegate list_friends_v2(user_id, opts \\ []), to: FriendsModule, as: :list_friends
  defdelegate list_pending_requests_v2(user_id), to: FriendsModule, as: :list_incoming_requests
  defdelegate are_friends_v2?(user_id, friend_id), to: FriendsModule, as: :are_friends?

  # Settings submodule delegations
  alias CGraph.Accounts.Settings, as: SettingsModule
  defdelegate get_user_settings_v2(user_id), to: SettingsModule, as: :get_user_settings
  defdelegate update_user_settings_v2(user_id, attrs), to: SettingsModule, as: :update_settings

  # Wallet auth submodule delegations — stubs until wallet features are implemented
  @doc false
  def get_or_create_wallet_challenge_v2(_address), do: {:error, :not_implemented}
  @doc false
  def verify_wallet_signature_v2(_address, _signature), do: {:error, :not_implemented}

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
  # Stub Functions (planned features, not yet implemented)
  # ============================================================================

  @doc "Dismiss a friend suggestion. Planned feature."
  def dismiss_friend_suggestion(_user_id, _suggested_user_id), do: {:ok, :dismissed}

  @doc "Look up a user by Stripe customer ID. Requires Stripe integration."
  def get_user_by_stripe_customer(stripe_customer_id) do
    Repo.get_by(User, stripe_customer_id: stripe_customer_id)
    |> case do
      nil -> {:error, :not_found}
      user -> {:ok, user}
    end
  end

  @doc "Look up a user by Stripe subscription ID. Requires Stripe integration."
  def get_user_by_stripe_subscription(stripe_subscription_id) do
    Repo.get_by(User, stripe_subscription_id: stripe_subscription_id)
    |> case do
      nil -> {:error, :not_found}
      user -> {:ok, user}
    end
  end

  @doc "Verify a user's password. Returns true/false."
  def verify_password(%User{} = user, password) when is_binary(password) do
    User.valid_password?(user, password)
  end

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
  # Wallet Authentication (delegated to WalletAuthentication)
  # ============================================================================

  alias CGraph.Accounts.WalletAuthentication

  defdelegate get_or_create_wallet_challenge(wallet_address), to: WalletAuthentication
  defdelegate verify_wallet_signature(wallet_address, signature), to: WalletAuthentication

  # ============================================================================
  # User Management (delegated to UserManagement)
  # ============================================================================

  alias CGraph.Accounts.UserManagement

  defdelegate get_user(id), to: UserManagement
  defdelegate get_user!(id), to: UserManagement
  defdelegate deactivate_user(user), to: UserManagement
  defdelegate get_user_by_username(username), to: UserManagement
  defdelegate get_user_profile(user_id), to: UserManagement
  defdelegate list_users(opts \\ []), to: UserManagement
  defdelegate list_admin_users(), to: UserManagement
  defdelegate list_top_users_by_karma(opts \\ []), to: UserManagement
  defdelegate update_user(user, attrs), to: UserManagement
  defdelegate flag_profile_for_review(user_id), to: UserManagement
  defdelegate remove_profile_content(user_id, content_type, opts \\ []), to: UserManagement
  defdelegate change_username(user, new_username), to: UserManagement
  defdelegate can_change_username?(user), to: UserManagement
  defdelegate next_username_change_date(user), to: UserManagement
  defdelegate delete_user(user), to: UserManagement
  defdelegate update_avatar(user, avatar_url), to: UserManagement

  # ============================================================================
  # Sessions (delegated to SessionManagement)
  # ============================================================================

  alias CGraph.Accounts.SessionManagement

  defdelegate generate_session_token(user), to: SessionManagement
  defdelegate get_user_by_session_token(token), to: SessionManagement
  defdelegate delete_session_token(token), to: SessionManagement
  defdelegate list_sessions(user), to: SessionManagement
  defdelegate list_user_sessions(user), to: SessionManagement
  def revoke_session(%Session{} = session), do: SessionManagement.revoke_session(session)
  def revoke_session(user, session_id), do: SessionManagement.revoke_session(user, session_id)

  # ============================================================================
  # Settings (delegated to UserManagement)
  # ============================================================================

  defdelegate get_settings(user), to: UserManagement
  defdelegate update_settings(user, attrs), to: UserManagement

  # ============================================================================
  # Friendships
  # ============================================================================

  @doc """
  List user's friends.
  """
  # ============================================================================
  # Friends & Blocking (delegated to FriendSystem)
  # ============================================================================

  alias CGraph.Accounts.FriendSystem

  defdelegate list_friends(user, opts \\ []), to: FriendSystem
  defdelegate list_friend_requests(user, opts \\ []), to: FriendSystem
  defdelegate list_sent_friend_requests(user, opts \\ []), to: FriendSystem
  defdelegate send_friend_request(from_user, to_user), to: FriendSystem
  def accept_friend_request(friendship_or_addressee, requester \\ nil)
  def accept_friend_request(%Friendship{} = f, nil), do: FriendSystem.accept_friend_request(f)
  def accept_friend_request(addressee, requester), do: FriendSystem.accept_friend_request(addressee, requester)
  def decline_friend_request(%Friendship{} = f), do: FriendSystem.decline_friend_request(f)
  def decline_friend_request(addressee, requester), do: FriendSystem.decline_friend_request(addressee, requester)
  defdelegate get_friend_request(user, friendship_id), to: FriendSystem
  defdelegate get_friendship(user, friendship_id), to: FriendSystem
  defdelegate remove_friendship(user, friendship), to: FriendSystem
  defdelegate unfriend(user, target_user), to: FriendSystem
  defdelegate get_friendship_status(user, target_user), to: FriendSystem
  defdelegate blocked?(blocker, blocked), to: FriendSystem
  defdelegate block_user(user, target_user), to: FriendSystem
  defdelegate unblock_user(user, target_user), to: FriendSystem
  defdelegate list_blocked_users(user, opts \\ []), to: FriendSystem
  defdelegate get_mutual_friends(user, target_user), to: FriendSystem
  defdelegate get_online_friends(user), to: FriendSystem
  defdelegate get_friend_suggestions(user, opts \\ []), to: FriendSystem
  defdelegate notify_friend_request(friendship), to: FriendSystem
  defdelegate notify_friend_accepted(friendship), to: FriendSystem

  # ============================================================================
  # Search (delegated to CGraph.Accounts.Search)
  # ============================================================================

  defdelegate search_users(query, opts \\ []), to: CGraph.Accounts.Search
  defdelegate get_user_suggestions(query, opts \\ []), to: CGraph.Accounts.Search
  defdelegate get_recent_searches(user, opts \\ []), to: CGraph.Accounts.Search
  defdelegate clear_search_history(user), to: CGraph.Accounts.Search

  defdelegate schedule_user_deletion(user), to: UserManagement
  defdelegate upload_avatar(user, upload), to: UserManagement

  # ============================================================================
  # Password Reset (delegated to CGraph.Accounts.PasswordReset)
  # ============================================================================

  defdelegate request_password_reset(email), to: CGraph.Accounts.PasswordReset
  defdelegate reset_password(token, new_password, new_password_confirmation), to: CGraph.Accounts.PasswordReset

  defdelegate update_user_preferences(user, preferences), to: UserManagement

  # ============================================================================
  # Email Verification (delegated to CGraph.Accounts.EmailVerification)
  # ============================================================================

  defdelegate send_verification_email(user), to: CGraph.Accounts.EmailVerification
  defdelegate verify_email(token), to: CGraph.Accounts.EmailVerification
  defdelegate email_verified?(user), to: CGraph.Accounts.EmailVerification
  defdelegate resend_verification_email(user), to: CGraph.Accounts.EmailVerification

  # ==========================================================================
  # Push Token Functions (delegated to PushTokens)
  # ==========================================================================

  alias CGraph.Accounts.PushTokens

  defdelegate register_push_token(user, token, platform), to: PushTokens
  defdelegate delete_push_token(user, token), to: PushTokens
  defdelegate list_push_tokens(user), to: PushTokens

  # ==========================================================================
  # Member Directory Functions (delegated to CGraph.Accounts.MemberDirectory)
  # ==========================================================================

  defdelegate list_members(opts \\ []), to: CGraph.Accounts.MemberDirectory
  defdelegate get_member_profile(user_id, current_user), to: CGraph.Accounts.MemberDirectory
  defdelegate list_user_groups(opts \\ []), to: CGraph.Accounts.MemberDirectory
  defdelegate search_members(opts \\ []), to: CGraph.Accounts.MemberDirectory
  defdelegate get_member_stats(), to: CGraph.Accounts.MemberDirectory

  # ==========================================================================
  # Profile Functions (delegated to CGraph.Accounts.Profile)
  # ==========================================================================

  defdelegate get_profile(user_id, viewer), to: CGraph.Accounts.Profile
  defdelegate update_signature(user_id, signature), to: CGraph.Accounts.Profile
  defdelegate update_bio(user_id, bio), to: CGraph.Accounts.Profile
  defdelegate update_profile(user_id, attrs), to: CGraph.Accounts.Profile
  defdelegate get_user_activity(user_id, viewer, opts \\ []), to: CGraph.Accounts.Profile
  defdelegate get_profile_visitors(user_id, opts \\ []), to: CGraph.Accounts.Profile

end
