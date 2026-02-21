defmodule CGraph.Uploads.ImageOptimizer do
  @moduledoc """
  Image optimization for uploads.

  Handles resizing, compression, and format conversion of uploaded images.
  Uses ImageMagick for image processing.

  Generated sizes:
  - Thumbnail (150x150) - For lists and previews
  - Preview (800x800) - For chat views
  - Optimized original - Stripped metadata, compressed
  """

  require Logger

  # Image optimization settings
  @thumbnail_size {150, 150}
  @preview_size {800, 800}
  @jpeg_quality 85

  # Size threshold for optimization (in bytes)
  @optimize_threshold 100_000

  @upload_dir "priv/static/uploads"

  @doc """
  Check if an image should be optimized based on type, size, and flags.

  Returns true if:
  - skip_optimization is false
  - content_type is an image (but not GIF or SVG)
  - size exceeds the optimization threshold (100KB)
  """
  @spec should_optimize_image?(String.t(), non_neg_integer(), boolean()) :: boolean()
  def should_optimize_image?(content_type, size, skip_optimization) do
    not skip_optimization and
    String.starts_with?(content_type, "image/") and
    content_type not in ["image/gif", "image/svg+xml"] and
    size > @optimize_threshold
  end

  @doc """
  Optimize an image by creating thumbnail, preview, and optimized original.

  Uses ImageMagick (via `System.cmd`) for image processing.
  Returns `{thumbnail_url, preview_url, original_url, dimensions}`.
  """
  @spec optimize_image(String.t(), String.t(), String.t(), String.t()) ::
          {String.t() | nil, String.t() | nil, String.t(), map()}
  def optimize_image(source_path, base_id, context, _content_type) do
    upload_path = Path.join([@upload_dir, context])

    # Determine output format (prefer WebP for better compression)
    output_ext = if supports_webp?(), do: ".webp", else: Path.extname(source_path)

    # Generate file paths
    thumb_filename = "#{base_id}_thumb#{output_ext}"
    preview_filename = "#{base_id}_preview#{output_ext}"
    optimized_filename = "#{base_id}_opt#{output_ext}"

    thumb_path = Path.join(upload_path, thumb_filename)
    preview_path = Path.join(upload_path, preview_filename)
    optimized_path = Path.join(upload_path, optimized_filename)

    # Get original dimensions
    dimensions = case get_image_dimensions(source_path) do
      {:ok, w, h} -> %{width: w, height: h}
      _ -> %{}
    end

    # Generate thumbnail (150x150)
    thumb_result = generate_resized_image(source_path, thumb_path, @thumbnail_size)

    # Generate preview (800x800)
    preview_result = generate_resized_image(source_path, preview_path, @preview_size)

    # Generate optimized original (strip metadata, optimize)
    opt_result = optimize_original(source_path, optimized_path)

    # Build URLs (only if generation succeeded)
    thumb_url = if thumb_result == :ok, do: "/uploads/#{context}/#{thumb_filename}", else: nil
    preview_url = if preview_result == :ok, do: "/uploads/#{context}/#{preview_filename}", else: nil
    original_url = if opt_result == :ok do
      "/uploads/#{context}/#{optimized_filename}"
    else
      # Fall back to original if optimization failed
      "/uploads/#{context}/#{base_id}#{Path.extname(source_path)}"
    end

    Logger.info("Image optimization complete",
      base_id: base_id,
      thumb: thumb_result == :ok,
      preview: preview_result == :ok,
      optimized: opt_result == :ok
    )

    {thumb_url, preview_url, original_url, dimensions}
  end

  @doc """
  Check if ImageMagick supports WebP format.
  Returns true if WebP is available for conversion.
  """
  @spec supports_webp?() :: boolean()
  def supports_webp? do
    case System.cmd("convert", ["-list", "format"], stderr_to_stdout: true) do
      {output, 0} -> String.contains?(output, "WEBP")
      _ -> false
    end
  rescue
    _ -> false
  end

  @doc """
  Get the dimensions (width x height) of an image file.

  Uses the system `file` command to extract dimensions from image metadata.
  """
  @spec get_image_dimensions(String.t()) ::
          {:ok, non_neg_integer(), non_neg_integer()} | {:error, atom()}
  def get_image_dimensions(path) do
    case System.cmd("file", [path], stderr_to_stdout: true) do
      {output, 0} ->
        case Regex.run(~r/(\d+)\s*x\s*(\d+)/, output) do
          [_, w, h] -> {:ok, String.to_integer(w), String.to_integer(h)}
          _ -> {:error, :unknown_dimensions}
        end
      _ ->
        {:error, :command_failed}
    end
  end

  # Private helpers

  defp generate_resized_image(source, dest, {max_width, max_height}) do
    # Use ImageMagick convert command
    # -thumbnail preserves aspect ratio and is faster than -resize
    # -strip removes EXIF metadata
    args = [
      source,
      "-thumbnail", "#{max_width}x#{max_height}>",
      "-strip",
      "-quality", "#{@jpeg_quality}",
      dest
    ]

    case System.cmd("convert", args, stderr_to_stdout: true) do
      {_, 0} -> :ok
      {error, _} ->
        Logger.warning("image_resize_failed", error: error)
        :error
    end
  rescue
    e ->
      Logger.warning("image_resize_error", e: inspect(e))
      :error
  end

  defp optimize_original(source, dest) do
    # Optimize without resizing
    args = [
      source,
      "-strip",
      "-auto-orient",
      "-quality", "#{@jpeg_quality}",
      dest
    ]

    case System.cmd("convert", args, stderr_to_stdout: true) do
      {_, 0} -> :ok
      {error, _} ->
        Logger.warning("image_optimization_failed", error: error)
        :error
    end
  rescue
    e ->
      Logger.warning("image_optimization_error", e: inspect(e))
      :error
  end
end
