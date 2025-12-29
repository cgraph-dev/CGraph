defmodule CgraphWeb.API.V1.SettingsJSON do
  @moduledoc """
  JSON rendering for settings responses.
  """
  alias Cgraph.Accounts.UserSettings

  def show(%{settings: settings}) do
    %{data: settings_data(settings)}
  end

  defp settings_data(%UserSettings{} = s) do
    %{
      notifications: %{
        push_enabled: s.push_notifications,
        email_enabled: s.email_notifications,
        message_notifications: s.notify_messages,
        mention_notifications: s.notify_mentions,
        friend_request_notifications: s.notify_friend_requests,
        quiet_hours_enabled: s.quiet_hours_enabled,
        quiet_hours_start: s.quiet_hours_start,
        quiet_hours_end: s.quiet_hours_end
      },
      privacy: %{
        profile_visibility: s.profile_visibility,
        online_status_visible: s.show_online_status,
        read_receipts_enabled: s.show_read_receipts,
        typing_indicators_enabled: s.show_typing_indicators,
        allow_friend_requests: s.allow_friend_requests,
        allow_group_invites: s.allow_group_invites
      },
      appearance: %{
        theme: s.theme,
        compact_mode: s.compact_mode,
        font_size: s.font_size
      },
      locale: %{
        language: s.language,
        timezone: s.timezone,
        date_format: s.date_format,
        time_format: s.time_format
      }
    }
  end

  defp settings_data(nil) do
    # Return defaults if no settings exist
    %{
      notifications: %{
        push_enabled: true,
        email_enabled: true,
        message_notifications: true,
        mention_notifications: true,
        friend_request_notifications: true,
        quiet_hours_enabled: false,
        quiet_hours_start: nil,
        quiet_hours_end: nil
      },
      privacy: %{
        profile_visibility: "public",
        online_status_visible: true,
        read_receipts_enabled: true,
        typing_indicators_enabled: true,
        allow_friend_requests: true,
        allow_group_invites: "everyone"
      },
      appearance: %{
        theme: "system",
        compact_mode: false,
        font_size: "medium"
      },
      locale: %{
        language: "en",
        timezone: "UTC",
        date_format: "MMM d, yyyy",
        time_format: "12h"
      }
    }
  end
end
