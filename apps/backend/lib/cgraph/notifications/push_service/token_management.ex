defmodule CGraph.Notifications.PushService.TokenManagement do
  @moduledoc false

  import Ecto.Query

  require Logger

  alias CGraph.Accounts.PushToken
  alias CGraph.Repo

  # ============================================================================
  # Token Queries
  # ============================================================================

  def get_user_tokens(user_id, opts) do
    platforms = Keyword.get(opts, :platforms)
    exclude_device_ids = Keyword.get(opts, :exclude_device_ids, [])

    query = from pt in PushToken,
      where: pt.user_id == ^user_id and pt.is_active == true,
      order_by: [desc: pt.updated_at]

    query = if platforms do
      where(query, [pt], pt.platform in ^platforms)
    else
      query
    end

    query = if Enum.empty?(exclude_device_ids) do
      query
    else
      where(query, [pt], pt.device_id not in ^exclude_device_ids)
    end

    Repo.all(query)
  end

  def get_tokens_for_users(user_ids, opts) do
    platforms = Keyword.get(opts, :platforms)

    query = from pt in PushToken,
      where: pt.user_id in ^user_ids and pt.is_active == true,
      order_by: [desc: pt.updated_at]

    query = if platforms do
      where(query, [pt], pt.platform in ^platforms)
    else
      query
    end

    Repo.all(query)
  end

  # ============================================================================
  # Token Registration
  # ============================================================================

  def do_register_token(user_id, token, platform, device_id) do
    # First, deactivate any existing tokens with this device_id for this user
    from(pt in PushToken,
      where: pt.user_id == ^user_id and pt.device_id == ^device_id
    )
    |> Repo.update_all(set: [is_active: false, updated_at: DateTime.utc_now()])

    # Also deactivate if same token exists for different user (device changed hands)
    from(pt in PushToken,
      where: pt.token == ^token and pt.user_id != ^user_id
    )
    |> Repo.update_all(set: [is_active: false, updated_at: DateTime.utc_now()])

    # Create or update the token
    attrs = %{
      user_id: user_id,
      token: token,
      platform: normalize_platform(platform),
      device_id: device_id,
      is_active: true
    }

    case Repo.get_by(PushToken, token: token, user_id: user_id) do
      nil ->
        %PushToken{}
        |> PushToken.changeset(attrs)
        |> Repo.insert()

      existing ->
        existing
        |> PushToken.changeset(%{is_active: true, device_id: device_id})
        |> Repo.update()
    end
  end

  def do_unregister_token(token) do
    from(pt in PushToken, where: pt.token == ^token)
    |> Repo.update_all(set: [is_active: false, updated_at: DateTime.utc_now()])

    :ok
  end

  def cleanup_invalid_tokens(invalid_tokens) do
    from(pt in PushToken, where: pt.token in ^invalid_tokens)
    |> Repo.update_all(set: [is_active: false, updated_at: DateTime.utc_now()])

    Logger.info("invalid_tokens_cleaned", count: length(invalid_tokens))
  end

  # ============================================================================
  # Member Queries
  # ============================================================================

  def get_conversation_member_ids(conversation_id, exclude_id) do
    from(cp in "conversation_participants",
      where: cp.conversation_id == ^conversation_id and cp.user_id != ^exclude_id,
      select: cp.user_id
    )
    |> Repo.all()
  rescue
    _ -> []
  end

  def get_group_member_ids(group_id, exclude_id) do
    from(gm in "group_members",
      where: gm.group_id == ^group_id and gm.user_id != ^exclude_id,
      select: gm.user_id
    )
    |> Repo.all()
  rescue
    _ -> []
  end

  # ============================================================================
  # Helpers
  # ============================================================================

  defp normalize_platform("ios"), do: "apns"
  defp normalize_platform("android"), do: "fcm"
  defp normalize_platform("web"), do: "web"
  defp normalize_platform("expo"), do: "expo"
  defp normalize_platform(platform), do: platform
end
