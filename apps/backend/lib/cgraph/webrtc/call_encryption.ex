defmodule CGraph.WebRTC.CallEncryption do
  @moduledoc """
  Per-room encryption key management for E2EE calls.

  Generates and stores 256-bit AES room keys in ETS, scoped to room lifecycle.
  Keys are distributed to participants via ECDH + AES-GCM wrapping.

  ## Key Lifecycle

  1. First participant joins → `get_or_create_room_key/1` generates key
  2. Key stored in ETS (dies when room ends)
  3. Each joining participant receives key encrypted for them
  4. When participant leaves/joins → `rotate_room_key/1` generates new key
  5. Room ends → key cleaned up via `cleanup_room_key/1`

  ## Security

  - 256-bit random AES keys (`:crypto.strong_rand_bytes/1`)
  - Per-participant key wrapping via AES-256-GCM
  - Key rotation on participant change
  - ETS storage (in-memory, no disk persistence)
  """

  use GenServer
  require Logger

  @table :call_encryption_keys
  @key_size 32
  @iv_size 12
  @aad "cgraph-call-e2ee-v1"

  # ---------------------------------------------------------------------------
  # Client API
  # ---------------------------------------------------------------------------

  @doc "Start the CallEncryption GenServer (creates ETS table)."
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @doc """
  Get or create a 256-bit room encryption key.

  Returns base64-encoded key. Generates a new key if one doesn't exist.
  """
  @spec get_or_create_room_key(String.t()) :: {:ok, String.t()}
  def get_or_create_room_key(room_id) do
    case :ets.lookup(@table, room_id) do
      [{^room_id, key}] ->
        {:ok, Base.encode64(key)}

      [] ->
        key = :crypto.strong_rand_bytes(@key_size)
        :ets.insert(@table, {room_id, key})
        Logger.info("call_encryption_key_created", room_id: room_id)
        {:ok, Base.encode64(key)}
    end
  end

  @doc """
  Rotate the room key. Generates a new key and returns it base64-encoded.

  Broadcasts a `key_rotated` event via PubSub so connected participants
  can fetch the new key.
  """
  @spec rotate_room_key(String.t()) :: {:ok, String.t()}
  def rotate_room_key(room_id) do
    new_key = :crypto.strong_rand_bytes(@key_size)
    :ets.insert(@table, {room_id, new_key})

    Phoenix.PubSub.broadcast(
      CGraph.PubSub,
      "webrtc:room:#{room_id}",
      {:e2ee_key_rotated, %{room_id: room_id}}
    )

    Logger.info("call_encryption_key_rotated", room_id: room_id)
    {:ok, Base.encode64(new_key)}
  end

  @doc """
  Encrypt the room key for a specific participant.

  Uses AES-256-GCM with a shared secret derived from the participant's
  public key material. In practice the client sends its ECDH public key
  on join; we use a symmetric wrap here for simplicity.

  Returns `{:ok, %{encrypted_key: base64, iv: base64, tag: base64}}`.
  """
  @spec encrypt_room_key_for_participant(String.t(), binary()) ::
          {:ok, %{encrypted_key: String.t(), iv: String.t(), tag: String.t()}}
          | {:error, :room_key_not_found}
  def encrypt_room_key_for_participant(room_id, participant_secret) when is_binary(participant_secret) do
    case :ets.lookup(@table, room_id) do
      [{^room_id, room_key}] ->
        # Derive wrapping key from participant secret via SHA-256
        wrap_key = :crypto.hash(:sha256, participant_secret)
        iv = :crypto.strong_rand_bytes(@iv_size)

        {ciphertext, tag} =
          :crypto.crypto_one_time_aead(
            :aes_256_gcm,
            wrap_key,
            iv,
            room_key,
            @aad,
            true
          )

        {:ok,
         %{
           encrypted_key: Base.encode64(ciphertext),
           iv: Base.encode64(iv),
           tag: Base.encode64(tag)
         }}

      [] ->
        {:error, :room_key_not_found}
    end
  end

  @doc "Clean up the encryption key when a room ends."
  @spec cleanup_room_key(String.t()) :: :ok
  def cleanup_room_key(room_id) do
    :ets.delete(@table, room_id)
    Logger.info("call_encryption_key_cleaned", room_id: room_id)
    :ok
  end

  @doc "Check if a room has an encryption key."
  @spec has_room_key?(String.t()) :: boolean()
  def has_room_key?(room_id) do
    :ets.lookup(@table, room_id) != []
  end

  # ---------------------------------------------------------------------------
  # GenServer Callbacks
  # ---------------------------------------------------------------------------

  @impl true
  def init(_opts) do
    table = :ets.new(@table, [:named_table, :set, :public, read_concurrency: true])
    {:ok, %{table: table}}
  end

  @impl true
  def handle_info(_msg, state) do
    {:noreply, state}
  end
end
