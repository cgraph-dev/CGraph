defmodule CgraphWeb.API.V1.NotificationJSON do
  @moduledoc """
  JSON rendering for notification responses.
  """

  alias CgraphWeb.API.V1.UserJSON

  def index(%{notifications: notifications, meta: meta}) do
    %{
      data: Enum.map(notifications, &notification_data/1),
      meta: meta
    }
  end

  def show(%{notification: notification}) do
    %{data: notification_data(notification)}
  end

  def settings(%{settings: settings}) do
    %{
      data: %{
        # Channel settings
        push_enabled: settings.push_enabled,
        email_enabled: settings.email_enabled,
        # Type settings
        direct_messages: settings.direct_messages,
        mentions: settings.mentions,
        replies: settings.replies,
        friend_requests: settings.friend_requests,
        group_invites: settings.group_invites,
        forum_replies: settings.forum_replies,
        # Quiet hours
        quiet_hours_enabled: settings.quiet_hours_enabled,
        quiet_hours_start: settings.quiet_hours_start,
        quiet_hours_end: settings.quiet_hours_end,
        quiet_hours_timezone: settings.quiet_hours_timezone,
        # Sound settings
        sound_enabled: Map.get(settings, :sound_enabled, true),
        vibrate_enabled: Map.get(settings, :vibrate_enabled, true)
      }
    }
  end

  @doc """
  Render notification data.
  Schema uses read_at (datetime) not is_read (boolean).
  """
  def notification_data(notification) do
    %{
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      is_read: not is_nil(notification.read_at),
      read_at: notification.read_at,
      # Action data for navigation
      action: render_action(notification),
      # Actor (user who triggered the notification)
      actor: render_actor(notification.actor),
      # Additional context
      data: notification.data,
      created_at: notification.inserted_at
    }
  end

  defp render_action(notification) do
    case notification.type do
      "message" ->
        %{
          type: "navigate",
          screen: "conversation",
          params: %{conversation_id: notification.data["conversation_id"]}
        }
      
      "mention" ->
        %{
          type: "navigate",
          screen: notification.data["screen"],
          params: notification.data["params"]
        }
      
      "friend_request" ->
        %{
          type: "navigate",
          screen: "friend_requests",
          params: %{}
        }
      
      "friend_accepted" ->
        %{
          type: "navigate",
          screen: "profile",
          params: %{user_id: notification.data["user_id"]}
        }
      
      "group_invite" ->
        %{
          type: "navigate",
          screen: "group",
          params: %{group_id: notification.data["group_id"]}
        }
      
      "post_reply" ->
        %{
          type: "navigate",
          screen: "post",
          params: %{
            forum_id: notification.data["forum_id"],
            post_id: notification.data["post_id"]
          }
        }
      
      "comment_reply" ->
        %{
          type: "navigate",
          screen: "post",
          params: %{
            forum_id: notification.data["forum_id"],
            post_id: notification.data["post_id"],
            comment_id: notification.data["comment_id"]
          }
        }
      
      _ ->
        nil
    end
  end

  defp render_actor(nil), do: nil
  defp render_actor(actor), do: UserJSON.user_data(actor)
end
