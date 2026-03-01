defmodule CGraph.Crypto.E2EE.GroupKeyDistribution do
  @moduledoc """
  Group key distribution context for the Sender Key protocol.

  Manages the lifecycle of group E2EE sessions:
  - Registration of sender keys by group members
  - Distribution of encrypted sender keys to recipients
  - Key rotation on member departure
  - Session invalidation and cleanup
  """

  import Ecto.Query
  alias CGraph.Crypto.E2EE.{GroupSession, GroupSenderKeyDistribution}
  alias CGraph.Repo

  # ===========================================================================
  # Registration
  # ===========================================================================

  @doc """
  Register a sender key for a user's device in a group.
  If a session already exists for this group+user+device, it is replaced.
  """
  @spec register_sender_key(binary(), binary(), binary(), binary()) ::
          {:ok, GroupSession.t()} | {:error, Ecto.Changeset.t()}
  def register_sender_key(group_id, user_id, device_id, public_sender_key) do
    sender_key_id = generate_key_id()

    # Deactivate existing session for this device
    from(s in GroupSession,
      where: s.group_id == ^group_id and s.user_id == ^user_id and s.device_id == ^device_id
    )
    |> Repo.update_all(set: [is_active: false])

    %GroupSession{}
    |> GroupSession.changeset(%{
      group_id: group_id,
      user_id: user_id,
      device_id: device_id,
      sender_key_id: sender_key_id,
      public_sender_key: public_sender_key,
      chain_key_index: 0,
      is_active: true
    })
    |> Repo.insert(
      on_conflict: {:replace, [:sender_key_id, :public_sender_key, :chain_key_index, :is_active, :updated_at]},
      conflict_target: [:group_id, :user_id, :device_id]
    )
  end

  # ===========================================================================
  # Distribution
  # ===========================================================================

  @doc """
  Distribute an encrypted sender key to a specific recipient device.
  Called by the sender to share their key with each group member.
  """
  @spec distribute_key(binary(), binary(), binary(), binary()) ::
          {:ok, GroupSenderKeyDistribution.t()} | {:error, Ecto.Changeset.t()}
  def distribute_key(session_id, recipient_user_id, recipient_device_id, encrypted_sender_key) do
    %GroupSenderKeyDistribution{}
    |> GroupSenderKeyDistribution.changeset(%{
      session_id: session_id,
      recipient_user_id: recipient_user_id,
      recipient_device_id: recipient_device_id,
      encrypted_sender_key: encrypted_sender_key,
      distributed_at: DateTime.utc_now()
    })
    |> Repo.insert()
  end

  @doc """
  Get all active sender key distributions FOR a specific user in a group.
  Returns the keys that other members have shared with this user.
  """
  @spec get_session_keys(binary(), binary()) :: [map()]
  def get_session_keys(group_id, user_id) do
    from(d in GroupSenderKeyDistribution,
      join: s in GroupSession, on: d.session_id == s.id,
      where: s.group_id == ^group_id and d.recipient_user_id == ^user_id and s.is_active == true,
      select: %{
        session_id: s.id,
        sender_user_id: s.user_id,
        sender_device_id: s.device_id,
        sender_key_id: s.sender_key_id,
        public_sender_key: s.public_sender_key,
        chain_key_index: s.chain_key_index,
        encrypted_sender_key: d.encrypted_sender_key,
        distributed_at: d.distributed_at
      }
    )
    |> Repo.all()
  end

  @doc """
  Get all active group member sessions — used by new members to know
  who they need to receive sender keys from.
  """
  @spec get_group_members_keys(binary()) :: [map()]
  def get_group_members_keys(group_id) do
    from(s in GroupSession,
      where: s.group_id == ^group_id and s.is_active == true,
      select: %{
        session_id: s.id,
        user_id: s.user_id,
        device_id: s.device_id,
        sender_key_id: s.sender_key_id,
        public_sender_key: s.public_sender_key
      }
    )
    |> Repo.all()
  end

  # ===========================================================================
  # Key Rotation
  # ===========================================================================

  @doc """
  Rotate all session keys in a group. Marks all current sessions as inactive.
  Each client must generate a new sender key and re-distribute upon receiving
  a key_rotation_required event.
  """
  @spec rotate_keys(binary(), binary()) :: {integer(), nil | [term()]}
  def rotate_keys(group_id, _reason) do
    from(s in GroupSession,
      where: s.group_id == ^group_id and s.is_active == true
    )
    |> Repo.update_all(set: [is_active: false, updated_at: DateTime.utc_now()])
  end

  @doc """
  Invalidate a specific user's sessions in a group (on leave/kick).
  Does NOT rotate all keys — only removes the departing user's sessions.
  """
  @spec invalidate_user_sessions(binary(), binary(), binary() | nil) :: {integer(), nil | [term()]}
  def invalidate_user_sessions(group_id, user_id, device_id \\ nil) do
    query = from(s in GroupSession,
      where: s.group_id == ^group_id and s.user_id == ^user_id and s.is_active == true
    )

    query = if device_id, do: where(query, [s], s.device_id == ^device_id), else: query

    Repo.update_all(query, set: [is_active: false, updated_at: DateTime.utc_now()])
  end

  @doc """
  Cleanup stale sessions — remove sessions for users no longer in the group.
  """
  @spec cleanup_stale_sessions(binary()) :: {integer(), nil}
  def cleanup_stale_sessions(group_id) do
    # Get active member user IDs
    member_ids = from(m in CGraph.Groups.Member,
      where: m.group_id == ^group_id,
      select: m.user_id
    )
    |> Repo.all()

    from(s in GroupSession,
      where: s.group_id == ^group_id and s.user_id not in ^member_ids
    )
    |> Repo.delete_all()
  end

  @doc """
  Increment the chain key index for a session (after encrypting a message).
  """
  @spec increment_chain_index(binary()) :: {integer(), nil | [term()]}
  def increment_chain_index(session_id) do
    from(s in GroupSession, where: s.id == ^session_id)
    |> Repo.update_all(inc: [chain_key_index: 1])
  end

  # ===========================================================================
  # Private
  # ===========================================================================

  defp generate_key_id do
    :crypto.strong_rand_bytes(16) |> Base.url_encode64(padding: false)
  end
end
