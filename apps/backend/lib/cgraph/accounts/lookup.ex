defmodule CGraph.Accounts.Lookup do
  @moduledoc """
  User lookup functions for the Accounts context.

  Provides various ways to find users: by email, OAuth provider,
  UID, Stripe customer/subscription ID, and friend suggestion management.
  """

  import Ecto.Query, warn: false

  alias CGraph.Accounts.User
  alias CGraph.Repo

  # ---------------------------------------------------------------------------
  # Email & OAuth Lookups
  # ---------------------------------------------------------------------------

  @doc """
  Get user by email.
  """
  @spec get_user_by_email(String.t()) :: {:ok, struct()} | {:error, :not_found}
  def get_user_by_email(email) do
    case Repo.get_by(User, email: String.downcase(email)) do
      nil -> {:error, :not_found}
      user -> {:ok, user}
    end
  end

  @doc """
  Get user by OAuth provider and UID.
  Returns the user if found, nil otherwise.
  """
  @spec get_user_by_oauth(String.t(), String.t()) :: struct() | nil
  def get_user_by_oauth(provider, uid) when is_binary(provider) and is_binary(uid) do
    Repo.get_by(User, oauth_provider: provider, oauth_uid: uid)
  end

  # ---------------------------------------------------------------------------
  # UID / Legacy User ID Lookups
  # ---------------------------------------------------------------------------

  @doc """
  Get a user by their UID (random 10-digit string).
  Handles formats like "#4829173650" or "4829173650".
  Also supports legacy numeric user_id for backward compatibility.
  """
  @spec get_user_by_user_id(binary() | integer()) :: {:ok, struct()} | {:error, :not_found}
  def get_user_by_user_id(uid_or_user_id)

  def get_user_by_user_id(uid) when is_binary(uid) do
    # Handle formats like "#4829173650" or "4829173650"
    cleaned = uid |> String.replace("#", "") |> String.trim()

    # First try to find by new uid field (10-digit string)
    case Repo.get_by(User, uid: cleaned) do
      nil ->
        # Fallback: try legacy numeric user_id
        case Integer.parse(cleaned) do
          {num, ""} ->
            case Repo.get_by(User, user_id: num) do
              nil -> {:error, :not_found}
              user -> {:ok, user}
            end

          _ ->
            {:error, :not_found}
        end

      user ->
        {:ok, user}
    end
  end

  def get_user_by_user_id(user_id) when is_integer(user_id) do
    # Legacy: search by numeric user_id
    case Repo.get_by(User, user_id: user_id) do
      nil -> {:error, :not_found}
      user -> {:ok, user}
    end
  end

  # ---------------------------------------------------------------------------
  # Stripe Lookups
  # ---------------------------------------------------------------------------

  @doc "Look up a user by Stripe customer ID. Requires Stripe integration."
  @spec get_user_by_stripe_customer(String.t()) :: {:ok, struct()} | {:error, :not_found}
  def get_user_by_stripe_customer(stripe_customer_id) do
    Repo.get_by(User, stripe_customer_id: stripe_customer_id)
    |> case do
      nil -> {:error, :not_found}
      user -> {:ok, user}
    end
  end

  @doc "Look up a user by Stripe subscription ID. Requires Stripe integration."
  @spec get_user_by_stripe_subscription(String.t()) :: {:ok, struct()} | {:error, :not_found}
  def get_user_by_stripe_subscription(stripe_subscription_id) do
    Repo.get_by(User, stripe_subscription_id: stripe_subscription_id)
    |> case do
      nil -> {:error, :not_found}
      user -> {:ok, user}
    end
  end

  # ---------------------------------------------------------------------------
  # Password Verification
  # ---------------------------------------------------------------------------

  @doc "Verify a user's password. Returns true/false."
  @spec verify_password(struct(), String.t()) :: boolean()
  def verify_password(%User{} = user, password) when is_binary(password) do
    User.valid_password?(user, password)
  end

  # ---------------------------------------------------------------------------
  # Friend Suggestions
  # ---------------------------------------------------------------------------

  @doc "Dismiss a friend suggestion so it won't appear again."
  @spec dismiss_friend_suggestion(binary(), binary()) :: {:ok, :dismissed}
  def dismiss_friend_suggestion(user_id, suggested_user_id) do
    now = DateTime.truncate(DateTime.utc_now(), :second)

    Repo.insert_all("dismissed_suggestions",
      [
        %{
          id: Ecto.UUID.generate(),
          user_id: user_id,
          suggested_user_id: suggested_user_id,
          inserted_at: now
        }
      ],
      on_conflict: :nothing,
      conflict_target: [:user_id, :suggested_user_id]
    )

    {:ok, :dismissed}
  end

  @doc "Get list of dismissed suggestion user IDs for filtering."
  @spec get_dismissed_suggestion_ids(binary()) :: [binary()]
  def get_dismissed_suggestion_ids(user_id) do
    from(d in "dismissed_suggestions",
      where: d.user_id == type(^user_id, :binary_id),
      select: d.suggested_user_id
    )
    |> Repo.all()
  end
end
