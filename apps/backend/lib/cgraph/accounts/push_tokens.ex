defmodule CGraph.Accounts.PushTokens do
  @moduledoc """
  Push notification token management.

  Extracted from `CGraph.Accounts` to keep the facade under 500 lines.
  """

  import Ecto.Query, warn: false

  alias CGraph.Accounts.PushToken
  alias CGraph.Repo

  @doc "Register a push notification token for a user."
  def register_push_token(user, token, platform) do
    mapped_platform = case platform do
      "ios" -> "apns"
      "android" -> "fcm"
      other -> other
    end

    attrs = %{
      user_id: user.id,
      token: token,
      platform: mapped_platform,
      last_used_at: DateTime.truncate(DateTime.utc_now(), :second)
    }

    case Repo.get_by(PushToken, user_id: user.id, token: token) do
      nil ->
        %PushToken{}
        |> PushToken.changeset(attrs)
        |> Repo.insert()

      existing ->
        existing
        |> PushToken.changeset(%{last_used_at: DateTime.truncate(DateTime.utc_now(), :second), platform: mapped_platform})
        |> Repo.update()
    end
  end

  @doc "Delete a push token for a user."
  def delete_push_token(user, token) do
    case Repo.get_by(PushToken, user_id: user.id, token: token) do
      nil -> {:error, :not_found}
      push_token -> Repo.delete(push_token)
    end
  end

  @doc "List all push tokens for a user."
  def list_push_tokens(user) do
    from(pt in PushToken, where: pt.user_id == ^user.id, order_by: [desc: :last_used_at])
    |> Repo.all()
  end
end
