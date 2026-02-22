defmodule CGraph.Mailer.Delivery do
  @moduledoc """
  Core email delivery logic for CGraph Mailer.

  Handles sending emails via the map-based and user-based APIs,
  validation, rate limiting, circuit-breaker delivery, telemetry,
  and utility helpers.

  All public functions are delegated from `CGraph.Mailer` to keep the
  external API unchanged.
  """

  import Swoosh.Email

  alias CGraph.Accounts.User
  alias CGraph.Mailer.{Builder, Renderer}
  alias CGraph.Notifications.PushService.CircuitBreakers

  require Logger

  @default_sender {"CGraph", "noreply@cgraph.app"}

  # ============================================================================
  # Map-based send API
  # ============================================================================

  @doc """
  Send an email with a raw email data map.

  ## Parameters

  - `email_data` - Map containing `:to`, `:subject`, `:template`, and
    optionally `:assigns` and `:from`.

  ## Returns

  - `{:ok, email}` on success
  - `{:error, reason}` on failure
  """
  @spec send_email(map()) :: CGraph.Mailer.delivery_result()
  def send_email(%{to: to, subject: subject, template: template} = email_data) do
    assigns = Map.get(email_data, :assigns, %{})
    from = Map.get(email_data, :from, @default_sender)

    try do
      email =
        new()
        |> to(to)
        |> from(from)
        |> subject(subject)
        |> html_body(Renderer.render_template(template, assigns))
        |> text_body(Renderer.render_text_template(template, assigns))

      case deliver_protected(email) do
        {:ok, _metadata} = _result ->
          Logger.info("email_sent", template: template, to: to)
          {:ok, email}

        {:error, reason} = err ->
          Logger.error("email_send_failed",
            template: template,
            to: to,
            reason: inspect(reason)
          )

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

  # ============================================================================
  # User-based deliver API
  # ============================================================================

  @doc """
  Delivers an email to a user based on the email type.

  Called from `CGraph.Mailer.deliver_email/4` (which handles defaults).
  """
  @spec deliver_email(User.t(), CGraph.Mailer.email_type(), map(), keyword()) ::
          CGraph.Mailer.delivery_result()
  def deliver_email(%User{} = user, email_type, data, opts) do
    with :ok <- validate_user_email(user),
         :ok <- check_rate_limit(user, opts),
         {:ok, email} <- Builder.build_email(user, email_type, data, opts),
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
        Logger.error("email_delivery_failed",
          email_type: email_type,
          user_id: user.id,
          reason: inspect(reason)
        )

        emit_telemetry(:failed, email_type, user, %{reason: reason})
        err
    end
  end

  # ============================================================================
  # Convenience delivery functions
  # ============================================================================

  @doc "Delivers a welcome email to a new user."
  @spec deliver_welcome_email(User.t()) :: CGraph.Mailer.delivery_result()
  def deliver_welcome_email(%User{} = user) do
    deliver_email(user, :welcome, %{
      username: user.username,
      display_name: user.display_name || user.username
    }, [])
  end

  @doc "Delivers an email verification link to a user."
  @spec deliver_verification_email(User.t(), String.t()) :: CGraph.Mailer.delivery_result()
  def deliver_verification_email(%User{} = user, verification_token)
      when is_binary(verification_token) do
    base_url = get_base_url()
    verification_url = "#{base_url}/verify-email?token=#{verification_token}"

    deliver_email(
      user,
      :verification,
      %{
        verification_url: verification_url,
        token: verification_token,
        expires_in: "24 hours"
      },
      bypass_rate_limit: true
    )
  end

  @doc "Delivers a password reset email to a user."
  @spec deliver_password_reset_email(User.t(), String.t()) :: CGraph.Mailer.delivery_result()
  def deliver_password_reset_email(%User{} = user, reset_token)
      when is_binary(reset_token) do
    base_url = get_base_url()
    reset_url = "#{base_url}/reset-password?token=#{reset_token}"

    deliver_email(
      user,
      :password_reset,
      %{
        reset_url: reset_url,
        token: reset_token,
        expires_in: "1 hour",
        ip_address: get_request_ip(),
        user_agent: get_user_agent()
      },
      bypass_rate_limit: true,
      priority: :high
    )
  end

  @doc "Delivers a security alert email."
  @spec deliver_security_alert(User.t(), atom(), map()) :: CGraph.Mailer.delivery_result()
  def deliver_security_alert(%User{} = user, alert_type, details) do
    alert_data =
      Map.merge(
        %{
          alert_type: alert_type,
          timestamp: DateTime.utc_now() |> DateTime.to_iso8601(),
          ip_address: Map.get(details, :ip_address, "Unknown"),
          location: Map.get(details, :location, "Unknown"),
          device: Map.get(details, :device, "Unknown")
        },
        details
      )

    deliver_email(user, :security_alert, alert_data, bypass_rate_limit: true, priority: :high)
  end

  @doc "Delivers a two-factor authentication code email."
  @spec deliver_two_factor_email(User.t(), String.t()) :: CGraph.Mailer.delivery_result()
  def deliver_two_factor_email(%User{} = user, code) when is_binary(code) do
    deliver_email(
      user,
      :two_factor,
      %{code: code, expires_in: "5 minutes"},
      bypass_rate_limit: true,
      priority: :high
    )
  end

  @doc "Delivers a notification email."
  @spec deliver_notification_email(User.t(), map()) :: CGraph.Mailer.delivery_result()
  def deliver_notification_email(%User{} = user, notification_data) do
    deliver_email(user, :notification, notification_data, [])
  end

  @doc "Delivers an account locked notification."
  @spec deliver_account_locked_email(User.t(), map()) :: CGraph.Mailer.delivery_result()
  def deliver_account_locked_email(%User{} = user, details) do
    deliver_email(
      user,
      :account_locked,
      %{
        reason: Map.get(details, :reason, "Too many failed login attempts"),
        unlock_time: Map.get(details, :unlock_time),
        support_url: "#{get_base_url()}/support"
      },
      bypass_rate_limit: true,
      priority: :high
    )
  end

  @doc "Delivers an email when data export is ready for download."
  @spec deliver_export_ready_email(User.t(), String.t()) :: CGraph.Mailer.delivery_result()
  def deliver_export_ready_email(%User{} = user, download_url) do
    deliver_email(user, :export_ready, %{download_url: download_url, expires_in: "7 days"}, [])
  end

  # ============================================================================
  # Email Delivery (private)
  # ============================================================================

  defp deliver_protected(email) do
    CircuitBreakers.call(:mailer, fn -> CGraph.Mailer.deliver(email) end)
  end

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

  defp validate_user_email(%User{email_verified_at: nil, email: _}),
    do: {:error, :email_not_verified}

  defp validate_user_email(%User{}), do: :ok

  defp check_rate_limit(user, opts) do
    if Keyword.get(opts, :bypass_rate_limit, false) do
      :ok
    else
      # Rate limit emails: 10 per hour per user (ETS-based)
      key = {:email_rate, user.id}
      now = System.system_time(:second)
      window = 3600
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

  defp get_base_url do
    Application.get_env(:cgraph, :base_url, "https://cgraph.app")
  end

  defp get_request_ip do
    Process.get(:request_ip, "Unknown")
  end

  defp get_user_agent do
    Process.get(:user_agent, "Unknown")
  end
end
