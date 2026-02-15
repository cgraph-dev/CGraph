defmodule CGraph.Notifications.Delivery do
  @moduledoc "Notification delivery pipeline — push, email, and real-time broadcast."

  alias CGraph.Accounts.{Settings, User}
  alias CGraph.Notifications.Notification
  alias CGraph.Repo
  alias CGraph.Workers.{SendEmailNotification, SendPushNotification}

  @doc "Deliver a notification through appropriate channels (broadcast, push, email)."
  @spec deliver(User.t(), Notification.t(), atom()) :: :ok
  def deliver(%User{} = user, %Notification{} = notification, type) do
    notification_type = type_to_setting(type)

    if Settings.should_notify?(user, notification_type) do
      broadcast(user, notification)
      maybe_send_push(user, notification)
      maybe_send_email(user, notification, type)
    end

    :ok
  end

  @doc false
  @spec type_to_setting(atom()) :: atom()
  def type_to_setting(type) do
    case type do
      t when t in [:new_message, :message_mention, :message_reaction] -> :message
      t when t in [:friend_request, :friend_accepted] -> :friend_request
      t when t in [:group_invite, :group_join] -> :group_invite
      t when t in [:post_reply, :comment_reply, :post_mention] -> :forum_reply
      t when t in [:channel_mention] -> :mention
      _ -> :message
    end
  end

  defp broadcast(user, notification) do
    CGraphWeb.Endpoint.broadcast(
      "user:#{user.id}",
      "notification",
      CGraph.Notifications.serialize(notification)
    )
  end

  defp maybe_send_push(user, notification) do
    {:ok, settings} = Settings.get_settings(user)

    if settings.push_notifications do
      %{user_id: user.id, notification_id: notification.id}
      |> SendPushNotification.new()
      |> Oban.insert()

      notification
      |> Notification.changeset(%{push_sent: true})
      |> Repo.update()
    end
  end

  defp maybe_send_email(user, notification, type) do
    {:ok, settings} = Settings.get_settings(user)
    email_worthy = type in [:friend_request, :group_invite, :security_alert, :account_update]

    if settings.email_notifications && email_worthy do
      %{user_id: user.id, notification_id: notification.id}
      |> SendEmailNotification.new(schedule_in: 300)
      |> Oban.insert()
    end
  end
end
