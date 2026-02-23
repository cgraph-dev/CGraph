defmodule CGraph.Messaging.VoiceMessage do
  @moduledoc """
  Voice message processing and storage.

  ## Overview

  Handles the complete lifecycle of voice messages:

  - **Recording**: Receive audio data from clients
  - **Processing**: Transcode, compress, extract waveform
  - **Storage**: Store audio files securely
  - **Playback**: Serve optimized audio for playback

  ## Supported Formats

  Input formats accepted:
  - WebM (Opus codec) - preferred for web
  - M4A (AAC codec) - preferred for iOS
  - MP3 - fallback
  - OGG (Vorbis) - fallback

  Output format: OGG Opus (best quality-to-size ratio)

  ## Architecture

  ```
  ┌─────────────────────────────────────────────────────────────────┐
  │                    Voice Message Flow                           │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                  │
  │   Client                                                         │
  │   ┌──────────────┐                                              │
  │   │ Record Audio │                                              │
  │   │ (MediaRecorder)                                             │
  │   └──────┬───────┘                                              │
  │          │                                                       │
  │          ▼                                                       │
  │   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐   │
  │   │   Upload     │────▶│   Process    │────▶│    Store     │   │
  │   │   Audio      │     │   (FFmpeg)   │     │   (S3/R2)    │   │
  │   └──────────────┘     └──────────────┘     └──────────────┘   │
  │                               │                                  │
  │                               ▼                                  │
  │                        ┌──────────────┐                         │
  │                        │   Waveform   │                         │
  │                        │   Extract    │                         │
  │                        └──────────────┘                         │
  │                                                                  │
  └─────────────────────────────────────────────────────────────────┘
  ```

  ## Usage

      # Process uploaded voice message
      {:ok, voice_message} = VoiceMessage.process(user, audio_upload)

      # Get playback URL
      url = VoiceMessage.playback_url(voice_message)

      # Get waveform data for visualization
      waveform = VoiceMessage.waveform(voice_message)
  """

  use Ecto.Schema
  import Ecto.Changeset
  alias CGraph.Accounts.User
  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  # Maximum voice message duration (5 minutes)
  @max_duration_seconds 300

  # Maximum file size (10 MB)
  @max_file_size 10 * 1024 * 1024

  # Waveform samples for visualization
  @waveform_samples 100

  # Supported input MIME types
  @supported_mime_types [
    "audio/webm",
    "audio/ogg",
    "audio/mp4",
    "audio/mpeg",
    "audio/mp3",
    "audio/m4a",
    "audio/x-m4a",
    "audio/wav"
  ]

  @type t :: %__MODULE__{
    id: Ecto.UUID.t(),
    filename: String.t() | nil,
    original_filename: String.t() | nil,
    content_type: String.t() | nil,
    size: integer() | nil,
    duration: float() | nil,
    url: String.t() | nil,
    waveform: list(float()) | nil,
    transcription: String.t() | nil,
    is_processed: boolean(),
    processing_error: String.t() | nil,
    sample_rate: integer() | nil,
    channels: integer() | nil,
    bitrate: integer() | nil,
    codec: String.t() | nil,
    user_id: Ecto.UUID.t() | nil,
    message_id: Ecto.UUID.t() | nil,
    inserted_at: DateTime.t() | nil,
    updated_at: DateTime.t() | nil
  }

  schema "voice_messages" do
    field :filename, :string
    field :original_filename, :string
    field :content_type, :string
    field :size, :integer
    field :duration, :float
    field :url, :string
    field :waveform, {:array, :float}
    field :transcription, :string
    field :is_processed, :boolean, default: false
    field :processing_error, :string

    # Audio metadata
    field :sample_rate, :integer
    field :channels, :integer
    field :bitrate, :integer
    field :codec, :string

    belongs_to :user, User
    belongs_to :message, CGraph.Messaging.Message

    timestamps()
  end

  @doc """
  Changeset for creating a voice message record.
  """
  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(voice_message, attrs) do
    voice_message
    |> cast(attrs, [
      :filename, :original_filename, :content_type, :size, :duration,
      :url, :waveform, :transcription, :is_processed, :processing_error,
      :sample_rate, :channels, :bitrate, :codec, :user_id, :message_id
    ])
    |> validate_required([:filename, :content_type, :size, :user_id])
    |> validate_number(:size, less_than_or_equal_to: @max_file_size)
    |> validate_number(:duration, less_than_or_equal_to: @max_duration_seconds)
    |> validate_inclusion(:content_type, @supported_mime_types)
    |> foreign_key_constraint(:user_id)
    |> foreign_key_constraint(:message_id)
  end

  # ---------------------------------------------------------------------------
  # Delegated to VoiceMessage.Processing
  # ---------------------------------------------------------------------------

  @doc """
  Process an uploaded voice message.

  ## Steps

  1. Validate file type and size
  2. Store original file
  3. Extract audio metadata (duration, sample rate, etc.)
  4. Generate waveform visualization data
  5. Optionally transcode to Opus for optimal playback

  ## Options

  - `:transcode` - Whether to transcode audio (default: true)
  - `:extract_waveform` - Whether to generate waveform (default: true)
  - `:context` - Storage context (default: "voice")
  """
  @spec process(User.t(), map(), keyword()) :: {:ok, t()} | {:error, term()}
  def process(user, upload, opts \\ []) do
    CGraph.Messaging.VoiceMessage.Processing.process(user, upload, opts)
  end

  @doc """
  Validate an upload struct before processing.
  """
  defdelegate validate_upload(upload), to: CGraph.Messaging.VoiceMessage.Processing

  # ---------------------------------------------------------------------------
  # Simple Accessors
  # ---------------------------------------------------------------------------

  @doc """
  Get the playback URL for a voice message.
  """
  @spec playback_url(t()) :: String.t()
  def playback_url(%__MODULE__{url: url}), do: url

  @doc """
  Get waveform data for audio visualization.

  Returns an array of normalized amplitude values (0.0 to 1.0).
  """
  @spec waveform(t()) :: [float()]
  def waveform(%__MODULE__{waveform: nil}), do: List.duplicate(0.0, @waveform_samples)
  def waveform(%__MODULE__{waveform: waveform}), do: waveform

  # ---------------------------------------------------------------------------
  # Delegated to VoiceMessage.Query
  # ---------------------------------------------------------------------------

  @doc """
  List voice messages for a user.
  """
  @spec list_for_user(Ecto.UUID.t(), keyword()) :: [t()]
  def list_for_user(user_id, opts \\ []) do
    CGraph.Messaging.VoiceMessage.Query.list_for_user(user_id, opts)
  end

  @doc """
  Delete a voice message (and its file).
  """
  defdelegate delete(voice_message), to: CGraph.Messaging.VoiceMessage.Query

  @doc """
  Create a new voice message record.
  """
  defdelegate create(attrs), to: CGraph.Messaging.VoiceMessage.Query

  @doc """
  Get a voice message by ID.
  """
  defdelegate get(id), to: CGraph.Messaging.VoiceMessage.Query

  @doc """
  Get all voice messages for a user.
  Alias for list_for_user/1.
  """
  defdelegate for_user(user_id), to: CGraph.Messaging.VoiceMessage.Query

  @doc """
  Check rate limit for voice message uploads.

  Returns :ok if within limits, {:error, :rate_limited} otherwise.
  """
  defdelegate check_rate_limit(user_id), to: CGraph.Messaging.VoiceMessage.Query
end
