defmodule CgraphWeb.ErrorJSON do
  @moduledoc """
  JSON error views for API responses.
  """

  # Render changeset errors
  def error(%{changeset: changeset}) do
    %{
      error: %{
        message: "Validation failed",
        details: Ecto.Changeset.traverse_errors(changeset, &translate_error/1)
      }
    }
  end

  # Render with custom message
  def error(%{message: message}) do
    %{error: %{message: message}}
  end

  # Render with code, message and details (for tier limits, etc.)
  def error(%{code: code, message: message, details: details}) do
    %{error: %{code: code, message: message, details: details}}
  end

  # Standard HTTP error codes
  def render("400.json", _assigns) do
    %{error: %{message: "Bad request"}}
  end

  def render("401.json", _assigns) do
    %{error: %{message: "Unauthorized"}}
  end

  def render("403.json", _assigns) do
    %{error: %{message: "Forbidden"}}
  end

  def render("404.json", _assigns) do
    %{error: %{message: "Not found"}}
  end

  def render("422.json", _assigns) do
    %{error: %{message: "Unprocessable entity"}}
  end

  def render("500.json", _assigns) do
    %{error: %{message: "Internal server error"}}
  end

  # Catch-all for undefined templates
  def render(template, _assigns) do
    status = template |> String.split(".") |> List.first()
    %{error: %{message: "Error #{status}"}}
  end

  # Translate Ecto changeset errors
  defp translate_error({msg, opts}) do
    # Interpolate error message with options
    Enum.reduce(opts, msg, fn {key, value}, acc ->
      String.replace(acc, "%{#{key}}", fn _ -> to_string(value) end)
    end)
  end
end
