defmodule Cgraph.Mailer.Templates do
  @moduledoc """
  Email templates for CGraph mailer.
  
  Provides both HTML and plain text versions of all email templates
  with dynamic content interpolation.
  
  Templates are designed to be:
  - Responsive for mobile devices
  - Accessible (proper contrast, semantic HTML)
  - Compatible with major email clients
  - Branded consistently with CGraph design
  """
  
  @doc """
  Returns the subject line for an email type.
  """
  @spec subject(atom(), map()) :: String.t()
  def subject(:welcome, data) do
    name = Map.get(data, :display_name) || Map.get(data, :username, "there")
    "Welcome to CGraph, #{name}! 🎉"
  end
  
  def subject(:verification, _data) do
    "Verify your CGraph email address"
  end
  
  def subject(:password_reset, _data) do
    "Reset your CGraph password"
  end
  
  def subject(:security_alert, data) do
    alert_type = Map.get(data, :alert_type, :unknown)
    case alert_type do
      :new_device_login -> "New device login to your CGraph account"
      :password_changed -> "Your CGraph password was changed"
      :email_changed -> "Your CGraph email was changed"
      :two_factor_enabled -> "Two-factor authentication enabled"
      :two_factor_disabled -> "Two-factor authentication disabled"
      :suspicious_activity -> "Suspicious activity detected on your account"
      _ -> "Security alert for your CGraph account"
    end
  end
  
  def subject(:two_factor, _data) do
    "Your CGraph verification code"
  end
  
  def subject(:notification, data) do
    title = Map.get(data, :title, "New notification")
    "CGraph: #{title}"
  end
  
  def subject(:account_locked, _data) do
    "Your CGraph account has been locked"
  end
  
  def subject(:export_ready, _data) do
    "Your CGraph data export is ready"
  end
  
  @doc """
  Renders an email template, returning {html_body, text_body}.
  """
  @spec render(atom(), map()) :: {String.t(), String.t()}
  def render(email_type, data) do
    html = render_html(email_type, data)
    text = render_text(email_type, data)
    {html, text}
  end
  
  # ============================================================================
  # HTML Templates
  # ============================================================================
  
  defp render_html(:welcome, data) do
    username = Map.get(data, :username, "there")
    display_name = Map.get(data, :display_name, username)
    
    wrap_html_layout("""
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
  
  defp render_html(:verification, data) do
    verification_url = Map.get(data, :verification_url, "#")
    expires_in = Map.get(data, :expires_in, "24 hours")
    
    wrap_html_layout("""
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
  
  defp render_html(:password_reset, data) do
    reset_url = Map.get(data, :reset_url, "#")
    expires_in = Map.get(data, :expires_in, "1 hour")
    ip_address = Map.get(data, :ip_address, "Unknown")
    
    wrap_html_layout("""
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
  
  defp render_html(:security_alert, data) do
    alert_type = Map.get(data, :alert_type, :unknown)
    timestamp = Map.get(data, :timestamp, DateTime.utc_now() |> DateTime.to_iso8601())
    ip_address = Map.get(data, :ip_address, "Unknown")
    location = Map.get(data, :location, "Unknown")
    device = Map.get(data, :device, "Unknown")
    
    {title, description, icon} = security_alert_content(alert_type)
    
    wrap_html_layout("""
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
  
  defp render_html(:two_factor, data) do
    code = Map.get(data, :code, "000000")
    expires_in = Map.get(data, :expires_in, "5 minutes")
    
    wrap_html_layout("""
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
  
  defp render_html(:notification, data) do
    title = Map.get(data, :title, "New notification")
    body = Map.get(data, :body, "")
    action_url = Map.get(data, :action_url, "https://cgraph.app")
    action_text = Map.get(data, :action_text, "View in CGraph")
    
    wrap_html_layout("""
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
  
  defp render_html(:account_locked, data) do
    reason = Map.get(data, :reason, "Too many failed login attempts")
    unlock_time = Map.get(data, :unlock_time)
    support_url = Map.get(data, :support_url, "https://cgraph.app/support")
    
    unlock_message = if unlock_time do
      "Your account will be automatically unlocked at #{html_escape(unlock_time)}."
    else
      "Please contact support to unlock your account."
    end
    
    wrap_html_layout("""
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
  
  defp render_html(:export_ready, data) do
    download_url = Map.get(data, :download_url, "#")
    expires_in = Map.get(data, :expires_in, "7 days")
    
    wrap_html_layout("""
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
  
  # ============================================================================
  # Text Templates (Fallback for email clients without HTML support)
  # ============================================================================
  
  defp render_text(:welcome, data) do
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
  
  defp render_text(:verification, data) do
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
  
  defp render_text(:password_reset, data) do
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
  
  defp render_text(:security_alert, data) do
    alert_type = Map.get(data, :alert_type, :unknown)
    timestamp = Map.get(data, :timestamp, DateTime.utc_now() |> DateTime.to_iso8601())
    ip_address = Map.get(data, :ip_address, "Unknown")
    location = Map.get(data, :location, "Unknown")
    device = Map.get(data, :device, "Unknown")
    
    {title, description, _icon} = security_alert_content(alert_type)
    
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
  
  defp render_text(:two_factor, data) do
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
  
  defp render_text(:notification, data) do
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
  
  defp render_text(:account_locked, data) do
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
  
  defp render_text(:export_ready, data) do
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
  
  # ============================================================================
  # Helpers
  # ============================================================================
  
  defp wrap_html_layout(content) do
    """
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>CGraph</title>
      <!--[if mso]>
      <noscript>
        <xml>
          <o:OfficeDocumentSettings>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
      </noscript>
      <![endif]-->
    </head>
    <body style="margin: 0; padding: 0; background-color: #f7fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f7fafc;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
              <!-- Header -->
              <tr>
                <td align="center" style="padding-bottom: 32px;">
                  <a href="https://cgraph.app" style="text-decoration: none;">
                    <span style="font-size: 32px; font-weight: bold; color: #6366f1;">CGraph</span>
                  </a>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                  #{content}
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td align="center" style="padding-top: 32px;">
                  <p style="color: #a0aec0; font-size: 12px; line-height: 1.6; margin: 0 0 8px 0;">
                    © #{DateTime.utc_now().year} CGraph. All rights reserved.
                  </p>
                  <p style="color: #a0aec0; font-size: 12px; line-height: 1.6; margin: 0;">
                    <a href="https://cgraph.app/privacy" style="color: #718096;">Privacy Policy</a> • 
                    <a href="https://cgraph.app/terms" style="color: #718096;">Terms of Service</a> • 
                    <a href="https://cgraph.app/settings/notifications" style="color: #718096;">Unsubscribe</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """
  end
  
  defp security_alert_content(:new_device_login) do
    {
      "New device login detected",
      "A new device was used to sign in to your CGraph account.",
      "🔐"
    }
  end
  
  defp security_alert_content(:password_changed) do
    {
      "Your password was changed",
      "The password for your CGraph account was recently changed.",
      "🔑"
    }
  end
  
  defp security_alert_content(:email_changed) do
    {
      "Your email was changed",
      "The email address for your CGraph account was recently changed.",
      "📧"
    }
  end
  
  defp security_alert_content(:two_factor_enabled) do
    {
      "Two-factor authentication enabled",
      "Two-factor authentication has been enabled on your CGraph account.",
      "🛡️"
    }
  end
  
  defp security_alert_content(:two_factor_disabled) do
    {
      "Two-factor authentication disabled",
      "Two-factor authentication has been disabled on your CGraph account.",
      "⚠️"
    }
  end
  
  defp security_alert_content(:suspicious_activity) do
    {
      "Suspicious activity detected",
      "We detected unusual activity on your CGraph account.",
      "🚨"
    }
  end
  
  defp security_alert_content(_) do
    {
      "Security alert",
      "There was a security-related event on your CGraph account.",
      "🔔"
    }
  end
  
  defp html_escape(nil), do: ""
  defp html_escape(text) when is_binary(text) do
    text
    |> String.replace("&", "&amp;")
    |> String.replace("<", "&lt;")
    |> String.replace(">", "&gt;")
    |> String.replace("\"", "&quot;")
    |> String.replace("'", "&#39;")
  end
  defp html_escape(other), do: html_escape(to_string(other))
end
