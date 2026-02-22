defmodule CGraph.Mailer.Renderer do
  @moduledoc """
  Fallback template rendering for the `send_email/1` API.

  When email templates are referenced by string name (rather than atom
  handled by `CGraph.Mailer.Templates`), this module provides basic
  HTML and plain-text rendering with dynamic assigns.
  """

  @doc """
  Renders an HTML template by name, falling back to a basic layout
  when `CGraph.Mailer.Templates` does not handle the template.
  """
  @spec render_template(String.t(), map()) :: String.t()
  def render_template(template_name, assigns) when is_binary(template_name) do
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

  @doc """
  Renders a plain-text template by name, falling back to a basic layout
  when `CGraph.Mailer.Templates` does not handle the template.
  """
  @spec render_text_template(String.t(), map()) :: String.t()
  def render_text_template(template_name, assigns) when is_binary(template_name) do
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

  # ============================================================================
  # Basic fallback renderers
  # ============================================================================

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
