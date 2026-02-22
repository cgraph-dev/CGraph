defmodule CGraph.Accounts.User.Helpers do
  @moduledoc """
  Utility and helper functions for `CGraph.Accounts.User`.

  Provides password verification, display-ID formatting, and username
  change cooldown checks.
  """

  alias CGraph.Accounts.User

  # 14 days in seconds for username change cooldown
  @username_change_cooldown_days 14

  # ---------------------------------------------------------------------------
  # Password Verification
  # ---------------------------------------------------------------------------

  @doc """
  Verify a user's password against the stored Argon2 hash.

  Returns `false` when either the hash or password is nil/non-binary.
  """
  @spec valid_password?(User.t(), String.t()) :: boolean()
  def valid_password?(%User{password_hash: hash}, password)
      when is_binary(hash) and is_binary(password) do
    Argon2.verify_pass(password, hash)
  end
  def valid_password?(_, _), do: false

  # ---------------------------------------------------------------------------
  # Display ID
  # ---------------------------------------------------------------------------

  @doc """
  Formats UID as display string (e.g., #4829173650).

  Uses the random 10-digit UID for security (non-enumerable).
  Falls back to legacy `user_id` if `uid` is not yet set.
  """
  @spec format_user_id(User.t()) :: String.t() | nil
  def format_user_id(%User{uid: uid}) when is_binary(uid) and uid != "", do: "#" <> uid
  def format_user_id(%User{user_id: user_id}) when is_integer(user_id) do
    # Legacy fallback for users before migration
    "#" <> String.pad_leading(Integer.to_string(user_id), 4, "0")
  end
  def format_user_id(_), do: nil

  # ---------------------------------------------------------------------------
  # Username Cooldown
  # ---------------------------------------------------------------------------

  @doc """
  Returns `true` if the user can change their username (14-day cooldown elapsed).
  """
  @spec can_change_username?(User.t()) :: boolean()
  def can_change_username?(%User{username_changed_at: nil}), do: true
  def can_change_username?(%User{username_changed_at: last_changed}) do
    cooldown_end = DateTime.add(last_changed, @username_change_cooldown_days * 24 * 60 * 60, :second)
    DateTime.compare(DateTime.truncate(DateTime.utc_now(), :second), cooldown_end) != :lt
  end

  @doc """
  Returns the `DateTime` when the user can next change their username, or `nil`.
  """
  @spec next_username_change_date(User.t()) :: DateTime.t() | nil
  def next_username_change_date(%User{username_changed_at: nil}), do: nil
  def next_username_change_date(%User{username_changed_at: last_changed}) do
    DateTime.add(last_changed, @username_change_cooldown_days * 24 * 60 * 60, :second)
  end
end
