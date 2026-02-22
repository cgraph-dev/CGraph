defmodule CGraph.Mailer.Templates do
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

  def subject(:digest, data) do
    period = Map.get(data, :period, "Weekly")
    "Your CGraph #{period} Digest"
  end

  @doc """
  Renders an email template, returning {html_body, text_body}.
  """
  @spec render(atom() | String.t(), map()) :: {String.t(), String.t()}
  def render(email_type, data) when is_binary(email_type) do
    render(String.to_existing_atom(email_type), data)
  rescue
    ArgumentError -> render(:notification, data)
  end

  def render(email_type, data) when is_atom(email_type) do
    html = __MODULE__.HtmlRenderer.render(email_type, data)
    text = __MODULE__.TextRenderer.render(email_type, data)
    {html, text}
  end

  # ============================================================================
  # Shared Helpers
  # ============================================================================

  @doc false
  @spec security_alert_content(atom()) :: {String.t(), String.t(), String.t()}
  def security_alert_content(:new_device_login) do
    {
      "New device login detected",
      "A new device was used to sign in to your CGraph account.",
      "🔐"
    }
  end

  def security_alert_content(:password_changed) do
    {
      "Your password was changed",
      "The password for your CGraph account was recently changed.",
      "🔑"
    }
  end

  def security_alert_content(:email_changed) do
    {
      "Your email was changed",
      "The email address for your CGraph account was recently changed.",
      "📧"
    }
  end

  def security_alert_content(:two_factor_enabled) do
    {
      "Two-factor authentication enabled",
      "Two-factor authentication has been enabled on your CGraph account.",
      "🛡️"
    }
  end

  def security_alert_content(:two_factor_disabled) do
    {
      "Two-factor authentication disabled",
      "Two-factor authentication has been disabled on your CGraph account.",
      "⚠️"
    }
  end

  def security_alert_content(:suspicious_activity) do
    {
      "Suspicious activity detected",
      "We detected unusual activity on your CGraph account.",
      "🚨"
    }
  end

  def security_alert_content(_) do
    {
      "Security alert",
      "There was a security-related event on your CGraph account.",
      "🔔"
    }
  end
end
