defmodule CGraph.Accounts do
  @moduledoc """
  The Accounts context.

  Handles user management, authentication, sessions, friendships, and settings.
  """

  alias CGraph.Accounts.{Friendship, Session}

  # ============================================================================
  # Lookup (delegated to CGraph.Accounts.Lookup)
  # ============================================================================

  alias CGraph.Accounts.Lookup

  defdelegate get_user_by_email(email), to: Lookup
  defdelegate get_user_by_oauth(provider, uid), to: Lookup
  defdelegate get_user_by_user_id(uid_or_user_id), to: Lookup
  defdelegate get_user_by_stripe_customer(stripe_customer_id), to: Lookup
  defdelegate get_user_by_stripe_subscription(stripe_subscription_id), to: Lookup
  defdelegate verify_password(user, password), to: Lookup
  defdelegate dismiss_friend_suggestion(user_id, suggested_user_id), to: Lookup
  defdelegate get_dismissed_suggestion_ids(user_id), to: Lookup

  # ============================================================================
  # Registration & Authentication (delegated to CGraph.Accounts.Credentials)
  # ============================================================================

  alias CGraph.Accounts.Credentials

  @doc "Register a new user with email/password credentials."
  def register_user(attrs, opts \\ []), do: Credentials.register_user(attrs, opts)

  defdelegate create_user(attrs), to: Credentials
  defdelegate authenticate_user(email, password), to: Credentials
  defdelegate authenticate_by_identifier(identifier, password), to: Credentials
  defdelegate create_session(user, conn_or_attrs), to: Credentials

  # ============================================================================
  # Sync Queries (delegated to CGraph.Accounts.Sync)
  # ============================================================================

  alias CGraph.Accounts.Sync

  defdelegate list_contacts_since(user, since), to: Sync
  defdelegate list_friendships_since(user, since), to: Sync
  defdelegate list_removed_friendship_ids_since(user, since), to: Sync

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
  @spec revoke_session(struct(), binary()) :: {:ok, struct()} | {:error, term()}
  def revoke_session(user, session_id), do: SessionManagement.revoke_session(user, session_id)

  # ============================================================================
  # Settings (delegated to UserManagement)
  # ============================================================================

  defdelegate get_settings(user), to: UserManagement
  defdelegate update_settings(user, attrs), to: UserManagement

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
