defmodule CGraph.Mailer.Templates.Layout do
  @moduledoc false

  @doc false
  def wrap_html_layout(content) do
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

  @doc false
  def html_escape(nil), do: ""
  def html_escape(text) when is_binary(text) do
    text
    |> String.replace("&", "&amp;")
    |> String.replace("<", "&lt;")
    |> String.replace(">", "&gt;")
    |> String.replace("\"", "&quot;")
    |> String.replace("'", "&#39;")
  end
  def html_escape(other), do: html_escape(to_string(other))
end
