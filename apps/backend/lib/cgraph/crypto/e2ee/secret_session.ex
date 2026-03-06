defmodule CGraph.Crypto.E2EE.SecretSession do
  @moduledoc """
  Server-side session tracking for secret chat E2EE.

  Tracks active E2EE sessions between user pairs, monitors ratchet key
  rotation, and manages session lifecycle. The server only stores public
  ratchet keys — never private keys.

  ## Session States

  - `active` — session is in use
  - `stale` — no messages in 30+ days
  - `terminated` — explicitly closed

  ## Key Rotation

  The ratchet protocol advances keys automatically. The server tracks the
  public side of the ratchet to detect stuck or replayed sessions. Key
  rotation is recommended every 100 messages.
  """

  use Ecto.Schema
  import Ecto.{Changeset, Query}

  alias CGraph.Repo

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  @valid_states ~w(active stale terminated)
  @valid_conversation_types ~w(dm secret)
  @rotation_threshold 100

  @type t :: %__MODULE__{}

  schema "e2ee_sessions" do
    field :conversation_type, :string
    field :conversation_id, :binary_id
    field :device_id, :string
    field :session_state, :string, default: "active"
    field :current_ratchet_public_key, :binary
    field :message_count, :integer, default: 0
    field :last_key_rotation_at, :utc_datetime_usec

    belongs_to :user, CGraph.Accounts.User
    belongs_to :peer, CGraph.Accounts.User

    timestamps()
  end

  @doc "Builds a changeset for a new session."
  def changeset(session, attrs) do
    session
    |> cast(attrs, [
      :user_id,
      :peer_id,
      :conversation_type,
      :conversation_id,
      :device_id,
      :session_state,
      :current_ratchet_public_key,
      :message_count,
      :last_key_rotation_at
    ])
    |> validate_required([:user_id, :peer_id, :conversation_type, :conversation_id])
    |> validate_inclusion(:session_state, @valid_states)
    |> validate_inclusion(:conversation_type, @valid_conversation_types)
    |> unique_constraint([:user_id, :peer_id, :conversation_id, :device_id],
      name: :e2ee_sessions_user_peer_convo_device_idx
    )
    |> foreign_key_constraint(:user_id)
    |> foreign_key_constraint(:peer_id)
  end

  # ============================================================================
  # Public API
  # ============================================================================

  @doc """
  Creates a new E2EE session between two users for a conversation.

  ## Options

    * `:device_id` — optional device identifier
  """
  @spec create_session(String.t(), String.t(), String.t(), String.t(), keyword()) ::
          {:ok, t()} | {:error, Ecto.Changeset.t()}
  def create_session(user_id, peer_id, conversation_id, conversation_type, opts \\ []) do
    %__MODULE__{}
    |> changeset(%{
      user_id: user_id,
      peer_id: peer_id,
      conversation_id: conversation_id,
      conversation_type: conversation_type,
      device_id: Keyword.get(opts, :device_id)
    })
    |> Repo.insert()
  end

  @doc """
  Updates the ratchet public key and increments message count.

  Returns whether key rotation is needed based on message count threshold.
  """
  @spec update_ratchet_key(t(), binary()) :: {:ok, t(), boolean()}
  def update_ratchet_key(%__MODULE__{} = session, new_public_key) do
    key_changed = session.current_ratchet_public_key != new_public_key
    new_count = session.message_count + 1

    now = DateTime.utc_now() |> DateTime.truncate(:microsecond)

    updates =
      %{
        current_ratchet_public_key: new_public_key,
        message_count: new_count
      }
      |> then(fn attrs ->
        if key_changed do
          Map.put(attrs, :last_key_rotation_at, now)
        else
          attrs
        end
      end)

    case session |> Ecto.Changeset.change(updates) |> Repo.update() do
      {:ok, updated} ->
        rotation_needed = needs_key_rotation?(updated)
        {:ok, updated, rotation_needed}

      {:error, changeset} ->
        {:error, changeset}
    end
  end

  @doc """
  Gets an active session for a user/peer/conversation tuple.
  """
  @spec get_session(String.t(), String.t(), String.t()) :: {:ok, t()} | {:error, :not_found}
  def get_session(user_id, peer_id, conversation_id) do
    from(s in __MODULE__,
      where: s.user_id == ^user_id,
      where: s.peer_id == ^peer_id,
      where: s.conversation_id == ^conversation_id,
      where: s.session_state == "active"
    )
    |> Repo.one()
    |> case do
      nil -> {:error, :not_found}
      session -> {:ok, session}
    end
  end

  @doc """
  Lists all active sessions for a user.
  """
  @spec list_sessions(String.t()) :: [t()]
  def list_sessions(user_id) do
    from(s in __MODULE__,
      where: s.user_id == ^user_id,
      where: s.session_state == "active",
      order_by: [desc: s.updated_at]
    )
    |> Repo.all()
  end

  @doc """
  Terminates an E2EE session.
  """
  @spec terminate_session(String.t()) :: {:ok, t()} | {:error, :not_found}
  def terminate_session(session_id) do
    case Repo.get(__MODULE__, session_id) do
      nil ->
        {:error, :not_found}

      session ->
        session
        |> Ecto.Changeset.change(%{session_state: "terminated"})
        |> Repo.update()
    end
  end

  @doc """
  Checks whether a session needs key rotation based on message count.

  Returns true when message_count exceeds #{@rotation_threshold} messages
  since last rotation.
  """
  @spec needs_key_rotation?(t()) :: boolean()
  def needs_key_rotation?(%__MODULE__{} = session) do
    session.message_count > 0 and rem(session.message_count, @rotation_threshold) == 0
  end

  @doc """
  Marks stale sessions. Sessions with no activity for 30+ days become stale.
  Returns the count of sessions marked stale.
  """
  @spec mark_stale_sessions() :: non_neg_integer()
  def mark_stale_sessions do
    cutoff = DateTime.utc_now() |> DateTime.add(-30, :day) |> DateTime.truncate(:microsecond)

    {count, _} =
      from(s in __MODULE__,
        where: s.session_state == "active",
        where: s.updated_at < ^cutoff
      )
      |> Repo.update_all(set: [session_state: "stale"])

    count
  end
end
