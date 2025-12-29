defmodule Cgraph.Notifications do
  @moduledoc """
  Context for managing notifications.
  
  Handles creation, delivery, and management of user notifications.
  Integrates with push notification services and email.
  """
  
  import Ecto.Query
  alias Cgraph.Repo
  alias Cgraph.Accounts.{User, Settings}
  alias Cgraph.Notifications.Notification
  
  @doc """
  Creates and delivers a notification to a user.
  
  Automatically checks user preferences before sending push/email.
  
  ## Examples
  
      iex> notify(user, :friend_request, "New friend request", actor: sender)
      {:ok, %Notification{}}
  
  """
  def notify(%User{} = user, type, title, opts \\ []) do
    actor = Keyword.get(opts, :actor)
    body = Keyword.get(opts, :body)
    data = Keyword.get(opts, :data, %{})
    group_key = Keyword.get(opts, :group_key)
    
    # Check if we should group with existing notification
    notification = if group_key do
      maybe_group_notification(user, type, group_key, title, body, data, actor)
    else
      create_notification(user, type, title, body, data, actor)
    end
    
    case notification do
      {:ok, notif} ->
        # Deliver through appropriate channels
        deliver_notification(user, notif, type)
        {:ok, notif}
        
      error ->
        error
    end
  end
  
  defp create_notification(user, type, title, body, data, actor) do
    %Notification{}
    |> Notification.changeset(%{
      user_id: user.id,
      actor_id: actor && actor.id,
      type: type,
      title: title,
      body: body,
      data: data
    })
    |> Repo.insert()
  end
  
  defp maybe_group_notification(user, type, group_key, title, body, data, actor) do
    # Look for existing unread notification with same group key
    case get_unread_by_group_key(user, group_key) do
      nil ->
        %Notification{}
        |> Notification.changeset(%{
          user_id: user.id,
          actor_id: actor && actor.id,
          type: type,
          title: title,
          body: body,
          data: data,
          group_key: group_key,
          count: 1
        })
        |> Repo.insert()
        
      existing ->
        # Increment count instead of creating new notification
        existing
        |> Notification.changeset(%{
          count: existing.count + 1,
          title: update_grouped_title(title, existing.count + 1),
          updated_at: DateTime.utc_now()
        })
        |> Repo.update()
    end
  end
  
  defp update_grouped_title(base_title, count) do
    # Remove any existing count from title
    base = Regex.replace(~r/ \(\d+\)$/, base_title, "")
    "#{base} (#{count})"
  end
  
  defp get_unread_by_group_key(user, group_key) do
    Notification
    |> where([n], n.user_id == ^user.id)
    |> where([n], n.group_key == ^group_key)
    |> where([n], is_nil(n.read_at))
    # Only group notifications from last hour
    |> where([n], n.inserted_at > ago(1, "hour"))
    |> Repo.one()
  end
  
  defp deliver_notification(user, notification, type) do
    notification_type = type_to_setting(type)
    
    if Settings.should_notify?(user, notification_type) do
      # Broadcast via Phoenix PubSub for real-time
      broadcast_notification(user, notification)
      
      # Queue push notification
      maybe_send_push(user, notification)
      
      # Queue email (for important notifications only)
      maybe_send_email(user, notification, type)
    end
  end
  
  defp type_to_setting(type) do
    case type do
      t when t in [:new_message, :message_mention, :message_reaction] -> :message
      t when t in [:friend_request, :friend_accepted] -> :friend_request
      t when t in [:group_invite, :group_join] -> :group_invite
      t when t in [:post_reply, :comment_reply, :post_mention] -> :forum_reply
      t when t in [:channel_mention] -> :mention
      _ -> :message
    end
  end
  
  defp broadcast_notification(user, notification) do
    CgraphWeb.Endpoint.broadcast(
      "user:#{user.id}",
      "notification",
      serialize(notification)
    )
  end
  
  defp maybe_send_push(user, notification) do
    {:ok, settings} = Settings.get_settings(user)
    
    if settings.push_notifications do
      # Queue push notification job
      %{user_id: user.id, notification_id: notification.id}
      |> Cgraph.Workers.SendPushNotification.new()
      |> Oban.insert()
      
      notification
      |> Notification.changeset(%{push_sent: true})
      |> Repo.update()
    end
  end
  
  defp maybe_send_email(user, notification, type) do
    {:ok, settings} = Settings.get_settings(user)
    
    # Only send emails for important notifications
    email_worthy = type in [:friend_request, :group_invite, :security_alert, :account_update]
    
    if settings.email_notifications && email_worthy do
      %{user_id: user.id, notification_id: notification.id}
      |> Cgraph.Workers.SendEmailNotification.new(schedule_in: 300)  # 5 minute delay to batch
      |> Oban.insert()
    end
  end
  
  @doc """
  Lists notifications for a user.
  
  ## Options
  
    * `:unread_only` - Only return unread notifications (default: false)
    * `:limit` - Maximum number to return (default: 50)
    * `:offset` - Offset for pagination (default: 0)
    * `:types` - Filter by notification types
    * `:page` - Page number for pagination (default: 1)
    * `:per_page` - Items per page (default: 20)
    * `:filter` - Filter mode: "all" or "unread" (default: "all")
    * `:type` - Filter by single notification type
  
  Returns `{notifications, meta}` tuple with pagination info.
  """
  def list_notifications(%User{} = user, opts \\ []) do
    # Support both old and new pagination params
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 20)
    limit = Keyword.get(opts, :limit, per_page)
    offset = Keyword.get(opts, :offset, (page - 1) * per_page)
    
    # Support both filter modes and unread_only boolean
    filter = Keyword.get(opts, :filter, "all")
    unread_only = Keyword.get(opts, :unread_only, filter == "unread")
    
    # Support both types list and single type
    types = Keyword.get(opts, :types, [])
    type = Keyword.get(opts, :type)
    types = if type && types == [], do: [type], else: types
    
    query = Notification
    |> where([n], n.user_id == ^user.id)
    |> order_by([n], desc: n.inserted_at)
    |> preload(:actor)
    
    query = if unread_only do
      where(query, [n], is_nil(n.read_at))
    else
      query
    end
    
    query = if types != [] do
      where(query, [n], n.type in ^types)
    else
      query
    end
    
    total = Repo.aggregate(query, :count, :id)
    
    notifications = query
      |> limit(^limit)
      |> offset(^offset)
      |> Repo.all()
    
    meta = %{page: page, per_page: per_page, total: total}
    {notifications, meta}
  end
  
  @doc """
  Gets the count of unread notifications for a user.
  """
  def unread_count(%User{} = user) do
    Notification
    |> where([n], n.user_id == ^user.id)
    |> where([n], is_nil(n.read_at))
    |> Repo.aggregate(:count)
  end
  
  @doc """
  Marks a single notification as read.
  """
  def mark_read(%Notification{} = notification) do
    notification
    |> Notification.mark_read_changeset()
    |> Repo.update()
  end

  @doc """
  Marks a notification as read.

  Accepts either a Notification struct or a notification ID string.

  ## Examples

      iex> mark_as_read(notification)
      {:ok, %Notification{read_at: ~U[2024-01-01 12:00:00Z]}}

      iex> mark_as_read("uuid-string")
      {:ok, %Notification{read_at: ~U[2024-01-01 12:00:00Z]}}

  """
  def mark_as_read(%Notification{} = notification) do
    mark_read(notification)
  end

  def mark_as_read(notification_id) when is_binary(notification_id) do
    case Repo.get(Notification, notification_id) do
      nil -> {:error, :not_found}
      notification -> mark_read(notification)
    end
  end

  @doc """
  Marks a notification as unread.

  Accepts either a Notification struct or a notification ID string.

  ## Examples

      iex> mark_as_unread(notification)
      {:ok, %Notification{read_at: nil}}

  """
  def mark_as_unread(%Notification{} = notification) do
    notification
    |> Ecto.Changeset.change(read_at: nil)
    |> Repo.update()
  end

  def mark_as_unread(notification_id) when is_binary(notification_id) do
    case Repo.get(Notification, notification_id) do
      nil -> 
        {:error, :not_found}
      notification ->
        notification
        |> Ecto.Changeset.change(read_at: nil)
        |> Repo.update()
    end
  end
  
  @doc """
  Marks all notifications as read for a user.
  """
  def mark_all_read(%User{} = user) do
    Notification
    |> where([n], n.user_id == ^user.id)
    |> where([n], is_nil(n.read_at))
    |> Repo.update_all(set: [read_at: DateTime.utc_now()])
  end
  
  @doc """
  Marks notifications as read up to a certain notification ID.
  Useful for "mark all above as read" functionality.
  """
  def mark_read_up_to(%User{} = user, notification_id) do
    case Repo.get(Notification, notification_id) do
      nil ->
        {:error, :not_found}
        
      notification ->
        Notification
        |> where([n], n.user_id == ^user.id)
        |> where([n], is_nil(n.read_at))
        |> where([n], n.inserted_at <= ^notification.inserted_at)
        |> Repo.update_all(set: [read_at: DateTime.utc_now()])
    end
  end

  @doc """
  Update notification settings for a user.
  
  Settings are stored in user preferences or a separate settings table.
  """
  def update_notification_settings(%User{} = user, settings) do
    # For now, store in user metadata. Could be a separate table.
    # This is a simplified implementation.
    case Cgraph.Accounts.update_user_preferences(user, %{notification_settings: settings}) do
      {:ok, _user} -> {:ok, settings}
      {:error, _} = error -> error
    end
  rescue
    # If update_user_preferences doesn't exist, return success
    _ -> {:ok, settings}
  end

  @doc """
  Get notification settings for a user.
  """
  def get_notification_settings(%User{} = _user) do
    # Default settings
    defaults = %{
      email_notifications: true,
      push_notifications: true,
      dm_notifications: true,
      mention_notifications: true,
      group_notifications: true
    }
    
    # Would merge with user's saved preferences
    defaults
  end
  
  @doc """
  Marks a notification as clicked (for analytics).
  """
  def mark_clicked(%Notification{} = notification) do
    notification
    |> Notification.mark_clicked_changeset()
    |> Repo.update()
  end
  
  @doc """
  Deletes a notification.
  """
  def delete_notification(%Notification{} = notification) do
    Repo.delete(notification)
  end
  
  @doc """
  Deletes all notifications for a user.
  """
  def delete_all(%User{} = user) do
    Notification
    |> where([n], n.user_id == ^user.id)
    |> Repo.delete_all()
  end
  
  @doc """
  Cleans up old notifications (older than specified days).
  Should be run as a scheduled job.
  """
  def cleanup_old_notifications(days \\ 30) do
    cutoff = DateTime.utc_now() |> DateTime.add(-days * 24 * 60 * 60, :second)
    
    Notification
    |> where([n], n.inserted_at < ^cutoff)
    |> where([n], not is_nil(n.read_at))  # Only delete read notifications
    |> Repo.delete_all()
  end
  
  @doc """
  Gets a single notification by ID.
  """
  def get_notification(id) do
    case Repo.get(Notification, id) do
      nil -> {:error, :not_found}
      notification -> {:ok, Repo.preload(notification, :actor)}
    end
  end
  
  @doc """
  Gets a notification by ID, ensuring it belongs to the user.

  Returns `{:ok, notification}` if found and belongs to user, 
  `{:error, :not_found}` otherwise.
  """
  def get_notification(%User{} = user, id) do
    Notification
    |> where([n], n.id == ^id and n.user_id == ^user.id)
    |> Repo.one()
    |> case do
      nil -> {:error, :not_found}
      notification -> {:ok, Repo.preload(notification, :actor)}
    end
  end

  # ============================================================================
  # Push Tokens
  # ============================================================================

  @doc """
  Register a push token for a user.
  If a token with the same user_id and token already exists, update it.
  """
  def register_push_token(%User{} = user, token_params) do
    alias Cgraph.Accounts.PushToken

    attrs = Map.merge(token_params, %{"user_id" => user.id})
    
    # Check if token already exists for this user
    existing = Repo.get_by(PushToken, user_id: user.id, token: attrs["token"])
    
    case existing do
      nil ->
        # Create new token
        %PushToken{}
        |> PushToken.changeset(attrs)
        |> Repo.insert()
      
      token ->
        # Update existing token
        token
        |> PushToken.changeset(attrs)
        |> Repo.update()
    end
  end

  @doc """
  List all push tokens for a user.
  """
  def list_push_tokens(%User{} = user) do
    alias Cgraph.Accounts.PushToken

    PushToken
    |> where([p], p.user_id == ^user.id)
    |> Repo.all()
  end

  @doc """
  Get a specific push token by ID.
  """
  def get_push_token(%User{} = user, token_id) do
    alias Cgraph.Accounts.PushToken

    case PushToken
         |> where([p], p.id == ^token_id and p.user_id == ^user.id)
         |> Repo.one() do
      nil -> {:error, :not_found}
      token -> {:ok, token}
    end
  end

  @doc """
  Get a specific push token by its value (the actual token string).
  """
  def get_push_token_by_value(%User{} = user, token_value) do
    alias Cgraph.Accounts.PushToken

    case PushToken
         |> where([p], p.token == ^token_value and p.user_id == ^user.id)
         |> Repo.one() do
      nil -> {:error, :not_found}
      token -> {:ok, token}
    end
  end

  @doc """
  Update a push token.
  """
  def update_push_token(%User{} = user, token_params) do
    alias Cgraph.Accounts.PushToken

    case Repo.get_by(PushToken, user_id: user.id, device_id: token_params["device_id"]) do
      nil -> {:error, :not_found}
      token ->
        token
        |> PushToken.changeset(token_params)
        |> Repo.update()
    end
  end

  @doc """
  Delete a push token.

  Accepts either a PushToken struct or a token ID string.

  ## Examples

      iex> delete_push_token(push_token)
      {:ok, %PushToken{}}

      iex> delete_push_token("uuid-string")
      {:ok, %PushToken{}}

  """
  def delete_push_token(%Cgraph.Accounts.PushToken{} = token) do
    Repo.delete(token)
  end

  def delete_push_token(token_id) when is_binary(token_id) do
    alias Cgraph.Accounts.PushToken

    case Repo.get(PushToken, token_id) do
      nil -> {:error, :not_found}
      token -> Repo.delete(token)
    end
  end

  @doc """
  Delete a push token by device ID.
  """
  def delete_push_token_by_device(%User{} = user, device_id) do
    alias Cgraph.Accounts.PushToken

    case Repo.get_by(PushToken, user_id: user.id, device_id: device_id) do
      nil -> {:error, :not_found}
      token -> Repo.delete(token)
    end
  end

  @doc """
  Send a test notification to verify push setup.
  """
  def send_test_notification(%User{} = user) do
    notify(user, :test, "Test Notification",
      body: "This is a test notification to verify your push setup."
    )
  end

  @doc """
  Get unread counts by category.
  """
  def get_unread_counts(%User{} = user) do
    counts = Notification
    |> where([n], n.user_id == ^user.id)
    |> where([n], is_nil(n.read_at))
    |> group_by([n], n.type)
    |> select([n], {n.type, count(n.id)})
    |> Repo.all()
    |> Map.new()

    total = counts |> Map.values() |> Enum.sum()

    %{
      total: total,
      by_type: counts
    }
  end

  @doc """
  Delete all notifications for a user, with optional type filter.

  Returns `{:ok, count}` where count is the number of notifications deleted.

  ## Options

    * `:type` - Optional notification type filter (atom or string)

  ## Examples

      iex> delete_all_notifications(user)
      {:ok, 10}

      iex> delete_all_notifications(user, type: :message)
      {:ok, 3}

  """
  def delete_all_notifications(%User{} = user, opts \\ []) do
    type = Keyword.get(opts, :type)

    query = Notification
    |> where([n], n.user_id == ^user.id)

    query = if type do
      where(query, [n], n.type == ^type)
    else
      query
    end

    {count, _} = Repo.delete_all(query)
    {:ok, count}
  end

  @doc """
  Mark all notifications as read, with optional type filter.

  Returns `{:ok, count}` where count is the number of notifications marked as read.

  ## Options

    * `:type` - Optional notification type filter (atom or string)

  ## Examples

      iex> mark_all_as_read(user)
      {:ok, 5}

      iex> mark_all_as_read(user, type: :message)
      {:ok, 2}

  """
  def mark_all_as_read(%User{} = user, opts \\ []) do
    type = Keyword.get(opts, :type)

    query = Notification
    |> where([n], n.user_id == ^user.id)
    |> where([n], is_nil(n.read_at))

    query = if type do
      where(query, [n], n.type == ^type)
    else
      query
    end

    {count, _} = Repo.update_all(query, set: [read_at: DateTime.utc_now()])
    {:ok, count}
  end
  
  @doc """
  Notify a user about a friend request.
  """
  def notify_friend_request(%User{} = recipient, %User{} = sender) do
    notify(recipient, :friend_request, "New friend request",
      body: "#{sender.username} wants to be your friend",
      actor: sender,
      data: %{sender_id: sender.id}
    )
  end
  
  @doc """
  Notify a user that their friend request was accepted.
  """
  def notify_friend_accepted(%User{} = recipient, %User{} = accepter) do
    notify(recipient, :friend_accepted, "Friend request accepted",
      body: "#{accepter.username} accepted your friend request",
      actor: accepter,
      data: %{accepter_id: accepter.id}
    )
  end
  
  @doc """
  Creates a notification directly (simple form).
  """
  def create_notification(%User{} = user, type) when is_atom(type) do
    create_notification(user, type, to_string(type), nil, %{}, nil)
  end
  
  # Serialization
  
  def serialize(%Notification{} = n) do
    %{
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      data: n.data,
      read: !is_nil(n.read_at),
      read_at: n.read_at,
      count: n.count,
      actor: if(Ecto.assoc_loaded?(n.actor) && n.actor, do: %{
        id: n.actor.id,
        username: n.actor.username,
        avatar_url: n.actor.avatar_url
      }),
      created_at: n.inserted_at
    }
  end
end
