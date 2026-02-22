defmodule CGraph.Mailer do
  @moduledoc """
  CGraph Mailer - Enterprise-grade email delivery system.

  This module provides a comprehensive email sending infrastructure with:
  - Multiple provider support (SendGrid, Mailgun, Resend, SES)
  - Template-based emails with dynamic content
  - Automatic retry with exponential backoff
  - Rate limiting to prevent API throttling
  - Email tracking and delivery confirmation
  - Comprehensive logging and telemetry

  ## Configuration

  Configure the mailer in your config files:

      config :cgraph, CGraph.Mailer,
        adapter: Swoosh.Adapters.SendGrid,
        api_key: System.get_env("SENDGRID_API_KEY"),
        domain: "mail.cgraph.app"

  ## Usage

      # Send a simple email
      CGraph.Mailer.deliver_email(user, :welcome)

      # Send with custom data
      CGraph.Mailer.deliver_email(user, :notification, %{
        title: "New Message",
        body: "You have a new message from John"
      })

  ## Architecture

  Implementation is split across submodules:

  - `CGraph.Mailer.Delivery` — core send/deliver logic, validation, rate limiting
  - `CGraph.Mailer.Builder` — email construction, headers, provider options
  - `CGraph.Mailer.Renderer` — fallback template rendering for `send_email/1`
  - `CGraph.Mailer.Templates` — named email templates
  """

  use Swoosh.Mailer, otp_app: :cgraph

  alias CGraph.Accounts.User
  alias CGraph.Mailer.Delivery

  @type email_type ::
          :welcome
          | :verification
          | :password_reset
          | :notification
          | :security_alert
          | :two_factor
          | :account_locked
          | :export_ready

  @type delivery_result :: {:ok, Swoosh.Email.t()} | {:error, term()}

  # ============================================================================
  # Delegates — functions without default arguments
  # ============================================================================

  defdelegate send_email(email_data), to: Delivery
  defdelegate deliver_welcome_email(user), to: Delivery
  defdelegate deliver_verification_email(user, token), to: Delivery
  defdelegate deliver_password_reset_email(user, token), to: Delivery
  defdelegate deliver_two_factor_email(user, code), to: Delivery
  defdelegate deliver_notification_email(user, notification_data), to: Delivery
  defdelegate deliver_export_ready_email(user, download_url), to: Delivery

  # ============================================================================
  # Wrappers — functions with default arguments
  # ============================================================================

  @doc """
  Delivers an email to a user based on the email type.

  ## Options

  - `:priority` — `:high`, `:normal`, `:low`
  - `:track_opens` — track opens (default `true`)
  - `:track_clicks` — track clicks (default `true`)
  - `:bypass_rate_limit` — skip rate limiting (for security emails)
  """
  @spec deliver_email(User.t(), email_type(), map(), keyword()) :: delivery_result()
  def deliver_email(%User{} = user, email_type, data \\ %{}, opts \\ []) do
    Delivery.deliver_email(user, email_type, data, opts)
  end

  @doc "Delivers a security alert email."
  @spec deliver_security_alert(User.t(), atom(), map()) :: delivery_result()
  def deliver_security_alert(%User{} = user, alert_type, details \\ %{}) do
    Delivery.deliver_security_alert(user, alert_type, details)
  end

  @doc "Delivers an account locked notification."
  @spec deliver_account_locked_email(User.t(), map()) :: delivery_result()
  def deliver_account_locked_email(%User{} = user, details \\ %{}) do
    Delivery.deliver_account_locked_email(user, details)
  end
end
