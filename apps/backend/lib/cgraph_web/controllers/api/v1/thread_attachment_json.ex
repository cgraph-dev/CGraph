defmodule CGraphWeb.API.V1.ThreadAttachmentJSON do
  @moduledoc """
  JSON rendering for thread attachments.
  """
  @spec index(map()) :: map()
  def index(%{attachments: attachments}) do
    %{data: Enum.map(attachments, &attachment_data/1)}
  end

  @doc "Renders a single attachment."
  @spec show(map()) :: map()
  def show(%{attachment: attachment}) do
    %{data: attachment_data(attachment)}
  end

  defp attachment_data(attachment) do
    %{
      id: attachment.id,
      filename: attachment.filename,
      original_filename: attachment.original_filename,
      content_type: attachment.content_type,
      file_size: attachment.file_size,
      file_url: attachment.file_url,
      is_image: attachment.is_image,
      width: attachment.width,
      height: attachment.height,
      thumbnail_url: attachment.thumbnail_url,
      download_count: attachment.download_count,
      is_inline: attachment.is_inline,
      thread_id: attachment.thread_id,
      post_id: attachment.post_id,
      uploader_id: attachment.uploader_id,
      uploader: uploader_data(attachment),
      inserted_at: attachment.inserted_at
    }
  end

  defp uploader_data(%{uploader: %Ecto.Association.NotLoaded{}}), do: nil
  defp uploader_data(%{uploader: nil}), do: nil

  defp uploader_data(%{uploader: user}) do
    %{
      id: user.id,
      username: user.username,
      avatar_url: user.avatar_url
    }
  end
end
