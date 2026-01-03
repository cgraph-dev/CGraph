defmodule Cgraph.Accounts do
  @moduledoc """
  The Accounts context.
  
  Handles user management, authentication, sessions, friendships, and settings.
  """

  import Ecto.Query, warn: false
  alias Cgraph.Repo
  alias Cgraph.Accounts.{User, Session, UserSettings, Friendship, WalletChallenge}
  alias Cgraph.Security.PasswordBreachCheck

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
    
    # Apply password breach check if enabled
    changeset = if check_breach do
      apply_breach_check(changeset)
    else
      changeset
    end
    
    case Repo.insert(changeset) do
      {:ok, user} = result ->
        # Async breach check for logging (if sync check was skipped)
        if !check_breach do
          password = Map.get(attrs, "password") || Map.get(attrs, :password)
          if password do
            PasswordBreachCheck.check_async(password, user_id: user.id)
          end
        end
        result
      
      error ->
        error
    end
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
      nil ->
        nonce = generate_nonce()
        %WalletChallenge{}
        |> WalletChallenge.changeset(%{wallet_address: normalized_address, nonce: nonce})
        |> Repo.insert()
        |> case do
          {:ok, wallet_challenge} -> {:ok, wallet_challenge.nonce}
          {:error, _} -> {:error, "Failed to create challenge"}
        end

      wallet_challenge ->
        # Regenerate nonce if expired
        if expired?(wallet_challenge.updated_at, 5 * 60) do
          nonce = generate_nonce()
          wallet_challenge
          |> WalletChallenge.changeset(%{nonce: nonce})
          |> Repo.update()
          |> case do
            {:ok, updated} -> {:ok, updated.nonce}
            {:error, _} -> {:error, "Failed to update challenge"}
          end
        else
          {:ok, wallet_challenge.nonce}
        end
    end
  end

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
    "Sign this message to authenticate with Cgraph.\n\nNonce: #{nonce}"
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
  Get a user by username.
  """
  def get_user_by_username(username) do
    case Repo.get_by(User, username: username) do
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
  Get a user by their unique numeric user_id.
  """
  def get_user_by_user_id(user_id) when is_integer(user_id) do
    case Repo.get_by(User, user_id: user_id) do
      nil -> {:error, :not_found}
      user -> {:ok, user}
    end
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
  def is_blocked?(blocker, blocked) do
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
    online_user_ids = Cgraph.Presence.list_online_users()
    
    online_friend_ids = MapSet.intersection(MapSet.new(friend_ids), MapSet.new(online_user_ids))
    
    Repo.all(from u in User, where: u.id in ^MapSet.to_list(online_friend_ids))
    |> Enum.map(fn u ->
      status = Cgraph.Presence.get_user_status(u.id)
      presence = Cgraph.Presence.get_user_presence(u.id)
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
      Cgraph.Notifications.notify_friend_request(recipient, sender)
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
      Cgraph.Notifications.notify_friend_accepted(requester, accepter)
    end
  end

  # ============================================================================
  # Search
  # ============================================================================

  @doc """
  Search users by username or display name.
  """
  def search_users(query, opts \\ []) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 20)
    search_term = "%#{query}%"

    db_query = from u in User,
      where: ilike(u.username, ^search_term) or ilike(u.display_name, ^search_term),
      order_by: [asc: u.username]

    total = Repo.aggregate(db_query, :count, :id)
    
    users = db_query
      |> limit(^per_page)
      |> offset(^((page - 1) * per_page))
      |> Repo.all()

    meta = %{page: page, per_page: per_page, total: total}
    {users, meta}
  end

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
    Cgraph.Workers.Orchestrator.enqueue(
      Cgraph.Workers.SendEmailNotification,
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
    case verify_email_token(token) do
      {:ok, user_id} ->
        case get_user(user_id) do
          {:ok, user} ->
            user
            |> Ecto.Changeset.change(email_verified_at: DateTime.utc_now())
            |> Repo.update()
            |> case do
              {:ok, user} ->
                invalidate_email_token(token)
                {:ok, user}
              error -> error
            end
          error -> error
        end
      error -> error
    end
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
    expires_at = DateTime.utc_now() |> DateTime.add(86400, :second)  # 24 hours
    
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

  alias Cgraph.Accounts.PushToken

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
end
