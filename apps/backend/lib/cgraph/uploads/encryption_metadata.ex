defmodule CGraph.Uploads.EncryptionMetadata do
  @moduledoc """
  Embedded schema for E2EE metadata on file uploads.

  When a file is uploaded in an E2EE conversation, the client encrypts
  the file with a random AES-256-GCM key, then wraps that key with the
  session ratchet key. The wrapped key, IV, algorithm, and sender device
  ID are stored alongside the upload record so recipients can decrypt.

  ## Fields

  - `encrypted_key` — Base64-encoded file key (wrapped with ratchet key)
  - `encryption_iv` — Base64-encoded 12-byte IV used for file encryption
  - `key_algorithm` — Always "aes-256-gcm"
  - `sender_device_id` — Device that performed the encryption
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key false
  embedded_schema do
    field :encrypted_key, :string
    field :encryption_iv, :string
    field :key_algorithm, :string, default: "aes-256-gcm"
    field :sender_device_id, :string
  end

  @doc """
  Validates encryption metadata fields.

  Requires `encrypted_key` and `encryption_iv`. The `key_algorithm`
  is constrained to "aes-256-gcm" only.
  """
  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(metadata, attrs) do
    metadata
    |> cast(attrs, [:encrypted_key, :encryption_iv, :key_algorithm, :sender_device_id])
    |> validate_required([:encrypted_key, :encryption_iv])
    |> validate_inclusion(:key_algorithm, ["aes-256-gcm"])
  end
end
