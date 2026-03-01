defmodule CGraph.Mailer.Builder do
  @moduledoc """
  Email construction and enrichment for CGraph Mailer.

  Builds `Swoosh.Email` structs with proper sender, subject, body,
  provider options, tracking headers, and unsubscribe support.
  """

  import Swoosh.Email

  alias CGraph.Accounts.User
  alias CGraph.Mailer.Templates

  require Logger

  # Sender configuration
  @default_sender {"CGraph", "noreply@cgraph.app"}
  @security_sender {"CGraph Security", "security@cgraph.app"}

  @doc """
  Builds a complete `Swoosh.Email` for the given user and email type.

  Returns `{:ok, email}` or `{:error, {:template_error, exception}}`.
  """
  @spec build_email(User.t(), atom(), map(), keyword()) ::
          {:ok, Swoosh.Email.t()} | {:error, term()}
  def build_email(user, email_type, data, opts) do
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

  # ============================================================================
  # Sender Selection
  # ============================================================================

  defp get_sender(:security_alert), do: @security_sender
  defp get_sender(:account_locked), do: @security_sender
  defp get_sender(:password_reset), do: @security_sender
  defp get_sender(_), do: @default_sender

  # ============================================================================
  # Provider Options & Headers
  # ============================================================================

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

  defp add_unsubscribe_header(email, user, email_type) when email_type in [:notification, :digest] do
    base_url = Application.get_env(:cgraph, :base_url, "https://cgraph.app")
    unsubscribe_url = "#{base_url}/settings/notifications?user=#{user.id}"

    email
    |> header("List-Unsubscribe", "<#{unsubscribe_url}>")
    |> header("List-Unsubscribe-Post", "List-Unsubscribe=One-Click")
  end

  defp add_unsubscribe_header(email, _user, _email_type), do: email

  # ============================================================================
  # Utilities
  # ============================================================================

  defp generate_message_id do
    timestamp = System.system_time(:microsecond)
    random = :crypto.strong_rand_bytes(8) |> Base.url_encode64(padding: false)
    "#{timestamp}-#{random}@cgraph.app"
  end
end
