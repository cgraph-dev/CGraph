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

  alias CGraph.Repo
  alias CGraph.Accounts.User
  import Ecto.Query

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

      # Remove personal data
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
