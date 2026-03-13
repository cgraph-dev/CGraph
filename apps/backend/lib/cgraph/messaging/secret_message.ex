defmodule CGraph.Messaging.SecretMessage do
  @moduledoc """
  Schema for secret chat messages.

  The server only stores opaque ciphertext blobs — no plaintext ever touches
  the database. Messages include ratchet headers for the Triple Ratchet
  protocol and optional self-destruct expiry.

  ## Content Types

  Same as regular messages: text, image, video, audio, file, voice, sticker.
  The content_type field allows clients to render the appropriate UI, but
  the server never inspects the ciphertext.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @type t :: %__MODULE__{}

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @content_types ~w(text image video audio file voice sticker)

  schema "secret_messages" do
    field :ciphertext, :binary
    field :content_type, :string, default: "text"
    field :nonce, :binary
    field :ratchet_header, :binary
    field :expires_at, :utc_datetime_usec
    field :read_at, :utc_datetime_usec
    field :file_metadata, :map

    belongs_to :secret_conversation, CGraph.Messaging.SecretConversation
    belongs_to :sender, CGraph.Accounts.User

    timestamps(updated_at: false)
  end

  @required_fields ~w(ciphertext secret_conversation_id sender_id)a
  @optional_fields ~w(content_type nonce ratchet_header expires_at read_at file_metadata)a

  @doc "Changeset for creating a secret message."
  def changeset(message, attrs) do
    message
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_inclusion(:content_type, @content_types)
    |> foreign_key_constraint(:secret_conversation_id)
    |> foreign_key_constraint(:sender_id)
  end

  @doc "Returns the list of valid content types."
  def content_types, do: @content_types
end
