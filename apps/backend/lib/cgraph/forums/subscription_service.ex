defmodule CGraph.Forums.SubscriptionService do
  @moduledoc """
  Service for managing forum subscriptions and notifications.
  """
  
  import Ecto.Query, warn: false
  alias CGraph.Repo
  alias CGraph.Forums.Subscription
  
  @doc """
  Subscribe to a forum.
  """
  def subscribe_to_forum(user_id, forum_id, opts \\ []) do
    %Subscription{}
    |> Subscription.changeset(%{
      user_id: user_id,
      forum_id: forum_id,
      notification_mode: Keyword.get(opts, :mode, "instant"),
      email_notifications: Keyword.get(opts, :email, true),
      push_notifications: Keyword.get(opts, :push, true),
      include_replies: Keyword.get(opts, :include_replies, true)
    })
    |> Repo.insert()
  end
  
  @doc """
  Subscribe to a board.
  """
  def subscribe_to_board(user_id, board_id, opts \\ []) do
    %Subscription{}
    |> Subscription.changeset(%{
      user_id: user_id,
      board_id: board_id,
      notification_mode: Keyword.get(opts, :mode, "instant"),
      email_notifications: Keyword.get(opts, :email, true),
      push_notifications: Keyword.get(opts, :push, true),
      include_replies: Keyword.get(opts, :include_replies, true)
    })
    |> Repo.insert()
  end
  
  @doc """
  Subscribe to a thread.
  """
  def subscribe_to_thread(user_id, thread_id, opts \\ []) do
    %Subscription{}
    |> Subscription.changeset(%{
      user_id: user_id,
      thread_id: thread_id,
      notification_mode: Keyword.get(opts, :mode, "instant"),
      email_notifications: Keyword.get(opts, :email, true),
      push_notifications: Keyword.get(opts, :push, true),
      include_replies: Keyword.get(opts, :include_replies, true)
    })
    |> Repo.insert()
  end
  
  @doc """
  Unsubscribe from a forum/board/thread.
  """
  def unsubscribe(subscription_id) do
    case Repo.get(Subscription, subscription_id) do
      nil -> {:error, :not_found}
      subscription -> Repo.delete(subscription)
    end
  end
  
  @doc """
  Get all subscriptions for a user.
  """
  def list_subscriptions(user_id) do
    from(s in Subscription,
      where: s.user_id == ^user_id,
      preload: [:forum, :board, :thread],
      order_by: [desc: s.inserted_at]
    )
    |> Repo.all()
  end
  
  @doc """
  Get subscriptions by type.
  """
  def list_forum_subscriptions(user_id) do
    from(s in Subscription,
      where: s.user_id == ^user_id,
      where: not is_nil(s.forum_id),
      preload: [:forum]
    )
    |> Repo.all()
  end
  
  def list_board_subscriptions(user_id) do
    from(s in Subscription,
      where: s.user_id == ^user_id,
      where: not is_nil(s.board_id),
      preload: [:board]
    )
    |> Repo.all()
  end
  
  def list_thread_subscriptions(user_id) do
    from(s in Subscription,
      where: s.user_id == ^user_id,
      where: not is_nil(s.thread_id),
      preload: [:thread]
    )
    |> Repo.all()
  end
  
  @doc """
  Update subscription settings.
  """
  def update_subscription(subscription_id, attrs) do
    case Repo.get(Subscription, subscription_id) do
      nil -> {:error, :not_found}
      subscription ->
        subscription
        |> Subscription.changeset(attrs)
        |> Repo.update()
    end
  end
  
  @doc """
  Get users subscribed to a thread (for sending notifications).
  """
  def get_thread_subscribers(thread_id, exclude_user_id \\ nil) do
    query = 
      from s in Subscription,
        where: s.thread_id == ^thread_id,
        where: s.notification_mode != "none",
        preload: [:user]
    
    query = 
      if exclude_user_id do
        from s in query, where: s.user_id != ^exclude_user_id
      else
        query
      end
    
    Repo.all(query)
  end
  
  @doc """
  Get users subscribed to a board (for new thread notifications).
  """
  def get_board_subscribers(board_id, exclude_user_id \\ nil) do
    query = 
      from s in Subscription,
        where: s.board_id == ^board_id,
        where: s.notification_mode != "none",
        preload: [:user]
    
    query = 
      if exclude_user_id do
        from s in query, where: s.user_id != ^exclude_user_id
      else
        query
      end
    
    Repo.all(query)
  end
  
  @doc """
  Mark unread for a subscription.
  """
  def increment_unread(subscription_id) do
    from(s in Subscription, where: s.id == ^subscription_id)
    |> Repo.update_all(inc: [unread_count: 1])
  end
  
  @doc """
  Mark subscription as read.
  """
  def mark_read(subscription_id) do
    from(s in Subscription, where: s.id == ^subscription_id)
    |> Repo.update_all(set: [unread_count: 0])
  end
  
  @doc """
  Check if user is subscribed to a thread.
  """
  def is_subscribed_to_thread?(user_id, thread_id) do
    from(s in Subscription,
      where: s.user_id == ^user_id,
      where: s.thread_id == ^thread_id
    )
    |> Repo.exists?()
  end
  
  @doc """
  Toggle subscription to a thread.
  """
  def toggle_thread_subscription(user_id, thread_id) do
    case Repo.one(from s in Subscription,
      where: s.user_id == ^user_id,
      where: s.thread_id == ^thread_id
    ) do
      nil -> subscribe_to_thread(user_id, thread_id)
      subscription -> unsubscribe(subscription.id)
    end
  end
end
