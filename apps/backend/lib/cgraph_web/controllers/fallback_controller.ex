defmodule CGraphWeb.FallbackController do
  @moduledoc """
  Translates controller action results into valid Plug.Conn responses.

  This controller is invoked by action_fallback when a controller action
  returns an error tuple like {:error, :not_found} or {:error, changeset}.
  """
  use CGraphWeb, :controller

  # Handle Ecto changesets
  @spec call(Plug.Conn.t(), term()) :: Plug.Conn.t()
  def call(conn, {:error, %Ecto.Changeset{} = changeset}) do
    conn
    |> put_status(:unprocessable_entity)
    |> put_view(json: CGraphWeb.ErrorJSON)
    |> render(:error, changeset: changeset)
  end

  # Handle Ecto.NoResultsError (raised by Repo.one!, Repo.get!, etc.)
  def call(conn, {:error, %Ecto.NoResultsError{}}) do
    conn
    |> put_status(:not_found)
    |> put_view(json: CGraphWeb.ErrorJSON)
    |> render(:"404")
  end

  # Handle bare Ecto.NoResultsError (not wrapped in {:error, ...})
  def call(conn, %Ecto.NoResultsError{}) do
    conn
    |> put_status(:not_found)
    |> put_view(json: CGraphWeb.ErrorJSON)
    |> render(:"404")
  end

  # Handle :not_found errors
  def call(conn, {:error, :not_found}) do
    conn
    |> put_status(:not_found)
    |> put_view(json: CGraphWeb.ErrorJSON)
    |> render(:"404")
  end

  # Handle :unauthorized errors
  def call(conn, {:error, :unauthorized}) do
    conn
    |> put_status(:unauthorized)
    |> put_view(json: CGraphWeb.ErrorJSON)
    |> render(:"401")
  end

  # Handle :forbidden errors
  def call(conn, {:error, :forbidden}) do
    conn
    |> put_status(:forbidden)
    |> put_view(json: CGraphWeb.ErrorJSON)
    |> render(:"403")
  end

  # Handle rate limiting
  def call(conn, {:error, {:rate_limited, seconds_remaining}}) do
    conn
    |> put_status(:too_many_requests)
    |> put_resp_header("retry-after", to_string(seconds_remaining))
    |> put_view(json: CGraphWeb.ErrorJSON)
    |> render(:error, code: "rate_limited", message: "Rate limit exceeded.", details: %{retry_after_seconds: seconds_remaining})
  end

  # Handle insufficient permissions
  def call(conn, {:error, :insufficient_permissions}) do
    conn
    |> put_status(:forbidden)
    |> put_view(json: CGraphWeb.ErrorJSON)
    |> render(:error, code: "insufficient_permissions", message: "You don't have permission to perform this action.")
  end

  # Handle already exists
  def call(conn, {:error, :already_exists}) do
    conn
    |> put_status(:conflict)
    |> put_view(json: CGraphWeb.ErrorJSON)
    |> render(:error, code: "already_exists", message: "Resource already exists.")
  end

  # Handle recipient errors (PM system)
  def call(conn, {:error, :recipient_not_found}) do
    conn
    |> put_status(:not_found)
    |> put_view(json: CGraphWeb.ErrorJSON)
    |> render(:error, code: "not_found", message: "Recipient not found.")
  end

  def call(conn, {:error, :recipient_required}) do
    conn
    |> put_status(:unprocessable_entity)
    |> put_view(json: CGraphWeb.ErrorJSON)
    |> render(:error, code: "validation_error", message: "Recipient is required.")
  end

  # Handle forum limit reached (tier-based limits)
  def call(conn, {:error, %{code: :forum_limit_reached} = error_info}) do
    conn
    |> put_status(:unprocessable_entity)
    |> put_view(json: CGraphWeb.ErrorJSON)
    |> render(:error,
      code: "forum_limit_reached",
      message: error_info.message,
      details: %{
        current_count: error_info.current_count,
        max_allowed: error_info.max_allowed,
        tier: error_info.tier
      }
    )
  end

  # Handle group limit reached (tier-based limits)
  def call(conn, {:error, %{code: :group_limit_reached} = error_info}) do
    conn
    |> put_status(:unprocessable_entity)
    |> put_view(json: CGraphWeb.ErrorJSON)
    |> render(:error,
      code: "group_limit_reached",
      message: error_info.message,
      details: %{
        current_count: error_info.current_count,
        max_allowed: error_info.max_allowed,
        tier: error_info.tier
      }
    )
  end

  # Handle already member
  def call(conn, {:error, :already_member}) do
    conn
    |> put_status(:conflict)
    |> put_view(json: CGraphWeb.ErrorJSON)
    |> render(:error, code: "already_member", message: "You are already a member.")
  end

  # Handle already friends
  def call(conn, {:error, :already_friends}) do
    conn
    |> put_status(:conflict)
    |> put_view(json: CGraphWeb.ErrorJSON)
    |> render(:error, code: "already_friends", message: "You are already friends with this user.")
  end

  # Handle request already sent
  def call(conn, {:error, :request_already_sent}) do
    conn
    |> put_status(:conflict)
    |> put_view(json: CGraphWeb.ErrorJSON)
    |> render(:error, code: "request_already_sent", message: "Friend request already sent.")
  end

  # Handle cannot friend self
  def call(conn, {:error, :cannot_friend_self}) do
    conn
    |> put_status(:bad_request)
    |> put_view(json: CGraphWeb.ErrorJSON)
    |> render(:error, code: "cannot_friend_self", message: "You cannot send a friend request to yourself.")
  end

  # Handle cannot moderate self
  def call(conn, {:error, :cannot_moderate_self}) do
    conn
    |> put_status(:bad_request)
    |> put_view(json: CGraphWeb.ErrorJSON)
    |> render(:error, code: "cannot_moderate_self", message: "You cannot perform this action on yourself.")
  end

  # Handle user blocked
  def call(conn, {:error, :user_blocked}) do
    conn
    |> put_status(:forbidden)
    |> put_view(json: CGraphWeb.ErrorJSON)
    |> render(:error, code: "user_blocked", message: "You have blocked this user.")
  end

  # Handle blocked by user
  def call(conn, {:error, :blocked_by_user}) do
    conn
    |> put_status(:forbidden)
    |> put_view(json: CGraphWeb.ErrorJSON)
    |> render(:error, code: "blocked_by_user", message: "You cannot interact with this user.")
  end

  # Handle user banned
  def call(conn, {:error, :user_banned}) do
    conn
    |> put_status(:forbidden)
    |> put_view(json: CGraphWeb.ErrorJSON)
    |> render(:error, code: "user_banned", message: "You are banned from this group.")
  end

  # Handle invite errors
  def call(conn, {:error, :invite_expired}) do
    conn
    |> put_status(:gone)
    |> put_view(json: CGraphWeb.ErrorJSON)
    |> render(:error, code: "invite_expired", message: "This invite has expired.")
  end

  def call(conn, {:error, :invite_revoked}) do
    conn
    |> put_status(:gone)
    |> put_view(json: CGraphWeb.ErrorJSON)
    |> render(:error, code: "invite_revoked", message: "This invite has been revoked.")
  end

  def call(conn, {:error, :invite_max_uses_reached}) do
    conn
    |> put_status(:gone)
    |> put_view(json: CGraphWeb.ErrorJSON)
    |> render(:error, code: "invite_max_uses_reached", message: "This invite has reached its maximum uses.")
  end

  # Handle post locked
  def call(conn, {:error, :post_locked}) do
    conn
    |> put_status(:forbidden)
    |> put_view(json: CGraphWeb.ErrorJSON)
    |> render(:error, code: "post_locked", message: "This post is locked and cannot receive new comments.")
  end

  # Handle owner only restriction
  def call(conn, {:error, :owner_only}) do
    conn
    |> put_status(:forbidden)
    |> put_view(json: CGraphWeb.ErrorJSON)
    |> render(:error, code: "owner_only", message: "Only the forum owner can perform this action.")
  end

  # Handle must join first
  def call(conn, {:error, :must_join_first}) do
    conn
    |> put_status(:forbidden)
    |> put_view(json: CGraphWeb.ErrorJSON)
    |> render(:error, message: "You must join this forum first to perform this action.")
  end

  # Handle cannot leave own forum
  def call(conn, {:error, :cannot_leave_own_forum}) do
    conn
    |> put_status(:forbidden)
    |> put_view(json: CGraphWeb.ErrorJSON)
    |> render(:error, message: "You cannot leave a forum you own. Transfer ownership first.")
  end

  # Handle already pinned
  def call(conn, {:error, :already_pinned}) do
    conn
    |> put_status(:conflict)
    |> put_view(json: CGraphWeb.ErrorJSON)
    |> render(:error, message: "This message is already pinned.")
  end

  # Handle pin limit reached
  def call(conn, {:error, :pin_limit_reached}) do
    conn
    |> put_status(:unprocessable_entity)
    |> put_view(json: CGraphWeb.ErrorJSON)
    |> render(:error, message: "You have reached the maximum number of pinned messages (3).")
  end

  # Handle vote cooldown
  def call(conn, {:error, {:vote_cooldown, seconds_remaining}}) do
    conn
    |> put_status(:too_many_requests)
    |> put_resp_header("retry-after", to_string(seconds_remaining))
    |> put_view(json: CGraphWeb.ErrorJSON)
    |> render(:error, message: "Vote cooldown active. Try again in #{seconds_remaining} seconds.")
  end

  # Handle insufficient karma for downvote
  def call(conn, {:error, :insufficient_karma}) do
    conn
    |> put_status(:forbidden)
    |> put_view(json: CGraphWeb.ErrorJSON)
    |> render(:error, message: "You need more karma to downvote. Participate more in the community first.")
  end

  # Handle account too new to vote
  def call(conn, {:error, :account_too_new}) do
    conn
    |> put_status(:forbidden)
    |> put_view(json: CGraphWeb.ErrorJSON)
    |> render(:error, message: "Your account is too new to vote. Please wait a day before voting.")
  end

  # Handle self vote attempt
  def call(conn, {:error, :cannot_vote_own_content}) do
    conn
    |> put_status(:forbidden)
    |> put_view(json: CGraphWeb.ErrorJSON)
    |> render(:error, message: "You cannot vote on your own content.")
  end

  # Handle cannot modify default role
  def call(conn, {:error, :cannot_modify_default_role}) do
    conn
    |> put_status(:forbidden)
    |> put_view(json: CGraphWeb.ErrorJSON)
    |> render(:error, message: "The default role cannot be modified.")
  end

  # Handle not owner
  def call(conn, {:error, :not_owner}) do
    conn
    |> put_status(:forbidden)
    |> put_view(json: CGraphWeb.ErrorJSON)
    |> render(:error, message: "Only the owner can perform this action.")
  end

  # Handle file upload errors
  def call(conn, {:error, :unsupported_file_type}) do
    conn
    |> put_status(:unsupported_media_type)
    |> put_view(json: CGraphWeb.ErrorJSON)
    |> render(:error, message: "This file type is not supported.")
  end

  def call(conn, {:error, {:file_too_large, type, max}}) do
    max_mb = Float.round(max / 1_000_000, 1)
    conn
    |> put_status(:request_entity_too_large)
    |> put_view(json: CGraphWeb.ErrorJSON)
    |> render(:error, message: "#{String.capitalize(type)} exceeds maximum size of #{max_mb} MB.")
  end

  def call(conn, {:error, :upload_quota_exceeded}) do
    conn
    |> put_status(:insufficient_storage)
    |> put_view(json: CGraphWeb.ErrorJSON)
    |> render(:error, message: "Upload quota exceeded. Please delete some files or upgrade your storage.")
  end

  # Handle invalid emoji
  def call(conn, {:error, :invalid_emoji}) do
    conn
    |> put_status(:bad_request)
    |> put_view(json: CGraphWeb.ErrorJSON)
    |> render(:error, message: "Invalid emoji.")
  end

  # Handle token validation errors
  # Note: 422 Unprocessable Entity is more appropriate for validation failures
  def call(conn, {:error, :token_required}) do
    conn
    |> put_status(:unprocessable_entity)
    |> put_view(json: CGraphWeb.ErrorJSON)
    |> render(:error, message: "Push token is required.")
  end

  def call(conn, {:error, :invalid_platform}) do
    conn
    |> put_status(:unprocessable_entity)
    |> put_view(json: CGraphWeb.ErrorJSON)
    |> render(:error, message: "Invalid platform. Must be ios, android, or web.")
  end

  # Generic bad request
  def call(conn, {:error, :bad_request}) do
    conn
    |> put_status(:bad_request)
    |> put_view(json: CGraphWeb.ErrorJSON)
    |> render(:"400")
  end

  # Handle 3-tuple errors with status and message: {:error, :status, "message"}
  def call(conn, {:error, status, message}) when is_atom(status) and is_binary(message) do
    conn
    |> put_status(status)
    |> put_view(json: CGraphWeb.ErrorJSON)
    |> render(:error, message: message)
  end

  # Handle generic string errors
  def call(conn, {:error, message}) when is_binary(message) do
    conn
    |> put_status(:unprocessable_entity)
    |> put_view(json: CGraphWeb.ErrorJSON)
    |> render(:error, message: message)
  end

  # Handle generic atom errors
  def call(conn, {:error, reason}) when is_atom(reason) do
    message = reason |> Atom.to_string() |> String.replace("_", " ") |> String.capitalize()

    conn
    |> put_status(:unprocessable_entity)
    |> put_view(json: CGraphWeb.ErrorJSON)
    |> render(:error, message: message)
  end
end
