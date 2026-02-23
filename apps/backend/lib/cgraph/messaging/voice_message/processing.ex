defmodule CGraph.Messaging.VoiceMessage.Processing do
  @moduledoc """
  Audio processing pipeline for voice messages.

  Handles the complete processing lifecycle including:

  - Upload validation (file type, existence)
  - Audio storage via the configured storage backend
  - Metadata extraction via FFprobe (duration, sample rate, codec, etc.)
  - Waveform generation for client-side visualization
  - Transcoding to Opus format for optimal playback quality/size
  """

  require Logger

  alias CGraph.Accounts.User
  alias CGraph.Messaging.VoiceMessage
  alias CGraph.Repo

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

  # ============================================================================
  # Public API
  # ============================================================================

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
  @doc "Processes voice message audio data."
  @spec process(User.t(), map(), keyword()) :: {:ok, VoiceMessage.t()} | {:error, term()}
  def process(user, upload, opts \\ []) do
    transcode = Keyword.get(opts, :transcode, true)
    extract_waveform = Keyword.get(opts, :extract_waveform, true)
    context = Keyword.get(opts, :context, "voice")

    # Normalize upload to map format
    upload_map = case upload do
      %Plug.Upload{} = u -> %{filename: u.filename, content_type: u.content_type, path: u.path, size: nil}
      map when is_map(map) -> map
    end

    with :ok <- validate_upload(upload),
         {:ok, stored} <- store_audio(user, upload, context),
         {:ok, metadata} <- extract_metadata(stored.path),
         {:ok, waveform} <- maybe_extract_waveform(stored.path, extract_waveform),
         {:ok, _final_path, final_url} <- maybe_transcode(stored, transcode) do

      attrs = %{
        filename: stored.filename,
        original_filename: upload_map.filename,
        content_type: upload_map.content_type,
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

      %VoiceMessage{}
      |> VoiceMessage.changeset(attrs)
      |> Repo.insert()
    else
      {:error, reason} ->
        Logger.warning("voice_message_processing_failed", reason: inspect(reason))
        {:error, reason}
    end
  end

  @doc """
  Validate an upload struct before processing.

  Checks that the upload has a valid filename, content type, and that the
  referenced file exists on disk.
  """
  @spec validate_upload(map()) :: :ok | {:error, atom()}
  def validate_upload(%{filename: filename, content_type: content_type, path: path})
      when is_binary(filename) and is_binary(content_type) and is_binary(path) do
    if File.exists?(path) do
      if content_type in @supported_mime_types do
        :ok
      else
        Logger.warning("unsupported_mime_type", content_type: content_type)
        {:error, :unsupported_format}
      end
    else
      Logger.warning("upload_file_does_not_exist", path: path)
      {:error, :invalid_upload}
    end
  end

  def validate_upload(%Plug.Upload{} = upload) do
    validate_upload(%{
      filename: upload.filename,
      content_type: upload.content_type,
      path: upload.path
    })
  end

  def validate_upload(upload) do
    Logger.warning("invalid_upload_structure", upload: inspect(upload))
    {:error, :invalid_upload}
  end

  # ============================================================================
  # Audio Storage
  # ============================================================================

  defp store_audio(user, %Plug.Upload{} = upload, context) do
    store_audio(user, %{
      filename: upload.filename,
      path: upload.path,
      size: nil,
      content_type: upload.content_type
    }, context)
  end

  defp store_audio(user, upload, context) do
    ext = Path.extname(upload.filename) |> String.downcase()
    ext = if ext == "", do: ".webm", else: ext
    filename = "#{Ecto.UUID.generate()}#{ext}"

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

  # ============================================================================
  # Metadata Extraction
  # ============================================================================

  defp extract_metadata(file_path) do
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
        Logger.warning("ffprobe_failed", error: error)
        {:ok, %{
          duration: 0.0,
          sample_rate: 48_000,
          channels: 1,
          bitrate: 128_000,
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
          sample_rate: parse_int(stream["sample_rate"], 48_000),
          channels: parse_int(stream["channels"], 1),
          bitrate: parse_int(format["bit_rate"], 128_000),
          codec: stream["codec_name"] || "unknown"
        }}

      {:error, _} ->
        {:ok, %{duration: 0.0, sample_rate: 48_000, channels: 1, bitrate: 128_000, codec: "unknown"}}
    end
  end

  # ============================================================================
  # Waveform Generation
  # ============================================================================

  defp maybe_extract_waveform(_path, false), do: {:ok, nil}
  defp maybe_extract_waveform(path, true) do
    case extract_pcm_data(path) do
      {:ok, pcm_data} ->
        waveform = calculate_waveform(pcm_data, @waveform_samples)
        {:ok, waveform}

      {:error, _} ->
        {:ok, List.duplicate(0.5, @waveform_samples)}
    end
  end

  defp extract_pcm_data(path) do
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
    samples = for <<sample::little-signed-16 <- pcm_data>>, do: sample
    process_samples_to_waveform(samples, num_samples)
  end
  defp calculate_waveform(_, num_samples), do: List.duplicate(0.5, num_samples)

  defp process_samples_to_waveform([], num_samples), do: List.duplicate(0.5, num_samples)
  defp process_samples_to_waveform(samples, num_samples) do
    chunk_size = max(1, div(length(samples), num_samples))

    samples
    |> Enum.chunk_every(chunk_size)
    |> Enum.take(num_samples)
    |> Enum.map(&calculate_chunk_rms/1)
    |> pad_waveform(num_samples)
  end

  defp calculate_chunk_rms(chunk) do
    sum_squares = Enum.reduce(chunk, 0, fn sample, acc -> acc + sample * sample end)
    rms = :math.sqrt(sum_squares / length(chunk))
    min(1.0, rms / 32_767.0)
  end

  defp pad_waveform(waveform, target_length) when length(waveform) < target_length do
    waveform ++ List.duplicate(0.0, target_length - length(waveform))
  end
  defp pad_waveform(waveform, _), do: waveform

  # ============================================================================
  # Transcoding
  # ============================================================================

  defp maybe_transcode(stored, false), do: {:ok, stored.path, stored.url}
  defp maybe_transcode(stored, true) do
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
        File.rm(stored.path)
        output_url = String.replace(stored.url, Path.extname(stored.url), ".opus")
        {:ok, output_path, output_url}

      {error, _} ->
        Logger.warning("transcoding_failed", error: error)
        {:ok, stored.path, stored.url}
    end
  end

  # ============================================================================
  # Helpers
  # ============================================================================

  defp storage_backend do
    Application.get_env(:cgraph, :storage_backend, CGraph.Storage.Local)
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
