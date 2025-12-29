defmodule CgraphWeb.API.V1.UploadJSON do
  @moduledoc """
  JSON rendering for upload responses.
  """

  def show(%{file: file}) do
    %{data: file_data(file)}
  end

  def batch(%{files: files, errors: errors}) do
    %{
      data: %{
        successful: Enum.map(files, &file_data/1),
        failed: Enum.map(errors, fn {:error, filename, reason} ->
          %{
            filename: filename,
            error: format_error(reason)
          }
        end)
      }
    }
  end

  def presign(%{presign: presign}) do
    %{
      data: %{
        upload_id: presign.upload_id,
        url: presign.url,
        fields: presign.fields,
        expires_at: presign.expires_at
      }
    }
  end

  def usage(%{usage: usage}) do
    %{
      data: %{
        used_bytes: usage.used_bytes,
        total_bytes: usage.total_bytes,
        used_percentage: usage.used_percentage,
        file_count: usage.file_count,
        breakdown: %{
          images: usage.images_bytes,
          videos: usage.videos_bytes,
          documents: usage.documents_bytes
        }
      }
    }
  end

  @doc """
  Render file data with URLs and metadata.
  """
  def file_data(file) do
    %{
      id: file.id,
      filename: file.filename,
      original_filename: file.original_filename,
      content_type: file.content_type,
      size: file.size,
      url: file.url,
      thumbnail_url: Map.get(file, :thumbnail_url),
      # Image/video specific
      width: Map.get(file, :width),
      height: Map.get(file, :height),
      duration: Map.get(file, :duration),
      # Metadata
      is_public: Map.get(file, :is_public, false),
      checksum: Map.get(file, :checksum),
      created_at: file.inserted_at
    }
  end

  defp format_error(:unsupported_file_type), do: "File type not supported"
  defp format_error({:file_too_large, type, max}), do: "#{type} exceeds maximum size of #{format_size(max)}"
  defp format_error(:upload_quota_exceeded), do: "Upload quota exceeded"
  defp format_error(:video_not_allowed_in_context), do: "Videos not allowed in this context"
  defp format_error(:documents_not_allowed_in_context), do: "Documents not allowed in this context"
  defp format_error(error), do: to_string(error)

  defp format_size(bytes) when bytes >= 1_000_000_000, do: "#{Float.round(bytes / 1_000_000_000, 1)} GB"
  defp format_size(bytes) when bytes >= 1_000_000, do: "#{Float.round(bytes / 1_000_000, 1)} MB"
  defp format_size(bytes) when bytes >= 1_000, do: "#{Float.round(bytes / 1_000, 1)} KB"
  defp format_size(bytes), do: "#{bytes} bytes"
end
