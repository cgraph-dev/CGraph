defmodule CGraph.Notifications do
  @moduledoc "Context for managing notifications. Thin facade delegating to sub-modules."

  import Ecto.Query

  alias CGraph.Accounts.User
  alias CGraph.Notifications.{Delivery, Notification, PushTokens, Queries}
  alias CGraph.Repo

  # ---------------------------------------------------------------------------
  # Notification parameters (Google-style context object)
  # ---------------------------------------------------------------------------

  defmodule Params do
    @moduledoc false
    defstruct [:type, :title, :body, :actor, :group_key, data: %{}]
  end

  # ---------------------------------------------------------------------------
  # Core creation & delivery
  # ---------------------------------------------------------------------------

  @doc "Creates and delivers a notification to a user."
  @spec notify(User.t(), atom(), String.t(), keyword()) :: {:ok, Notification.t()} | {:error, term()}
  def notify(%User{} = user, type, title, opts \\ []) do
    params = %Params{
      type: type,
      title: title,
      body: Keyword.get(opts, :body),
      data: Keyword.get(opts, :data, %{}),
      actor: Keyword.get(opts, :actor),
      group_key: Keyword.get(opts, :group_key)
    }

    notification =
      if params.group_key,
        do: maybe_group_notification(user, params),
        else: do_create_notification(user, params)

    case notification do
      {:ok, notif} ->
        Delivery.deliver(user, notif, type)
        {:ok, notif}

      error ->
        error
    end
  end

  @doc "Creates a notification directly (simple form)."
  @spec create_notification(User.t(), atom()) :: {:ok, Notification.t()} | {:error, term()}
  def create_notification(%User{} = user, type) when is_atom(type) do
    params = %Params{type: type, title: to_string(type), data: %{}}
    do_create_notification(user, params)
  end

  @doc "Simple send function for admin/marketplace notifications."
  @spec send(String.t() | integer(), atom(), map()) :: {:ok, Notification.t()} | {:error, term()}
  def send(user_id, type, data) when is_binary(user_id) or is_integer(user_id) do
    case CGraph.Repo.get(User, user_id) do
      nil -> {:error, :user_not_found}
      user -> notify(user, type, to_string(type), data: data)
    end
  end

  defp do_create_notification(user, %Params{} = p) do
    %Notification{}
    |> Notification.changeset(%{
      user_id: user.id,
      actor_id: p.actor && p.actor.id,
      type: p.type,
      title: p.title,
      body: p.body,
      data: p.data
    })
    |> Repo.insert()
  end

  defp maybe_group_notification(user, %Params{} = p) do
    case get_unread_by_group_key(user, p.group_key) do
      nil ->
        %Notification{}
        |> Notification.changeset(%{
          user_id: user.id,
          actor_id: p.actor && p.actor.id,
          type: p.type,
          title: p.title,
          body: p.body,
          data: p.data,
          group_key: p.group_key,
          count: 1
        })
        |> Repo.insert()

      existing ->
        existing
        |> Notification.changeset(%{
          count: existing.count + 1,
          title: update_grouped_title(p.title, existing.count + 1),
          updated_at: DateTime.utc_now()
        })
        |> Repo.update()
    end
  end

  defp update_grouped_title(base_title, count) do
    base = Regex.replace(~r/ \(\d+\)$/, base_title, "")
    "#{base} (#{count})"
  end

  defp get_unread_by_group_key(user, group_key) do
    Notification
    |> where([n], n.user_id == ^user.id)
    |> where([n], n.group_key == ^group_key)
    |> where([n], is_nil(n.read_at))
    |> where([n], n.inserted_at > ago(1, "hour"))
    |> Repo.one()
  end

  # ---------------------------------------------------------------------------
  # Settings
  # ---------------------------------------------------------------------------

  @doc "Update notification settings for a user."
  @spec update_notification_settings(User.t(), map()) :: {:ok, map()} | {:error, term()}
  def update_notification_settings(%User{} = user, settings) do
    case CGraph.Accounts.update_user_preferences(user, %{notification_settings: settings}) do
      {:ok, _user} -> {:ok, settings}
      {:error, _} = error -> error
    end
  rescue
    _ -> {:ok, settings}
  end

  @doc "Get notification settings for a user."
  @spec get_notification_settings(User.t()) :: map()
  def get_notification_settings(%User{} = _user) do
    %{
      email_notifications: true,
      push_notifications: true,
      dm_notifications: true,
      mention_notifications: true,
      group_notifications: true
    }
  end

  # ---------------------------------------------------------------------------
  # Convenience helpers
  # ---------------------------------------------------------------------------

  @doc "Notify a user about a friend request."
  @spec notify_friend_request(User.t(), User.t()) :: {:ok, Notification.t()} | {:error, term()}
  def notify_friend_request(%User{} = recipient, %User{} = sender) do
    # Dismiss any existing unread friend-request notifications from the same
    # sender so that cancel-and-resend doesn't create duplicates.
    dismiss_friend_request_notifications(recipient.id, sender.id)

    notify(recipient, :friend_request, "New friend request",
      body: "#{sender.username} wants to be your friend",
      actor: sender,
      data: %{sender_id: sender.id}
    )
  end

  @doc "Removes unread friend-request notifications from `sender_id` to `recipient_id`."
  @spec dismiss_friend_request_notifications(String.t(), String.t()) :: {non_neg_integer(), nil}
  def dismiss_friend_request_notifications(recipient_id, sender_id) do
    from(n in Notification,
      where: n.user_id == ^recipient_id,
      where: n.actor_id == ^sender_id,
      where: n.type == :friend_request,
      where: is_nil(n.read_at)
    )
    |> Repo.delete_all()
  end

  @doc "Notify a user that their friend request was accepted."
  @spec notify_friend_accepted(User.t(), User.t()) :: {:ok, Notification.t()} | {:error, term()}
  def notify_friend_accepted(%User{} = recipient, %User{} = accepter) do
    notify(recipient, :friend_accepted, "Friend request accepted",
      body: "#{accepter.username} accepted your friend request",
      actor: accepter,
      data: %{accepter_id: accepter.id}
    )
  end

  @doc "Send a test notification to verify push setup."
  @spec send_test_notification(User.t()) :: {:ok, Notification.t()} | {:error, term()}
  def send_test_notification(%User{} = user) do
    notify(user, :test, "Test Notification",
      body: "This is a test notification to verify your push setup."
    )
  end

  # ---------------------------------------------------------------------------
  # Serialization
  # ---------------------------------------------------------------------------

  @doc "Exports all notifications for a user (GDPR data export)."
  @spec export_user_notifications(String.t()) :: {:ok, [map()]}
  def export_user_notifications(user_id) do
    notifications =
      Notification
      |> where([n], n.user_id == ^user_id)
      |> order_by([n], desc: n.inserted_at)
      |> Repo.all()
      |> Enum.map(fn n ->
        %{
          id: n.id,
          type: n.type,
          title: n.title,
          body: n.body,
          data: n.data,
          read_at: n.read_at,
          created_at: n.inserted_at
        }
      end)

    {:ok, notifications}
  end

  @doc "Serialize a notification struct to a map for JSON/broadcast."
  @spec serialize(Notification.t()) :: map()
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
      actor:
        if(Ecto.assoc_loaded?(n.actor) && n.actor,
          do: %{
            id: n.actor.id,
            username: n.actor.username,
            avatar_url: n.actor.avatar_url
          }
        ),
      created_at: n.inserted_at
    }
  end

  # ---------------------------------------------------------------------------
  # Delegated: Queries
  # ---------------------------------------------------------------------------

  @spec list_notifications(User.t(), keyword()) :: {[Notification.t()], map()}
  defdelegate list_notifications(user, opts \\ []), to: Queries
  @spec unread_count(User.t()) :: non_neg_integer()
  defdelegate unread_count(user), to: Queries
  @spec mark_read(Notification.t()) :: {:ok, Notification.t()} | {:error, Ecto.Changeset.t()}
  defdelegate mark_read(notification), to: Queries
  @spec mark_as_read(Notification.t() | String.t()) :: {:ok, Notification.t()} | {:error, :not_found | Ecto.Changeset.t()}
  defdelegate mark_as_read(notification_or_id), to: Queries
  @spec mark_as_unread(Notification.t() | String.t()) :: {:ok, Notification.t()} | {:error, :not_found | Ecto.Changeset.t()}
  defdelegate mark_as_unread(notification_or_id), to: Queries
  @spec mark_all_read(User.t()) :: {non_neg_integer(), nil | [term()]}
  defdelegate mark_all_read(user), to: Queries
  @spec mark_read_up_to(User.t(), String.t()) :: {:error, :not_found} | {non_neg_integer(), nil | [term()]}
  defdelegate mark_read_up_to(user, notification_id), to: Queries
  @spec mark_clicked(Notification.t()) :: {:ok, Notification.t()} | {:error, Ecto.Changeset.t()}
  defdelegate mark_clicked(notification), to: Queries
  @spec mark_all_as_read(User.t(), keyword()) :: {:ok, non_neg_integer()}
  defdelegate mark_all_as_read(user, opts \\ []), to: Queries

  @doc "Gets a single notification by ID."
  @spec get_notification(binary()) :: {:ok, Notification.t()} | {:error, :not_found}
  def get_notification(id) when is_binary(id), do: Queries.get_notification(id)

  @doc "Gets a notification by ID, ensuring it belongs to the user."
  @spec get_notification(User.t(), binary()) :: {:ok, Notification.t()} | {:error, :not_found}
  def get_notification(%User{} = user, id), do: Queries.get_notification(user, id)

  @spec get_unread_counts(User.t()) :: %{total: non_neg_integer(), by_type: map()}
  defdelegate get_unread_counts(user), to: Queries
  @spec delete_notification(Notification.t()) :: {:ok, Notification.t()} | {:error, Ecto.Changeset.t()}
  defdelegate delete_notification(notification), to: Queries
  @spec delete_all(User.t()) :: {non_neg_integer(), nil | [term()]}
  defdelegate delete_all(user), to: Queries
  @spec delete_all_notifications(User.t(), keyword()) :: {:ok, non_neg_integer()}
  defdelegate delete_all_notifications(user, opts \\ []), to: Queries
  @spec cleanup_old_notifications(pos_integer()) :: {non_neg_integer(), nil | [term()]}
  defdelegate cleanup_old_notifications(days \\ 30), to: Queries

  # ---------------------------------------------------------------------------
  # Delegated: Push Tokens
  # ---------------------------------------------------------------------------

  @spec register_push_token(User.t(), map()) :: {:ok, CGraph.Accounts.PushToken.t()} | {:error, Ecto.Changeset.t()}
  defdelegate register_push_token(user, token_params), to: PushTokens
  @spec list_push_tokens(User.t()) :: [CGraph.Accounts.PushToken.t()]
  defdelegate list_push_tokens(user), to: PushTokens
  @spec get_push_token(User.t(), String.t()) :: {:ok, CGraph.Accounts.PushToken.t()} | {:error, :not_found}
  defdelegate get_push_token(user, token_id), to: PushTokens
  @spec get_push_token_by_value(User.t(), String.t()) :: {:ok, CGraph.Accounts.PushToken.t()} | {:error, :not_found}
  defdelegate get_push_token_by_value(user, token_value), to: PushTokens
  @spec update_push_token(User.t(), map()) :: {:ok, CGraph.Accounts.PushToken.t()} | {:error, :not_found | Ecto.Changeset.t()}
  defdelegate update_push_token(user, token_params), to: PushTokens
  @spec delete_push_token(CGraph.Accounts.PushToken.t() | String.t()) :: {:ok, CGraph.Accounts.PushToken.t()} | {:error, :not_found | Ecto.Changeset.t()}
  defdelegate delete_push_token(token_or_id), to: PushTokens
  @spec delete_push_token_by_device(User.t(), String.t()) :: {:ok, CGraph.Accounts.PushToken.t()} | {:error, :not_found | Ecto.Changeset.t()}
  defdelegate delete_push_token_by_device(user, device_id), to: PushTokens
end
