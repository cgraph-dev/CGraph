defmodule CGraph.Mailer.Templates.TextRenderer do
  @moduledoc false

  alias CGraph.Mailer.Templates

  @doc false
  @spec render(atom(), map()) :: String.t()
  def render(:welcome, data) do
    username = Map.get(data, :username, "there")
    display_name = Map.get(data, :display_name, username)

    """
    Welcome to CGraph! 🎉

    Hi #{display_name},

    Thanks for joining CGraph! We're excited to have you as part of our community.

    With CGraph, you can:
    • Send secure, end-to-end encrypted messages
    • Create and join group channels
    • Participate in public forum discussions
    • Share voice messages with crystal-clear audio
    • Keep your conversations private with E2EE

    Get started: https://cgraph.app/get-started

    If you have any questions, contact us at support@cgraph.app

    — The CGraph Team
    """
  end

  def render(:verification, data) do
    verification_url = Map.get(data, :verification_url, "#")
    expires_in = Map.get(data, :expires_in, "24 hours")

    """
    Verify your email address

    Please click the link below to verify your email address:
    #{verification_url}

    This link will expire in #{expires_in}.

    If you didn't create a CGraph account, you can safely ignore this email.

    — The CGraph Team
    """
  end

  def render(:password_reset, data) do
    reset_url = Map.get(data, :reset_url, "#")
    expires_in = Map.get(data, :expires_in, "1 hour")
    ip_address = Map.get(data, :ip_address, "Unknown")

    """
    Reset your password

    We received a request to reset your password. Click the link below to choose a new password:
    #{reset_url}

    This link will expire in #{expires_in}.

    Security Notice: This request was made from IP address #{ip_address}.
    If you didn't request this password reset, please ignore this email.

    — The CGraph Team
    """
  end

  def render(:security_alert, data) do
    alert_type = Map.get(data, :alert_type, :unknown)
    timestamp = Map.get(data, :timestamp, DateTime.utc_now() |> DateTime.to_iso8601())
    ip_address = Map.get(data, :ip_address, "Unknown")
    location = Map.get(data, :location, "Unknown")
    device = Map.get(data, :device, "Unknown")

    {title, description, _icon} = Templates.security_alert_content(alert_type)

    """
    #{title}

    #{description}

    Details:
    • When: #{timestamp}
    • IP Address: #{ip_address}
    • Location: #{location}
    • Device: #{device}

    If this wasn't you, please secure your account immediately:
    https://cgraph.app/settings/security

    — The CGraph Security Team
    """
  end

  def render(:two_factor, data) do
    code = Map.get(data, :code, "000000")
    expires_in = Map.get(data, :expires_in, "5 minutes")

    """
    Your verification code

    Use this code to complete your sign-in:

    #{code}

    This code will expire in #{expires_in}.

    Security tip: Never share this code with anyone. CGraph will never ask you for this code.

    — The CGraph Team
    """
  end

  def render(:notification, data) do
    title = Map.get(data, :title, "New notification")
    body = Map.get(data, :body, "")
    action_url = Map.get(data, :action_url, "https://cgraph.app")

    """
    #{title}

    #{body}

    View in CGraph: #{action_url}

    — The CGraph Team
    """
  end

  def render(:account_locked, data) do
    reason = Map.get(data, :reason, "Too many failed login attempts")
    support_url = Map.get(data, :support_url, "https://cgraph.app/support")

    """
    Account Locked

    Your CGraph account has been temporarily locked for security reasons.

    Reason: #{reason}

    If this wasn't you, someone may be trying to access your account.

    Contact support: #{support_url}

    — The CGraph Security Team
    """
  end

  def render(:digest, data) do
    user_name = Map.get(data, :user_name, "there")
    period = Map.get(data, :period, "Weekly")
    app_url = Map.get(data, :app_url, "https://cgraph.app")
    stats = Map.get(data, :stats, %{})
    trending = Map.get(data, :trending_posts, [])
    achievements = Map.get(data, :new_achievements, [])

    messages_sent = Map.get(stats, :new_messages, 0)
    xp_earned = Map.get(stats, :xp_earned, 0)
    unread_messages = Map.get(data, :unread_messages, [])
    unread = length(unread_messages)

    trending_text =
      trending
      |> Enum.take(5)
      |> Enum.map(fn p -> "- #{Map.get(p, :title, "Post")} (#{Map.get(p, :replies, 0)} replies)" end)
      |> Enum.join("\n")

    achievements_text =
      achievements
      |> Enum.take(3)
      |> Enum.map(fn a -> "- #{Map.get(a, :title, "Achievement")} (+#{Map.get(a, :xp_reward, 0)} XP)" end)
      |> Enum.join("\n")

    """
    Hi #{user_name},

    Here's your #{period} CGraph digest:

    ACTIVITY SUMMARY
    - Messages sent: #{messages_sent}
    - XP earned: #{xp_earned}
    - Unread messages: #{unread}

    #{if trending_text != "", do: "TRENDING POSTS\n#{trending_text}\n", else: ""}
    #{if achievements_text != "", do: "NEW ACHIEVEMENTS\n#{achievements_text}\n", else: ""}
    View full activity: #{app_url}/dashboard

    Manage preferences: #{app_url}/settings/notifications
    """
  end

  def render(:export_ready, data) do
    download_url = Map.get(data, :download_url, "#")
    expires_in = Map.get(data, :expires_in, "7 days")

    """
    Your data export is ready

    Your CGraph data export has been generated and is ready for download.

    Download: #{download_url}

    This link will expire in #{expires_in}.

    — The CGraph Team
    """
  end
end
