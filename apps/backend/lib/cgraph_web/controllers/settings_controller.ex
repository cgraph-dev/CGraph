defmodule CGraphWeb.SettingsController do
  @moduledoc """
  Handles server-wide settings retrieval and updates.

  Provides endpoints for authenticated users to view and modify
  application settings such as notifications, privacy, and display preferences.
  """

  use CGraphWeb, :controller
  import CGraphWeb.ControllerHelpers, only: [render_data: 2, render_error: 3]

  alias CGraph.Accounts.Settings

  @doc """
  GET /api/settings

  Returns the current user's settings.
  """
  @spec show(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def show(conn, _params) do
    user = conn.assigns.current_user
    {:ok, settings} = Settings.get_settings(user)

    render_data(conn, serialize_settings(settings))
  end

  @doc """
  PUT /api/settings

  Updates user settings. Accepts any subset of settings to update.
  """
  @spec update(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def update(conn, params) do
    user = conn.assigns.current_user

    case Settings.update_settings(user, params) do
      {:ok, settings} ->
        render_data(conn, %{
          settings: serialize_settings(settings),
          message: "Settings updated successfully"
        })

      {:error, changeset} ->
        render_error(conn, 422, "Failed to update settings: #{inspect(format_errors(changeset))}")
    end
  end

  @doc """
  PUT /api/settings/notifications

  Updates notification-specific settings.
  """
  @spec update_notifications(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def update_notifications(conn, params) do
    user = conn.assigns.current_user

    notification_params = Map.take(params, [
      "email_notifications",
      "push_notifications",
      "notify_messages",
      "notify_mentions",
      "notify_friend_requests",
      "notify_group_invites",
      "notify_forum_replies",
      "notification_sound",
      "quiet_hours_enabled",
      "quiet_hours_start",
      "quiet_hours_end"
    ])

    case Settings.update_settings(user, notification_params) do
      {:ok, settings} ->
        render_data(conn, %{
            notifications: %{
              email_notifications: settings.email_notifications,
              push_notifications: settings.push_notifications,
              notify_messages: settings.notify_messages,
              notify_mentions: settings.notify_mentions,
              notify_friend_requests: settings.notify_friend_requests,
              notify_group_invites: settings.notify_group_invites,
              notify_forum_replies: settings.notify_forum_replies,
              notification_sound: settings.notification_sound,
              quiet_hours_enabled: settings.quiet_hours_enabled,
              quiet_hours_start: settings.quiet_hours_start,
              quiet_hours_end: settings.quiet_hours_end
            }
        })

      {:error, changeset} ->
        render_error(conn, 422, inspect(format_errors(changeset)))
    end
  end

  @doc """
  PUT /api/settings/privacy

  Updates privacy-specific settings.
  """
  @spec update_privacy(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def update_privacy(conn, params) do
    user = conn.assigns.current_user

    privacy_params = Map.take(params, [
      "show_online_status",
      "show_read_receipts",
      "show_typing_indicators",
      "profile_visibility",
      "allow_friend_requests",
      "allow_message_requests",
      "show_in_search",
      "allow_group_invites"
    ])

    case Settings.update_settings(user, privacy_params) do
      {:ok, settings} ->
        render_data(conn, %{
            privacy: %{
              show_online_status: settings.show_online_status,
              show_read_receipts: settings.show_read_receipts,
              show_typing_indicators: settings.show_typing_indicators,
              profile_visibility: settings.profile_visibility,
              allow_friend_requests: settings.allow_friend_requests,
              allow_message_requests: settings.allow_message_requests,
              show_in_search: settings.show_in_search,
              allow_group_invites: settings.allow_group_invites
            }
        })

      {:error, changeset} ->
        render_error(conn, 422, inspect(format_errors(changeset)))
    end
  end

  @doc """
  PUT /api/settings/appearance

  Updates appearance settings.
  """
  @spec update_appearance(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def update_appearance(conn, params) do
    user = conn.assigns.current_user

    appearance_params = Map.take(params, [
      "theme",
      "compact_mode",
      "font_size",
      "message_density",
      "show_avatars",
      "animate_emojis",
      "reduce_motion",
      "high_contrast",
      "screen_reader_optimized"
    ])

    case Settings.update_settings(user, appearance_params) do
      {:ok, settings} ->
        render_data(conn, %{
            appearance: %{
              theme: settings.theme,
              compact_mode: settings.compact_mode,
              font_size: settings.font_size,
              message_density: settings.message_density,
              show_avatars: settings.show_avatars,
              animate_emojis: settings.animate_emojis,
              reduce_motion: settings.reduce_motion,
              high_contrast: settings.high_contrast,
              screen_reader_optimized: settings.screen_reader_optimized
            }
        })

      {:error, changeset} ->
        render_error(conn, 422, inspect(format_errors(changeset)))
    end
  end

  @doc """
  PUT /api/settings/locale

  Updates language and locale settings.
  """
  @spec update_locale(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def update_locale(conn, params) do
    user = conn.assigns.current_user

    locale_params = Map.take(params, [
      "language",
      "timezone",
      "date_format",
      "time_format"
    ])

    case Settings.update_settings(user, locale_params) do
      {:ok, settings} ->
        render_data(conn, %{
            locale: %{
              language: settings.language,
              timezone: settings.timezone,
              date_format: settings.date_format,
              time_format: settings.time_format
            }
        })

      {:error, changeset} ->
        render_error(conn, 422, inspect(format_errors(changeset)))
    end
  end

  @doc """
  POST /api/settings/reset

  Resets all settings to their default values.
  """
  @spec reset(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def reset(conn, _params) do
    user = conn.assigns.current_user
    {:ok, settings} = Settings.reset_to_defaults(user)

    render_data(conn, %{
      settings: serialize_settings(settings),
      message: "Settings reset to defaults"
    })
  end

  # Private helpers

  defp serialize_settings(settings) do
    %{
      notifications: %{
        email_notifications: settings.email_notifications,
        push_notifications: settings.push_notifications,
        notify_messages: settings.notify_messages,
        notify_mentions: settings.notify_mentions,
        notify_friend_requests: settings.notify_friend_requests,
        notify_group_invites: settings.notify_group_invites,
        notify_forum_replies: settings.notify_forum_replies,
        notification_sound: settings.notification_sound,
        quiet_hours_enabled: settings.quiet_hours_enabled,
        quiet_hours_start: settings.quiet_hours_start,
        quiet_hours_end: settings.quiet_hours_end
      },
      privacy: %{
        show_online_status: settings.show_online_status,
        show_read_receipts: settings.show_read_receipts,
        show_typing_indicators: settings.show_typing_indicators,
        profile_visibility: settings.profile_visibility,
        allow_friend_requests: settings.allow_friend_requests,
        allow_message_requests: settings.allow_message_requests,
        show_in_search: settings.show_in_search,
        allow_group_invites: settings.allow_group_invites
      },
      appearance: %{
        theme: settings.theme,
        compact_mode: settings.compact_mode,
        font_size: settings.font_size,
        message_density: settings.message_density,
        show_avatars: settings.show_avatars,
        animate_emojis: settings.animate_emojis,
        reduce_motion: settings.reduce_motion,
        high_contrast: settings.high_contrast,
        screen_reader_optimized: settings.screen_reader_optimized
      },
      locale: %{
        language: settings.language,
        timezone: settings.timezone,
        date_format: settings.date_format,
        time_format: settings.time_format
      },
      keyboard: %{
        shortcuts_enabled: settings.keyboard_shortcuts_enabled,
        custom_shortcuts: settings.custom_shortcuts
      }
    }
  end

  defp format_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Regex.replace(~r"%{(\w+)}", msg, fn _, key ->
        opts |> Keyword.get(String.to_existing_atom(key), key) |> to_string()
      end)
    end)
  end
end
