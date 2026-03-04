defmodule CGraphWeb.ErrorHelpers do
  @moduledoc """
  Safe error message formatting for API responses.

  Maps internal error reasons to user-friendly messages, preventing information
  leakage of Ecto changesets, Stripe API errors, and internal state.

  Internal error details are logged via Logger for debugging but never returned
  to the client.
  """

  require Logger

  @doc """
  Convert an internal error reason to a safe, user-facing string message.

  Logs the original error via Logger.error for debugging, then returns a
  sanitized message.

  ## Examples

      iex> safe_error_message(:not_found)
      "Resource not found"

      iex> safe_error_message(%Ecto.Changeset{})
      "Validation failed"

      iex> safe_error_message("some internal error")
      "An unexpected error occurred"
  """
  @spec safe_error_message(term(), keyword()) :: String.t()
  def safe_error_message(reason, opts \\ []) do
    context = Keyword.get(opts, :context, "operation")
    Logger.error("#{context}_failed", reason: inspect(reason))
    do_safe_message(reason)
  end

  # Known atom error codes
  defp do_safe_message(:not_found), do: "Resource not found"
  defp do_safe_message(:unauthorized), do: "Not authorized"
  defp do_safe_message(:forbidden), do: "Access denied"
  defp do_safe_message(:invalid_params), do: "Invalid parameters"
  defp do_safe_message(:invalid_input), do: "Invalid input"
  defp do_safe_message(:bad_request), do: "Bad request"
  defp do_safe_message(:conflict), do: "Resource already exists"
  defp do_safe_message(:timeout), do: "Request timed out"
  defp do_safe_message(:rate_limited), do: "Rate limit exceeded"
  defp do_safe_message(:insufficient_balance), do: "Insufficient balance"
  defp do_safe_message(:insufficient_funds), do: "Insufficient funds"
  defp do_safe_message(:below_minimum), do: "Below minimum threshold"
  defp do_safe_message(:account_not_active), do: "Account is not active"
  defp do_safe_message(:no_connect_account), do: "Payment account not set up"
  defp do_safe_message(:payout_already_pending), do: "A payout is already in progress"
  defp do_safe_message(:invalid_signature), do: "Invalid signature"
  defp do_safe_message(:invalid_chain_id), do: "Unsupported network"
  defp do_safe_message(:invalid_nonce), do: "Invalid or expired nonce"
  defp do_safe_message(:message_expired), do: "Message has expired"
  defp do_safe_message(:already_exists), do: "Resource already exists"
  defp do_safe_message(:already_subscribed), do: "Already subscribed"
  defp do_safe_message(:not_subscribed), do: "Not subscribed"
  defp do_safe_message(:invalid_bundle), do: "Invalid bundle selected"
  defp do_safe_message(:bundle_not_found), do: "Bundle not found"
  defp do_safe_message(:creator_not_found), do: "Creator not found"
  defp do_safe_message(:subscription_not_found), do: "Subscription not found"
  defp do_safe_message(:invalid_token), do: "Invalid token"
  defp do_safe_message(:token_expired), do: "Token has expired"
  defp do_safe_message(:export_in_progress), do: "A data export is already in progress"

  # Ecto changeset — extract field-level validation messages
  defp do_safe_message(%Ecto.Changeset{} = changeset) do
    errors =
      Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
        Regex.replace(~r"%{(\w+)}", msg, fn _, key ->
          opts |> Keyword.get(String.to_existing_atom(key), key) |> to_string()
        end)
      end)

    case Map.to_list(errors) do
      [{field, [message | _]} | _] -> "#{field} #{message}"
      _ -> "Validation failed"
    end
  end

  # String messages — pass through only if they don't contain internal details
  defp do_safe_message(reason) when is_binary(reason) do
    if safe_string?(reason) do
      reason
    else
      "An unexpected error occurred"
    end
  end

  # Atom errors not in the known list
  defp do_safe_message(reason) when is_atom(reason) do
    reason
    |> Atom.to_string()
    |> String.replace("_", " ")
    |> String.capitalize()
  end

  # Everything else (maps, tuples, structs, etc.)
  defp do_safe_message(_reason), do: "An unexpected error occurred"

  # Check if a string is safe (doesn't contain internal details)
  defp safe_string?(str) do
    not (String.contains?(str, "%{") or
           String.contains?(str, "Elixir.") or
           String.contains?(str, "#Ecto") or
           String.contains?(str, "Postgrex") or
           String.contains?(str, "DBConnection") or
           String.contains?(str, "** (") or
           String.length(str) > 200)
  end
end
