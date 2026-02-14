defmodule CGraphWeb.ErrorJSON do
  @moduledoc """
  JSON error views for API responses.
  """

  @default_code "unknown_error"
  @default_message "An unexpected error occurred"

  def envelope(code, message, details \\ nil) do
    %{
      error: %{
        code: code || @default_code,
        message: message || @default_message,
        details: details
      }
    }
  end

  # Render changeset errors
  def error(%{changeset: changeset}) do
    envelope("validation_error", "Validation failed", Ecto.Changeset.traverse_errors(changeset, &translate_error/1))
  end

  # Render with custom message
  def error(%{message: message}) do
    envelope(nil, message)
  end

  # Render with error key (used by some plugs like RequireAdmin)
  def error(%{error: message}) when is_binary(message) do
    envelope(nil, message)
  end

  # Render with code, message and details (for tier limits, etc.)
  def error(%{code: code, message: message, details: details}) do
    envelope(code, message, details)
  end

  # Standard HTTP error codes
  def render("400.json", _assigns) do
    envelope("bad_request", "Bad request")
  end

  def render("401.json", _assigns) do
    envelope("unauthorized", "Unauthorized")
  end

  def render("403.json", _assigns) do
    envelope("forbidden", "Forbidden")
  end

  def render("404.json", _assigns) do
    envelope("not_found", "Not found")
  end

  def render("422.json", _assigns) do
    envelope("unprocessable_entity", "Unprocessable entity")
  end

  def render("500.json", _assigns) do
    envelope("internal_error", "Internal server error")
  end

  # Catch-all for undefined templates
  def render(template, _assigns) do
    status = template |> String.split(".") |> List.first()
    envelope("error_#{status}", "Error #{status}")
  end

  # Translate Ecto changeset errors
  defp translate_error({msg, opts}) do
    # Interpolate error message with options
    Enum.reduce(opts, msg, fn {key, value}, acc ->
      String.replace(acc, "%{#{key}}", fn _ -> to_string(value) end)
    end)
  end
end
