defmodule CgraphWeb.API.V1.VoiceMessageJSON do
  @moduledoc """
  JSON rendering for voice message responses.
  
  Provides serialization for voice message data including audio metadata,
  waveform visualization data, and playback URLs.
  """

  alias Cgraph.Messaging.VoiceMessage

  @doc """
  Render a single voice message.
  """
  def show(%{voice_message: voice_message}) do
    %{data: voice_message_data(voice_message)}
  end

  @doc """
  Render a list of voice messages.
  """
  def index(%{voice_messages: voice_messages}) do
    %{data: Enum.map(voice_messages, &voice_message_data/1)}
  end

  @doc """
  Render waveform data for audio visualization.
  """
  def waveform(%{voice_message: voice_message}) do
    %{
      data: %{
        id: voice_message.id,
        waveform: VoiceMessage.waveform(voice_message),
        duration: voice_message.duration
      }
    }
  end

  @doc """
  Render voice message metadata.
  """
  def metadata(%{voice_message: voice_message}) do
    %{
      data: %{
        id: voice_message.id,
        duration: voice_message.duration,
        sample_rate: voice_message.sample_rate,
        channels: voice_message.channels,
        bitrate: voice_message.bitrate,
        codec: voice_message.codec,
        size: voice_message.size,
        is_processed: voice_message.is_processed
      }
    }
  end

  @doc """
  Serialize voice message data to JSON-compatible map.
  """
  def voice_message_data(voice_message) do
    %{
      id: voice_message.id,
      url: VoiceMessage.playback_url(voice_message),
      duration: voice_message.duration,
      waveform: VoiceMessage.waveform(voice_message),
      content_type: voice_message.content_type,
      size: voice_message.size,
      is_processed: voice_message.is_processed,
      message_id: voice_message.message_id,
      created_at: voice_message.inserted_at
    }
  end
end
