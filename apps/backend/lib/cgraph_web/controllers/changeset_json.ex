defmodule CGraphWeb.ChangesetJSON do
  @moduledoc """
  JSON view for rendering Ecto Changeset validation errors.

  Provides consistent error formatting for form validation failures
  across all API endpoints.
  """

  @doc """
  Renders changeset errors in a structured format.

  Returns a map with:
  - `error`: Human-readable error message
  - `message`: More detailed description
  - `details`: Field-specific error messages

  ## Example Response

      %{
        error: "Validation failed",
        message: "Please correct the errors below",
        details: %{
          email: ["has already been taken"],
          password: ["must contain at least one uppercase letter"]
        }
      }

  For simple custom message errors:

      %{
        error: "Validation failed",
        message: "Custom error message"
      }
  """
  @spec error(map()) :: map()
  def error(%{changeset: changeset}) do
    errors = Ecto.Changeset.traverse_errors(changeset, &translate_error/1)

    # Build a human-readable summary of the first error
    first_error = get_first_error(errors)

    %{
      error: "Validation failed",
      message: first_error || "Please correct the errors below",
      details: errors
    }
  end

  # Alternative clause for simple message errors
  def error(%{message: message}) do
    %{
      error: "Validation failed",
      message: message
    }
  end

  # Extract the first error message for a quick summary
  defp get_first_error(errors) when is_map(errors) do
    errors
    |> Enum.find(fn {_field, messages} -> messages != [] end)
    |> case do
      {field, [first_message | _]} ->
        humanize_field(field) <> " " <> first_message
      _ ->
        nil
    end
  end

  # Translate error messages with interpolation
  defp translate_error({msg, opts}) do
    Enum.reduce(opts, msg, fn {key, value}, acc ->
      String.replace(acc, "%{#{key}}", fn _ -> to_string(value) end)
    end)
  end

  # Convert field atom to human-readable string
  defp humanize_field(field) when is_atom(field) do
    field
    |> Atom.to_string()
    |> String.replace("_", " ")
    |> String.capitalize()
  end
end
