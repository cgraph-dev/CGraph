defmodule CGraph.Forums.SubscriptionService do
  @moduledoc """
  Service for managing forum subscriptions and notifications.
  """

  import Ecto.Query, warn: false
  alias CGraph.Forums.Subscription
  alias CGraph.Repo

  @doc """
  Subscribe to a forum.
  """
  @spec subscribe_to_forum(binary(), binary(), keyword()) :: {:ok, Subscription.t()} | {:error, Ecto.Changeset.t()}
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
  @spec subscribe_to_board(binary(), binary(), keyword()) :: {:ok, Subscription.t()} | {:error, Ecto.Changeset.t()}
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
  @spec subscribe_to_thread(binary(), binary(), keyword()) :: {:ok, Subscription.t()} | {:error, Ecto.Changeset.t()}
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
  @spec unsubscribe(binary()) :: {:ok, Subscription.t()} | {:error, :not_found} | {:error, Ecto.Changeset.t()}
  def unsubscribe(subscription_id) do
    case Repo.get(Subscription, subscription_id) do
      nil -> {:error, :not_found}
      subscription -> Repo.delete(subscription)
    end
  end

  @doc """
  Get all subscriptions for a user.
  """
  @spec list_subscriptions(binary()) :: [Subscription.t()]
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
  @spec list_forum_subscriptions(binary()) :: [Subscription.t()]
  def list_forum_subscriptions(user_id) do
    from(s in Subscription,
      where: s.user_id == ^user_id,
      where: not is_nil(s.forum_id),
      preload: [:forum]
    )
    |> Repo.all()
  end

  @spec list_board_subscriptions(binary()) :: [Subscription.t()]
  def list_board_subscriptions(user_id) do
    from(s in Subscription,
      where: s.user_id == ^user_id,
      where: not is_nil(s.board_id),
      preload: [:board]
    )
    |> Repo.all()
  end

  @doc "Lists thread subscriptions for a user."
  @spec list_thread_subscriptions(binary()) :: [Subscription.t()]
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
  @spec update_subscription(binary(), map()) :: {:ok, Subscription.t()} | {:error, :not_found} | {:error, Ecto.Changeset.t()}
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
  @spec get_thread_subscribers(binary(), binary() | nil) :: [Subscription.t()]
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
  @spec get_board_subscribers(binary(), binary() | nil) :: [Subscription.t()]
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
  @spec increment_unread(binary()) :: {non_neg_integer(), nil | [term()]}
  def increment_unread(subscription_id) do
    from(s in Subscription, where: s.id == ^subscription_id)
    |> Repo.update_all(inc: [unread_count: 1])
  end

  @doc """
  Mark subscription as read.
  """
  @spec mark_read(binary()) :: {non_neg_integer(), nil | [term()]}
  def mark_read(subscription_id) do
    from(s in Subscription, where: s.id == ^subscription_id)
    |> Repo.update_all(set: [unread_count: 0])
  end

  @doc """
  Check if user is subscribed to a thread.
  """
  @spec subscribed_to_thread?(binary(), binary()) :: boolean()
  def subscribed_to_thread?(user_id, thread_id) do
    from(s in Subscription,
      where: s.user_id == ^user_id,
      where: s.thread_id == ^thread_id
    )
    |> Repo.exists?()
  end

  @doc """
  Toggle subscription to a thread.
  """
  @spec toggle_thread_subscription(binary(), binary()) :: {:ok, Subscription.t()} | {:error, Ecto.Changeset.t()}
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
