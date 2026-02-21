defmodule CGraph.Mailer.Templates.HtmlRenderer do
  @moduledoc false

  alias CGraph.Mailer.Templates
  alias CGraph.Mailer.Templates.Layout

  @doc false
  def render(:welcome, data) do
    username = Map.get(data, :username, "there")
    display_name = Map.get(data, :display_name, username)

    Layout.wrap_html_layout("""
    <h1 style="color: #1a1a2e; font-size: 28px; margin-bottom: 24px;">
      Welcome to CGraph! 🎉
    </h1>

    <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
      Hi #{html_escape(display_name)},
    </p>

    <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
      Thanks for joining CGraph! We're excited to have you as part of our community.
      With CGraph, you can:
    </p>

    <ul style="color: #4a5568; font-size: 16px; line-height: 1.8; margin-bottom: 24px; padding-left: 20px;">
      <li>📱 Send secure, end-to-end encrypted messages</li>
      <li>👥 Create and join group channels</li>
      <li>💬 Participate in public forum discussions</li>
      <li>🎙️ Share voice messages with crystal-clear audio</li>
      <li>🔒 Keep your conversations private with E2EE</li>
    </ul>

    <div style="text-align: center; margin: 32px 0;">
      <a href="https://cgraph.app/get-started"
         style="background-color: #6366f1; color: white; padding: 14px 32px;
                border-radius: 8px; text-decoration: none; font-weight: 600;
                display: inline-block;">
        Get Started
      </a>
    </div>

    <p style="color: #718096; font-size: 14px; line-height: 1.6; margin-top: 32px;">
      If you have any questions, feel free to reach out to our support team at
      <a href="mailto:support@cgraph.app" style="color: #6366f1;">support@cgraph.app</a>
    </p>
    """)
  end

  def render(:verification, data) do
    verification_url = Map.get(data, :verification_url, "#")
    expires_in = Map.get(data, :expires_in, "24 hours")

    Layout.wrap_html_layout("""
    <h1 style="color: #1a1a2e; font-size: 28px; margin-bottom: 24px;">
      Verify your email address
    </h1>

    <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
      Please click the button below to verify your email address and complete your account setup.
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="#{html_escape(verification_url)}"
         style="background-color: #10b981; color: white; padding: 14px 32px;
                border-radius: 8px; text-decoration: none; font-weight: 600;
                display: inline-block;">
        Verify Email Address
      </a>
    </div>

    <p style="color: #718096; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
      This link will expire in <strong>#{html_escape(expires_in)}</strong>.
    </p>

    <p style="color: #718096; font-size: 14px; line-height: 1.6;">
      If you didn't create a CGraph account, you can safely ignore this email.
    </p>

    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">

    <p style="color: #a0aec0; font-size: 12px; line-height: 1.6;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="#{html_escape(verification_url)}" style="color: #6366f1; word-break: break-all;">
        #{html_escape(verification_url)}
      </a>
    </p>
    """)
  end

  def render(:password_reset, data) do
    reset_url = Map.get(data, :reset_url, "#")
    expires_in = Map.get(data, :expires_in, "1 hour")
    ip_address = Map.get(data, :ip_address, "Unknown")

    Layout.wrap_html_layout("""
    <h1 style="color: #1a1a2e; font-size: 28px; margin-bottom: 24px;">
      Reset your password
    </h1>

    <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
      We received a request to reset your password. Click the button below to choose a new password.
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="#{html_escape(reset_url)}"
         style="background-color: #f59e0b; color: white; padding: 14px 32px;
                border-radius: 8px; text-decoration: none; font-weight: 600;
                display: inline-block;">
        Reset Password
      </a>
    </div>

    <p style="color: #718096; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
      This link will expire in <strong>#{html_escape(expires_in)}</strong>.
    </p>

    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0;">
      <p style="color: #92400e; font-size: 14px; margin: 0;">
        <strong>Security Notice:</strong> This request was made from IP address #{html_escape(ip_address)}.
        If you didn't request this password reset, please ignore this email or contact support.
      </p>
    </div>

    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">

    <p style="color: #a0aec0; font-size: 12px; line-height: 1.6;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="#{html_escape(reset_url)}" style="color: #6366f1; word-break: break-all;">
        #{html_escape(reset_url)}
      </a>
    </p>
    """)
  end

  def render(:security_alert, data) do
    alert_type = Map.get(data, :alert_type, :unknown)
    timestamp = Map.get(data, :timestamp, DateTime.utc_now() |> DateTime.to_iso8601())
    ip_address = Map.get(data, :ip_address, "Unknown")
    location = Map.get(data, :location, "Unknown")
    device = Map.get(data, :device, "Unknown")

    {title, description, icon} = Templates.security_alert_content(alert_type)

    Layout.wrap_html_layout("""
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="font-size: 48px;">#{icon}</div>
    </div>

    <h1 style="color: #1a1a2e; font-size: 28px; margin-bottom: 24px; text-align: center;">
      #{html_escape(title)}
    </h1>

    <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
      #{html_escape(description)}
    </p>

    <div style="background-color: #f7fafc; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="color: #718096; padding: 8px 0; font-size: 14px;">When:</td>
          <td style="color: #1a1a2e; padding: 8px 0; font-size: 14px; text-align: right;">#{html_escape(timestamp)}</td>
        </tr>
        <tr>
          <td style="color: #718096; padding: 8px 0; font-size: 14px;">IP Address:</td>
          <td style="color: #1a1a2e; padding: 8px 0; font-size: 14px; text-align: right;">#{html_escape(ip_address)}</td>
        </tr>
        <tr>
          <td style="color: #718096; padding: 8px 0; font-size: 14px;">Location:</td>
          <td style="color: #1a1a2e; padding: 8px 0; font-size: 14px; text-align: right;">#{html_escape(location)}</td>
        </tr>
        <tr>
          <td style="color: #718096; padding: 8px 0; font-size: 14px;">Device:</td>
          <td style="color: #1a1a2e; padding: 8px 0; font-size: 14px; text-align: right;">#{html_escape(device)}</td>
        </tr>
      </table>
    </div>

    <div style="background-color: #fed7d7; border-left: 4px solid #e53e3e; padding: 16px; margin: 24px 0;">
      <p style="color: #742a2a; font-size: 14px; margin: 0;">
        <strong>Wasn't you?</strong> If you don't recognize this activity, please secure your account immediately
        by changing your password and enabling two-factor authentication.
      </p>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="https://cgraph.app/settings/security"
         style="background-color: #e53e3e; color: white; padding: 14px 32px;
                border-radius: 8px; text-decoration: none; font-weight: 600;
                display: inline-block;">
        Review Account Security
      </a>
    </div>
    """)
  end

  def render(:two_factor, data) do
    code = Map.get(data, :code, "000000")
    expires_in = Map.get(data, :expires_in, "5 minutes")

    Layout.wrap_html_layout("""
    <h1 style="color: #1a1a2e; font-size: 28px; margin-bottom: 24px; text-align: center;">
      Your verification code
    </h1>

    <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 24px; text-align: center;">
      Use this code to complete your sign-in:
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <div style="background-color: #f7fafc; border: 2px dashed #e2e8f0;
                  border-radius: 12px; padding: 24px; display: inline-block;">
        <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px;
                     color: #6366f1; font-family: monospace;">
          #{html_escape(code)}
        </span>
      </div>
    </div>

    <p style="color: #718096; font-size: 14px; line-height: 1.6; text-align: center;">
      This code will expire in <strong>#{html_escape(expires_in)}</strong>.
    </p>

    <div style="background-color: #ebf8ff; border-left: 4px solid #3182ce; padding: 16px; margin: 24px 0;">
      <p style="color: #2c5282; font-size: 14px; margin: 0;">
        <strong>Security tip:</strong> Never share this code with anyone.
        CGraph will never ask you for this code.
      </p>
    </div>
    """)
  end

  def render(:notification, data) do
    title = Map.get(data, :title, "New notification")
    body = Map.get(data, :body, "")
    action_url = Map.get(data, :action_url, "https://cgraph.app")
    action_text = Map.get(data, :action_text, "View in CGraph")

    Layout.wrap_html_layout("""
    <h1 style="color: #1a1a2e; font-size: 28px; margin-bottom: 24px;">
      #{html_escape(title)}
    </h1>

    <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
      #{html_escape(body)}
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="#{html_escape(action_url)}"
         style="background-color: #6366f1; color: white; padding: 14px 32px;
                border-radius: 8px; text-decoration: none; font-weight: 600;
                display: inline-block;">
        #{html_escape(action_text)}
      </a>
    </div>
    """)
  end

  def render(:account_locked, data) do
    reason = Map.get(data, :reason, "Too many failed login attempts")
    unlock_time = Map.get(data, :unlock_time)
    support_url = Map.get(data, :support_url, "https://cgraph.app/support")

    unlock_message = if unlock_time do
      "Your account will be automatically unlocked at #{html_escape(unlock_time)}."
    else
      "Please contact support to unlock your account."
    end

    Layout.wrap_html_layout("""
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="font-size: 48px;">🔒</div>
    </div>

    <h1 style="color: #1a1a2e; font-size: 28px; margin-bottom: 24px; text-align: center;">
      Account Locked
    </h1>

    <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
      Your CGraph account has been temporarily locked for security reasons.
    </p>

    <div style="background-color: #f7fafc; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="color: #1a1a2e; font-size: 14px; margin: 0 0 8px 0;">
        <strong>Reason:</strong> #{html_escape(reason)}
      </p>
      <p style="color: #718096; font-size: 14px; margin: 0;">
        #{unlock_message}
      </p>
    </div>

    <div style="background-color: #fed7d7; border-left: 4px solid #e53e3e; padding: 16px; margin: 24px 0;">
      <p style="color: #742a2a; font-size: 14px; margin: 0;">
        <strong>Wasn't you?</strong> If you didn't attempt to log in, someone may be trying
        to access your account. We recommend changing your password after unlocking.
      </p>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="#{html_escape(support_url)}"
         style="background-color: #6366f1; color: white; padding: 14px 32px;
                border-radius: 8px; text-decoration: none; font-weight: 600;
                display: inline-block;">
        Contact Support
      </a>
    </div>
    """)
  end

  def render(:export_ready, data) do
    download_url = Map.get(data, :download_url, "#")
    expires_in = Map.get(data, :expires_in, "7 days")

    Layout.wrap_html_layout("""
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="font-size: 48px;">📦</div>
    </div>

    <h1 style="color: #1a1a2e; font-size: 28px; margin-bottom: 24px; text-align: center;">
      Your data export is ready
    </h1>

    <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
      Good news! Your CGraph data export has been generated and is ready for download.
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="#{html_escape(download_url)}"
         style="background-color: #10b981; color: white; padding: 14px 32px;
                border-radius: 8px; text-decoration: none; font-weight: 600;
                display: inline-block;">
        Download Export
      </a>
    </div>

    <p style="color: #718096; font-size: 14px; line-height: 1.6; text-align: center;">
      This download link will expire in <strong>#{html_escape(expires_in)}</strong>.
    </p>

    <div style="background-color: #ebf8ff; border-left: 4px solid #3182ce; padding: 16px; margin: 24px 0;">
      <p style="color: #2c5282; font-size: 14px; margin: 0;">
        <strong>What's included:</strong> Your profile data, messages, media files,
        and account settings in a portable format.
      </p>
    </div>
    """)
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

    trending_html =
      trending
      |> Enum.take(5)
      |> Enum.map(fn post ->
        title = html_escape(Map.get(post, :title, "Post"))
        replies = Map.get(post, :replies, 0)
        """
        <tr>
          <td style="padding: 10px 16px; color: #4a5568; font-size: 14px; border-bottom: 1px solid #e2e8f0;">
            #{title}
          </td>
          <td style="padding: 10px 16px; color: #6366f1; font-size: 14px; text-align: right; border-bottom: 1px solid #e2e8f0;">
            #{replies} replies
          </td>
        </tr>
        """
      end)
      |> Enum.join("")

    achievements_html =
      achievements
      |> Enum.take(3)
      |> Enum.map(fn a ->
        icon = Map.get(a, :icon, "🏆")
        title = html_escape(Map.get(a, :title, "Achievement"))
        xp = Map.get(a, :xp_reward, 0)
        """
        <div style="display: inline-block; text-align: center; margin: 8px 12px;">
          <div style="font-size: 32px;">#{icon}</div>
          <div style="color: #4a5568; font-size: 13px; margin-top: 4px;">#{title}</div>
          <div style="color: #6366f1; font-size: 12px;">+#{xp} XP</div>
        </div>
        """
      end)
      |> Enum.join("")

    Layout.wrap_html_layout("""
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="font-size: 48px;">📊</div>
    </div>

    <h1 style="color: #1a1a2e; font-size: 28px; margin-bottom: 8px; text-align: center;">
      Your #{html_escape(period)} Digest
    </h1>

    <p style="color: #718096; font-size: 14px; text-align: center; margin-bottom: 32px;">
      Hi #{html_escape(user_name)}, here's what happened on CGraph
    </p>

    <!-- Stats Cards -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
      <tr>
        <td style="padding: 8px;">
          <div style="background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%); border-radius: 12px; padding: 20px; text-align: center;">
            <div style="color: rgba(255,255,255,0.8); font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Messages</div>
            <div style="color: white; font-size: 28px; font-weight: 700; margin-top: 4px;">#{messages_sent}</div>
          </div>
        </td>
        <td style="padding: 8px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #34d399 100%); border-radius: 12px; padding: 20px; text-align: center;">
            <div style="color: rgba(255,255,255,0.8); font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">XP Earned</div>
            <div style="color: white; font-size: 28px; font-weight: 700; margin-top: 4px;">#{xp_earned}</div>
          </div>
        </td>
        <td style="padding: 8px;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); border-radius: 12px; padding: 20px; text-align: center;">
            <div style="color: rgba(255,255,255,0.8); font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Unread</div>
            <div style="color: white; font-size: 28px; font-weight: 700; margin-top: 4px;">#{unread}</div>
          </div>
        </td>
      </tr>
    </table>

    #{if trending_html != "" do
      """
      <h2 style="color: #1a1a2e; font-size: 18px; margin-bottom: 12px;">🔥 Trending Posts</h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
        #{trending_html}
      </table>
      """
    else
      ""
    end}

    #{if achievements_html != "" do
      """
      <h2 style="color: #1a1a2e; font-size: 18px; margin-bottom: 12px;">🏆 New Achievements</h2>
      <div style="background-color: #f7fafc; border-radius: 12px; padding: 16px; margin-bottom: 32px; text-align: center;">
        #{achievements_html}
      </div>
      """
    else
      ""
    end}

    <div style="text-align: center; margin: 32px 0;">
      <a href="#{html_escape(app_url)}/dashboard"
         style="background-color: #6366f1; color: white; padding: 14px 32px;
                border-radius: 8px; text-decoration: none; font-weight: 600;
                display: inline-block;">
        View Full Activity
      </a>
    </div>

    <p style="color: #a0aec0; font-size: 12px; text-align: center; margin-top: 24px;">
      <a href="#{html_escape(app_url)}/settings/notifications" style="color: #6366f1; text-decoration: none;">
        Manage digest preferences
      </a>
    </p>
    """)
  end

  # html_escape is imported from Layout, but we use it locally for string interpolation
  defp html_escape(value), do: Layout.html_escape(value)
end
