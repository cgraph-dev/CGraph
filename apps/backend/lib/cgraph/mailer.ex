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
  """

  use Swoosh.Mailer, otp_app: :cgraph

  import Swoosh.Email

  alias CGraph.Accounts.User
  alias CGraph.Mailer.Templates
  alias CGraph.Notifications.PushService.CircuitBreakers

  require Logger

  @type email_type :: :welcome | :verification | :password_reset | :notification |
                      :security_alert | :two_factor | :account_locked | :export_ready

  @type delivery_result :: {:ok, Swoosh.Email.t()} | {:error, term()}

  # Sender configuration
  @default_sender {"CGraph", "noreply@cgraph.app"}
  @security_sender {"CGraph Security", "security@cgraph.app"}

  @doc false
  # Wraps Swoosh deliver/1 behind the :mailer circuit breaker.
  # Returns {:error, :circuit_open} when the email provider is down,
  # preventing thundering-herd retries from overwhelming the provider.
  defp deliver_protected(email) do
    CircuitBreakers.call(:mailer, fn -> deliver(email) end)
  end

  # ============================================================================
  # Public API
  # ============================================================================

  @doc """
  Send an email with raw email data map.

  This is an alternative API for sending emails without a User struct,
  useful for system emails, digest emails, and other automated messages.

  ## Parameters

  - `email_data` - Map containing email configuration:
    - `:to` - Recipient email address (required)
    - `:subject` - Email subject (required)
    - `:template` - Template name (required)
    - `:assigns` - Map of template variables (optional)
    - `:from` - Sender tuple {name, email} (optional, uses default)

  ## Returns

  - `{:ok, email}` - Email was sent successfully
  - `{:error, reason}` - Email delivery failed

  ## Examples

      iex> CGraph.Mailer.send_email(%{
      ...>   to: "user@example.com",
      ...>   subject: "Your daily digest",
      ...>   template: "forum_digest",
      ...>   assigns: %{user_name: "John", items: [...]}
      ...> })
      {:ok, %Swoosh.Email{}}
  """
  @spec send_email(map()) :: delivery_result()
  def send_email(%{to: to, subject: subject, template: template} = email_data) do
    assigns = Map.get(email_data, :assigns, %{})
    from = Map.get(email_data, :from, @default_sender)

    try do
      email =
        new()
        |> to(to)
        |> from(from)
        |> subject(subject)
        |> html_body(render_template(template, assigns))
        |> text_body(render_text_template(template, assigns))

      case deliver_protected(email) do
        {:ok, _metadata} = _result ->
          Logger.info("email_sent", template: template, to: to)
          {:ok, email}
        {:error, reason} = err ->
          Logger.error("email_send_failed", template: template, to: to, reason: inspect(reason))
          err
      end
    rescue
      e ->
        Logger.error("email_send_error", error: inspect(e))
        {:error, {:send_failed, e}}
    end
  end

  def send_email(invalid_data) do
    Logger.error("email_invalid_data", data: inspect(invalid_data))
    {:error, :invalid_email_data}
  end

  @doc """
  Delivers an email to a user based on the email type.

  ## Parameters

  - `user` - The user to send the email to
  - `email_type` - The type of email template to use
  - `data` - Optional map of dynamic data for the template
  - `opts` - Optional keyword list of options

  ## Options

  - `:priority` - Email priority (:high, :normal, :low)
  - `:track_opens` - Whether to track email opens (default: true)
  - `:track_clicks` - Whether to track link clicks (default: true)
  - `:bypass_rate_limit` - Skip rate limiting (use for security emails)

  ## Returns

  - `{:ok, email}` - Email was queued successfully
  - `{:error, reason}` - Email delivery failed

  ## Examples

      iex> CGraph.Mailer.deliver_email(user, :welcome)
      {:ok, %Swoosh.Email{}}

      iex> CGraph.Mailer.deliver_email(user, :notification, %{title: "New Message"})
      {:ok, %Swoosh.Email{}}
  """
  @spec deliver_email(User.t(), email_type(), map(), keyword()) :: delivery_result()
  def deliver_email(%User{} = user, email_type, data \\ %{}, opts \\ []) do
    with :ok <- validate_user_email(user),
         :ok <- check_rate_limit(user, opts),
         {:ok, email} <- build_email(user, email_type, data, opts),
         {:ok, _metadata} <- do_deliver(email, email_type, user) do
      emit_telemetry(:sent, email_type, user)
      {:ok, email}
    else
      {:error, :no_email} ->
        Logger.warning("email_no_address", email_type: email_type, user_id: user.id)
        {:error, :no_email}

      {:error, :email_not_verified} = err when email_type not in [:verification, :welcome] ->
        Logger.debug("email_not_verified_skip", email_type: email_type, user_id: user.id)
        err

      {:error, :rate_limited} = err ->
        Logger.warning("email_rate_limited", email_type: email_type, user_id: user.id)
        emit_telemetry(:rate_limited, email_type, user)
        err

      {:error, reason} = err ->
        Logger.error("email_delivery_failed", email_type: email_type, user_id: user.id, reason: inspect(reason))
        emit_telemetry(:failed, email_type, user, %{reason: reason})
        err
    end
  end

  @doc """
  Delivers a welcome email to a new user.
  """
  @spec deliver_welcome_email(User.t()) :: delivery_result()
  def deliver_welcome_email(%User{} = user) do
    deliver_email(user, :welcome, %{
      username: user.username,
      display_name: user.display_name || user.username
    })
  end

  @doc """
  Delivers an email verification link to a user.
  """
  @spec deliver_verification_email(User.t(), String.t()) :: delivery_result()
  def deliver_verification_email(%User{} = user, verification_token) when is_binary(verification_token) do
    base_url = get_base_url()
    verification_url = "#{base_url}/verify-email?token=#{verification_token}"

    deliver_email(user, :verification, %{
      verification_url: verification_url,
      token: verification_token,
      expires_in: "24 hours"
    }, bypass_rate_limit: true)
  end

  @doc """
  Delivers a password reset email to a user.
  """
  @spec deliver_password_reset_email(User.t(), String.t()) :: delivery_result()
  def deliver_password_reset_email(%User{} = user, reset_token) when is_binary(reset_token) do
    base_url = get_base_url()
    reset_url = "#{base_url}/reset-password?token=#{reset_token}"

    deliver_email(user, :password_reset, %{
      reset_url: reset_url,
      token: reset_token,
      expires_in: "1 hour",
      ip_address: get_request_ip(),
      user_agent: get_user_agent()
    }, bypass_rate_limit: true, priority: :high)
  end

  @doc """
  Delivers a security alert email (login from new device, password change, etc).
  """
  @spec deliver_security_alert(User.t(), atom(), map()) :: delivery_result()
  def deliver_security_alert(%User{} = user, alert_type, details \\ %{}) do
    alert_data = Map.merge(%{
      alert_type: alert_type,
      timestamp: DateTime.utc_now() |> DateTime.to_iso8601(),
      ip_address: Map.get(details, :ip_address, "Unknown"),
      location: Map.get(details, :location, "Unknown"),
      device: Map.get(details, :device, "Unknown")
    }, details)

    deliver_email(user, :security_alert, alert_data, bypass_rate_limit: true, priority: :high)
  end

  @doc """
  Delivers a two-factor authentication code email.
  """
  @spec deliver_two_factor_email(User.t(), String.t()) :: delivery_result()
  def deliver_two_factor_email(%User{} = user, code) when is_binary(code) do
    deliver_email(user, :two_factor, %{
      code: code,
      expires_in: "5 minutes"
    }, bypass_rate_limit: true, priority: :high)
  end

  @doc """
  Delivers a notification email (message received, mention, etc).
  """
  @spec deliver_notification_email(User.t(), map()) :: delivery_result()
  def deliver_notification_email(%User{} = user, notification_data) do
    deliver_email(user, :notification, notification_data)
  end

  @doc """
  Delivers an account locked notification.
  """
  @spec deliver_account_locked_email(User.t(), map()) :: delivery_result()
  def deliver_account_locked_email(%User{} = user, details \\ %{}) do
    deliver_email(user, :account_locked, %{
      reason: Map.get(details, :reason, "Too many failed login attempts"),
      unlock_time: Map.get(details, :unlock_time),
      support_url: "#{get_base_url()}/support"
    }, bypass_rate_limit: true, priority: :high)
  end

  @doc """
  Delivers an email when data export is ready for download.
  """
  @spec deliver_export_ready_email(User.t(), String.t()) :: delivery_result()
  def deliver_export_ready_email(%User{} = user, download_url) do
    deliver_email(user, :export_ready, %{
      download_url: download_url,
      expires_in: "7 days"
    })
  end

  # ============================================================================
  # Email Building
  # ============================================================================

  defp build_email(user, email_type, data, opts) do
    sender = get_sender(email_type)
    subject = Templates.subject(email_type, data)
    {html_body, text_body} = Templates.render(email_type, data)

    email =
      new()
      |> from(sender)
      |> to({user.display_name || user.username, user.email})
      |> subject(subject)
      |> html_body(html_body)
      |> text_body(text_body)
      |> put_provider_options(email_type, opts)
      |> add_tracking_headers(user, email_type, opts)
      |> add_unsubscribe_header(user, email_type)

    {:ok, email}
  rescue
    e ->
      Logger.error("email_template_build_failed", email_type: email_type, error: inspect(e))
      {:error, {:template_error, e}}
  end

  defp get_sender(:security_alert), do: @security_sender
  defp get_sender(:account_locked), do: @security_sender
  defp get_sender(:password_reset), do: @security_sender
  defp get_sender(_), do: @default_sender

  defp put_provider_options(email, email_type, opts) do
    priority = Keyword.get(opts, :priority, :normal)
    track_opens = Keyword.get(opts, :track_opens, true)
    track_clicks = Keyword.get(opts, :track_clicks, true)

    # Provider-specific options (works with SendGrid, Mailgun, etc.)
    email
    |> put_provider_option(:track_opens, track_opens)
    |> put_provider_option(:track_clicks, track_clicks)
    |> put_provider_option(:category, Atom.to_string(email_type))
    |> maybe_set_priority(priority)
  end

  defp maybe_set_priority(email, :high) do
    email
    |> header("X-Priority", "1")
    |> header("X-MSMail-Priority", "High")
  end
  defp maybe_set_priority(email, _), do: email

  defp add_tracking_headers(email, user, email_type, _opts) do
    message_id = generate_message_id()

    email
    |> header("X-Message-ID", message_id)
    |> header("X-Email-Type", Atom.to_string(email_type))
    |> header("X-User-ID", user.id)
  end

  defp add_unsubscribe_header(email, user, email_type) when email_type in [:notification] do
    unsubscribe_url = "#{get_base_url()}/settings/notifications?user=#{user.id}"

    email
    |> header("List-Unsubscribe", "<#{unsubscribe_url}>")
    |> header("List-Unsubscribe-Post", "List-Unsubscribe=One-Click")
  end
  defp add_unsubscribe_header(email, _user, _email_type), do: email

  # ============================================================================
  # Email Delivery
  # ============================================================================

  defp do_deliver(email, email_type, user) do
    start_time = System.monotonic_time()

    case deliver_protected(email) do
      {:ok, metadata} ->
        duration = System.monotonic_time() - start_time

        Logger.info(
          "Email sent successfully",
          email_type: email_type,
          user_id: user.id,
          to: user.email,
          duration_ms: System.convert_time_unit(duration, :native, :millisecond)
        )

        {:ok, metadata}

      {:error, {_code, %{"errors" => errors}}} = _err ->
        Logger.error("email_provider_error", errors: inspect(errors))
        {:error, {:provider_error, errors}}

      {:error, reason} = err ->
        Logger.error("email_delivery_error", reason: inspect(reason))
        err
    end
  end

  # ============================================================================
  # Validation & Rate Limiting
  # ============================================================================

  defp validate_user_email(%User{email: nil}), do: {:error, :no_email}
  defp validate_user_email(%User{email: ""}), do: {:error, :no_email}
  defp validate_user_email(%User{email_verified_at: nil, email: _}), do: {:error, :email_not_verified}
  defp validate_user_email(%User{}), do: :ok

  defp check_rate_limit(user, opts) do
    if Keyword.get(opts, :bypass_rate_limit, false) do
      :ok
    else
      # Rate limit emails: 10 per hour per user (ETS-based)
      key = {:email_rate, user.id}
      now = System.system_time(:second)
      window = 3600  # 1 hour
      limit = 10

      try do
        case :ets.lookup(:email_rate_limits, key) do
          [{^key, count, window_start}] when now - window_start < window ->
            if count < limit do
              :ets.insert(:email_rate_limits, {key, count + 1, window_start})
              :ok
            else
              Logger.warning("email_rate_limit_exceeded", user_id: user.id)
              {:error, :rate_limited}
            end

          _ ->
            :ets.insert(:email_rate_limits, {key, 1, now})
            :ok
        end
      rescue
        ArgumentError ->
          # Table doesn't exist yet, create it and allow
          :ets.new(:email_rate_limits, [:set, :named_table, :public])
          :ets.insert(:email_rate_limits, {key, 1, now})
          :ok
      end
    end
  end

  # ============================================================================
  # Telemetry & Utilities
  # ============================================================================

  defp emit_telemetry(event, email_type, user, metadata \\ %{}) do
    :telemetry.execute(
      [:cgraph, :mailer, event],
      %{count: 1, timestamp: System.system_time(:millisecond)},
      Map.merge(metadata, %{
        email_type: email_type,
        user_id: user.id
      })
    )
  end

  defp generate_message_id do
    timestamp = System.system_time(:microsecond)
    random = :crypto.strong_rand_bytes(8) |> Base.url_encode64(padding: false)
    "#{timestamp}-#{random}@cgraph.app"
  end

  defp get_base_url do
    Application.get_env(:cgraph, :base_url, "https://cgraph.app")
  end

  defp get_request_ip do
    # In production, this would be passed from the request context
    Process.get(:request_ip, "Unknown")
  end

  defp get_user_agent do
    # In production, this would be passed from the request context
    Process.get(:user_agent, "Unknown")
  end

  # ============================================================================
  # Template Rendering (for send_email/1 API)
  # ============================================================================

  defp render_template(template_name, assigns) when is_binary(template_name) do
    case Code.ensure_loaded(CGraph.Mailer.Templates) do
      {:module, templates_module} ->
        if function_exported?(templates_module, :render, 2) do
          case templates_module.render(template_name, assigns) do
            {html, _text} -> html
            html when is_binary(html) -> html
          end
        else
          render_basic_html(template_name, assigns)
        end
      {:error, _} ->
        render_basic_html(template_name, assigns)
    end
  end

  defp render_text_template(template_name, assigns) when is_binary(template_name) do
    case Code.ensure_loaded(CGraph.Mailer.Templates) do
      {:module, templates_module} ->
        if function_exported?(templates_module, :render, 2) do
          case templates_module.render(template_name, assigns) do
            {_html, text} -> text
            text when is_binary(text) -> text
          end
        else
          render_basic_text(template_name, assigns)
        end
      {:error, _} ->
        render_basic_text(template_name, assigns)
    end
  end

  defp render_basic_html(template_name, assigns) do
    user_name = Map.get(assigns, :user_name, "User")
    content = format_assigns_as_html(assigns)

    """
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>CGraph - #{template_name}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h1 style="color: #10B981; margin-bottom: 20px;">CGraph</h1>
        <p>Hello #{user_name},</p>
        #{content}
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">This email was sent by CGraph. If you have any questions, please contact support.</p>
      </div>
    </body>
    </html>
    """
  end

  defp render_basic_text(template_name, assigns) do
    user_name = Map.get(assigns, :user_name, "User")
    content = format_assigns_as_text(assigns)

    """
    CGraph - #{template_name}

    Hello #{user_name},

    #{content}

    ---
    This email was sent by CGraph. If you have any questions, please contact support.
    """
  end

  defp format_assigns_as_html(assigns) do
    assigns
    |> Map.drop([:user_name])
    |> Enum.map_join("\n", fn {key, value} ->
      "<p><strong>#{key}:</strong> #{format_value(value)}</p>"
    end)
  end

  defp format_assigns_as_text(assigns) do
    assigns
    |> Map.drop([:user_name])
    |> Enum.map_join("\n", fn {key, value} -> "#{key}: #{format_value(value)}" end)
  end

  defp format_value(value) when is_list(value), do: "#{length(value)} items"
  defp format_value(value) when is_map(value), do: inspect(value, limit: 50)
  defp format_value(value), do: to_string(value)
end
