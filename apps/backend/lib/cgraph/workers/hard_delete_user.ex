defmodule CGraph.Workers.HardDeleteUser do
  @moduledoc """
  Oban worker that performs hard-deletion of a user account
  after the 30-day grace period expires.

  Anonymizes messages, removes personal data, and cascades
  deletion to owned resources.
  """
  use Oban.Worker,
    queue: :default,
    max_attempts: 3

  alias CGraph.Accounts.User
  alias CGraph.Repo
  import Ecto.Query

  @doc "Executes the job."
  @spec perform(Oban.Job.t()) :: :ok | {:error, term()}
  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"user_id" => user_id}}) do
    case Repo.get(User, user_id) do
      nil ->
        # Already deleted
        :ok

      %User{deleted_at: nil} ->
        # User reactivated during grace period — skip
        :ok

      %User{} = user ->
        hard_delete(user)
    end
  end

  defp hard_delete(user) do
    Repo.transaction(fn ->
      # Anonymize messages — keep content but remove sender identity
      from(m in CGraph.Messaging.Message,
        where: m.sender_id == ^user.id
      )
      |> Repo.update_all(set: [sender_id: nil])

      # --- Cascade deletes for associated data ---

      # Notification preferences (Phase 9 — per-conversation/channel mute settings)
      from(np in CGraph.Notifications.NotificationPreference,
        where: np.user_id == ^user.id
      )
      |> Repo.delete_all()

      # Push tokens
      from(pt in CGraph.Accounts.PushToken,
        where: pt.user_id == ^user.id
      )
      |> Repo.delete_all()

      # Notifications
      from(n in CGraph.Notifications.Notification,
        where: n.user_id == ^user.id
      )
      |> Repo.delete_all()

      # Friendships (user can be on either side)
      from(f in CGraph.Accounts.Friendship,
        where: f.user_id == ^user.id or f.friend_id == ^user.id
      )
      |> Repo.delete_all()

      # E2EE keys — delete in order: one-time prekeys → signed prekeys → identity keys
      identity_key_ids =
        from(ik in CGraph.Crypto.E2EE.IdentityKey,
          where: ik.user_id == ^user.id,
          select: ik.id
        )

      from(otk in CGraph.Crypto.E2EE.OneTimePrekey,
        where: otk.identity_key_id in subquery(identity_key_ids)
      )
      |> Repo.delete_all()

      from(spk in CGraph.Crypto.E2EE.SignedPrekey,
        where: spk.identity_key_id in subquery(identity_key_ids)
      )
      |> Repo.delete_all()

      from(ik in CGraph.Crypto.E2EE.IdentityKey,
        where: ik.user_id == ^user.id
      )
      |> Repo.delete_all()

      # User settings
      from(us in CGraph.Accounts.UserSettings,
        where: us.user_id == ^user.id
      )
      |> Repo.delete_all()

      # Remove personal data (anonymize the user record)
      user
      |> Ecto.Changeset.change(%{
        email: "deleted_#{user.id}@deleted.invalid",
        username: "deleted_#{String.slice(user.id, 0, 8)}",
        display_name: "Deleted User",
        avatar_url: nil,
        banner_url: nil,
        bio: nil,
        custom_status: nil,
        status_message: nil,
        password_hash: nil,
        wallet_address: nil,
        wallet_nonce: nil,
        totp_secret: nil,
        totp_enabled: false,
        is_active: false,
        is_suspended: true,
        suspension_reason: "Account deleted by user"
      })
      |> Repo.update!()
    end)

    :ok
  end
end
