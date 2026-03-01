defmodule CGraphWeb.API.V1.AccountDeletionController do
  @moduledoc """
  Handles self-service account deletion with GDPR compliance.

  Flow:
  1. User submits deletion request with password confirmation
  2. Account is soft-deleted (deleted_at set, is_active = false)
  3. Oban job scheduled for hard-delete after 30-day grace period
  4. User can cancel by logging in within grace period (auto-reactivation)
  """
  use CGraphWeb, :controller

  alias CGraph.Accounts
  alias CGraph.Repo
  alias CGraph.Workers.HardDeleteUser

  action_fallback CGraphWeb.FallbackController

  @grace_period_days 30

  @doc """
  Request account deletion.
  Requires password confirmation.
  Soft-deletes the account and schedules hard-delete after grace period.
  """
  @spec create(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def create(conn, %{"password" => password}) do
    user = conn.assigns.current_user

    with :ok <- verify_password(user, password),
         {:ok, _user} <- soft_delete_user(user),
         :ok <- cleanup_on_soft_delete(user),
         {:ok, _job} <- schedule_hard_delete(user.id) do
      conn
      |> put_status(:ok)
      |> json(%{
        message: "Account scheduled for deletion",
        grace_period_days: @grace_period_days,
        hard_delete_at: DateTime.add(DateTime.utc_now(), @grace_period_days * 86_400, :second)
      })
    end
  end

  @doc """
  Cancel a pending account deletion.
  Only works within the grace period.
  """
  @spec delete(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def delete(conn, _params) do
    user = conn.assigns.current_user

    if user.deleted_at do
      with {:ok, _user} <- reactivate_user(user) do
        conn
        |> put_status(:ok)
        |> json(%{message: "Account deletion cancelled. Your account has been reactivated."})
      end
    else
      conn
      |> put_status(:bad_request)
      |> json(%{error: %{message: "No pending deletion to cancel"}})
    end
  end

  # --- Private ---

  defp verify_password(user, password) do
    if Accounts.verify_password(user, password) do
      :ok
    else
      {:error, :unauthorized}
    end
  end

  defp soft_delete_user(user) do
    user
    |> Ecto.Changeset.change(%{
      deleted_at: DateTime.utc_now(),
      is_active: false
    })
    |> Repo.update()
  end

  defp reactivate_user(user) do
    user
    |> Ecto.Changeset.change(%{
      deleted_at: nil,
      is_active: true
    })
    |> Repo.update()
  end

  defp cleanup_on_soft_delete(user) do
    import Ecto.Query

    # Delete push tokens immediately — stop push notifications right away
    from(pt in CGraph.Accounts.PushToken, where: pt.user_id == ^user.id)
    |> Repo.delete_all()

    # Revoke all auth tokens/sessions so user is signed out everywhere
    CGraph.Auth.TokenManager.revoke_all_user_tokens(user.id)

    # Presence cleanup happens automatically when socket connections drop
    # after token revocation — Phoenix.Presence untracks by PID

    :ok
  end

  defp schedule_hard_delete(user_id) do
    scheduled_at = DateTime.add(DateTime.utc_now(), @grace_period_days * 86_400, :second)

    %{user_id: user_id}
    |> HardDeleteUser.new(scheduled_at: scheduled_at)
    |> Oban.insert()
  end
end
