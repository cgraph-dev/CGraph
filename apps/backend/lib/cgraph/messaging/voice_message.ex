defmodule Cgraph.Messaging.VoiceMessage do
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
  import Ecto.Query
  
  require Logger
  
  alias Cgraph.Repo
  alias Cgraph.Accounts.User
  
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
    belongs_to :message, Cgraph.Messaging.Message
    
    timestamps()
  end
  
  @doc """
  Changeset for creating a voice message record.
  """
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
    transcode = Keyword.get(opts, :transcode, true)
    extract_waveform = Keyword.get(opts, :extract_waveform, true)
    context = Keyword.get(opts, :context, "voice")
    
    with :ok <- validate_upload(upload),
         {:ok, stored} <- store_audio(user, upload, context),
         {:ok, metadata} <- extract_metadata(stored.path),
         {:ok, waveform} <- maybe_extract_waveform(stored.path, extract_waveform),
         {:ok, _final_path, final_url} <- maybe_transcode(stored, transcode) do
      
      attrs = %{
        filename: stored.filename,
        original_filename: upload.filename,
        content_type: upload.content_type,
        size: stored.size,
        duration: metadata.duration,
        url: final_url,
        waveform: waveform,
        sample_rate: metadata.sample_rate,
        channels: metadata.channels,
        bitrate: metadata.bitrate,
        codec: metadata.codec,
        user_id: user.id,
        is_processed: true
      }
      
      %__MODULE__{}
      |> changeset(attrs)
      |> Repo.insert()
    else
      {:error, reason} ->
        Logger.warning("Voice message processing failed: #{inspect(reason)}")
        {:error, reason}
    end
  end
  
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
  
  @doc """
  List voice messages for a user.
  """
  def list_for_user(user_id, opts \\ []) do
    limit = Keyword.get(opts, :limit, 50)
    offset = Keyword.get(opts, :offset, 0)
    
    from(v in __MODULE__,
      where: v.user_id == ^user_id,
      where: v.is_processed == true,
      order_by: [desc: v.inserted_at],
      limit: ^limit,
      offset: ^offset
    )
    |> Repo.all()
  end
  
  @doc """
  Delete a voice message (and its file).
  """
  def delete(%__MODULE__{} = voice_message) do
    # Delete file from storage
    delete_file(voice_message.url)
    
    # Delete record
    Repo.delete(voice_message)
    :ok
  end
  
  @doc """
  Create a new voice message record.
  """
  @spec create(map()) :: {:ok, t()} | {:error, Ecto.Changeset.t()}
  def create(attrs) do
    %__MODULE__{}
    |> changeset(attrs)
    |> Repo.insert()
  end
  
  @doc """
  Get a voice message by ID.
  """
  @spec get(Ecto.UUID.t()) :: {:ok, t()} | {:error, :not_found}
  def get(id) do
    case Repo.get(__MODULE__, id) do
      nil -> {:error, :not_found}
      voice_message -> {:ok, voice_message}
    end
  end
  
  @doc """
  Get all voice messages for a user.
  Alias for list_for_user/1.
  """
  @spec for_user(Ecto.UUID.t()) :: [t()]
  def for_user(user_id), do: list_for_user(user_id)
  
  @doc """
  Validate an upload struct before processing.
  """
  @spec validate_upload(map()) :: :ok | {:error, atom()}
  def validate_upload(%{filename: filename, content_type: content_type}) 
      when is_binary(filename) and is_binary(content_type) do
    if content_type in @supported_mime_types do
      :ok
    else
      {:error, :unsupported_format}
    end
  end
  def validate_upload(_), do: {:error, :invalid_upload}
  
  @doc """
  Check rate limit for voice message uploads.
  
  Returns :ok if within limits, {:error, :rate_limited} otherwise.
  """
  @spec check_rate_limit(Ecto.UUID.t()) :: :ok | {:error, :rate_limited}
  def check_rate_limit(user_id) do
    # Check messages in last minute
    one_minute_ago = DateTime.add(DateTime.utc_now(), -60, :second)
    
    minute_count = from(v in __MODULE__,
      where: v.user_id == ^user_id,
      where: v.inserted_at > ^one_minute_ago,
      select: count()
    )
    |> Repo.one()
    
    if minute_count >= 10 do
      {:error, :rate_limited}
    else
      # Check messages in last hour
      one_hour_ago = DateTime.add(DateTime.utc_now(), -3600, :second)
      
      hour_count = from(v in __MODULE__,
        where: v.user_id == ^user_id,
        where: v.inserted_at > ^one_hour_ago,
        select: count()
      )
      |> Repo.one()
      
      if hour_count >= 100 do
        {:error, :rate_limited}
      else
        :ok
      end
    end
  end
  
  # ============================================================================
  # Private Functions
  # ============================================================================
  
  defp store_audio(user, upload, context) do
    ext = Path.extname(upload.filename) |> String.downcase()
    ext = if ext == "", do: ".webm", else: ext
    filename = "#{Ecto.UUID.generate()}#{ext}"
    
    # Use the configured storage backend
    storage_module = storage_backend()
    
    case storage_module.store(upload.path, filename, context: context, user_id: user.id) do
      {:ok, result} ->
        {:ok, %{
          filename: filename,
          path: result.path,
          url: result.url,
          size: upload.size || File.stat!(upload.path).size
        }}
      
      {:error, reason} ->
        {:error, {:storage_failed, reason}}
    end
  end
  
  defp extract_metadata(file_path) do
    # Use ffprobe to extract audio metadata
    case System.cmd("ffprobe", [
      "-v", "quiet",
      "-print_format", "json",
      "-show_format",
      "-show_streams",
      file_path
    ], stderr_to_stdout: true) do
      {output, 0} ->
        parse_ffprobe_output(output)
      
      {error, _} ->
        Logger.warning("ffprobe failed: #{error}")
        # Return defaults if ffprobe fails
        {:ok, %{
          duration: 0.0,
          sample_rate: 48000,
          channels: 1,
          bitrate: 128000,
          codec: "unknown"
        }}
    end
  end
  
  defp parse_ffprobe_output(json_output) do
    case Jason.decode(json_output) do
      {:ok, data} ->
        format = data["format"] || %{}
        stream = List.first(data["streams"] || []) || %{}
        
        {:ok, %{
          duration: parse_float(format["duration"], 0.0),
          sample_rate: parse_int(stream["sample_rate"], 48000),
          channels: parse_int(stream["channels"], 1),
          bitrate: parse_int(format["bit_rate"], 128000),
          codec: stream["codec_name"] || "unknown"
        }}
      
      {:error, _} ->
        {:ok, %{duration: 0.0, sample_rate: 48000, channels: 1, bitrate: 128000, codec: "unknown"}}
    end
  end
  
  defp maybe_extract_waveform(_path, false), do: {:ok, nil}
  defp maybe_extract_waveform(path, true) do
    # Extract waveform using ffmpeg
    # This generates PCM data that we can analyze for amplitude
    case extract_pcm_data(path) do
      {:ok, pcm_data} ->
        waveform = calculate_waveform(pcm_data, @waveform_samples)
        {:ok, waveform}
      
      {:error, _} ->
        # Return flat waveform on error
        {:ok, List.duplicate(0.5, @waveform_samples)}
    end
  end
  
  defp extract_pcm_data(path) do
    # Extract raw PCM samples using ffmpeg
    args = [
      "-i", path,
      "-ac", "1",           # Mono
      "-ar", "8000",        # 8kHz sample rate (enough for waveform)
      "-f", "s16le",        # 16-bit signed little-endian PCM
      "-acodec", "pcm_s16le",
      "-"                   # Output to stdout
    ]
    
    case System.cmd("ffmpeg", args, stderr_to_stdout: false) do
      {pcm_data, 0} when byte_size(pcm_data) > 0 ->
        {:ok, pcm_data}
      
      _ ->
        {:error, :pcm_extraction_failed}
    end
  end
  
  defp calculate_waveform(pcm_data, num_samples) when byte_size(pcm_data) > 0 do
    # Convert binary to list of 16-bit samples
    samples = for <<sample::little-signed-16 <- pcm_data>>, do: sample
    
    if Enum.empty?(samples) do
      List.duplicate(0.5, num_samples)
    else
      # Divide samples into chunks
      chunk_size = max(1, div(length(samples), num_samples))
      
      samples
      |> Enum.chunk_every(chunk_size)
      |> Enum.take(num_samples)
      |> Enum.map(fn chunk ->
        # Calculate RMS amplitude for each chunk
        sum_squares = Enum.reduce(chunk, 0, fn sample, acc ->
          acc + sample * sample
        end)
        rms = :math.sqrt(sum_squares / length(chunk))
        
        # Normalize to 0.0-1.0 range (max 16-bit value is 32767)
        min(1.0, rms / 32767.0)
      end)
      |> pad_waveform(num_samples)
    end
  end
  defp calculate_waveform(_, num_samples), do: List.duplicate(0.5, num_samples)
  
  defp pad_waveform(waveform, target_length) when length(waveform) < target_length do
    waveform ++ List.duplicate(0.0, target_length - length(waveform))
  end
  defp pad_waveform(waveform, _), do: waveform
  
  defp maybe_transcode(stored, false), do: {:ok, stored.path, stored.url}
  defp maybe_transcode(stored, true) do
    # Skip transcoding if already in optimal format
    if String.ends_with?(stored.filename, ".opus") do
      {:ok, stored.path, stored.url}
    else
      transcode_to_opus(stored)
    end
  end
  
  defp transcode_to_opus(stored) do
    output_filename = Path.rootname(stored.filename) <> ".opus"
    output_path = Path.join(Path.dirname(stored.path), output_filename)
    
    args = [
      "-i", stored.path,
      "-c:a", "libopus",
      "-b:a", "64k",         # 64kbps is good quality for voice
      "-vbr", "on",
      "-compression_level", "10",
      "-application", "voip",
      "-y",
      output_path
    ]
    
    case System.cmd("ffmpeg", args, stderr_to_stdout: true) do
      {_, 0} ->
        # Clean up original file
        File.rm(stored.path)
        
        # Update URL
        output_url = String.replace(stored.url, Path.extname(stored.url), ".opus")
        {:ok, output_path, output_url}
      
      {error, _} ->
        Logger.warning("Transcoding failed: #{error}")
        # Fall back to original
        {:ok, stored.path, stored.url}
    end
  end
  
  defp delete_file(url) when is_binary(url) do
    storage_module = storage_backend()
    storage_module.delete(url)
  end
  defp delete_file(_), do: :ok
  
  defp storage_backend do
    Application.get_env(:cgraph, :storage_backend, Cgraph.Storage.Local)
  end
  
  defp parse_float(nil, default), do: default
  defp parse_float(val, _default) when is_float(val), do: val
  defp parse_float(val, default) when is_binary(val) do
    case Float.parse(val) do
      {f, _} -> f
      :error -> default
    end
  end
  defp parse_float(val, _default) when is_integer(val), do: val / 1.0
  defp parse_float(_, default), do: default
  
  defp parse_int(nil, default), do: default
  defp parse_int(val, _default) when is_integer(val), do: val
  defp parse_int(val, default) when is_binary(val) do
    case Integer.parse(val) do
      {i, _} -> i
      :error -> default
    end
  end
  defp parse_int(_, default), do: default
end
