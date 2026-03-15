defmodule CGraph.CDN.ImageOptimizer do
  @moduledoc """
  CDN-aware image optimization extending the existing upload optimizer.

  Delegates core image operations to `CGraph.Uploads.ImageOptimizer` and
  adds CDN-specific capabilities:

  - **WebP conversion** with quality control
  - **Progressive JPEG** generation for faster perceived loading
  - **Responsive srcset** generation for multiple breakpoints
  - **Resize** with aspect-ratio preservation
  - **CDN upload** integration after optimization

  ## Usage

      # Convert to WebP
      {:ok, path} = CDN.ImageOptimizer.to_webp("/path/to/image.jpg", quality: 80)

      # Generate responsive srcset variants
      {:ok, variants} = CDN.ImageOptimizer.generate_srcset("/path/to/image.jpg",
        widths: [320, 640, 1024, 1920],
        format: :webp
      )

      # Full pipeline: optimize + upload to CDN
      {:ok, urls} = CDN.ImageOptimizer.optimize_and_upload("/path/to/image.jpg",
        cdn_key_prefix: "avatars",
        generate_srcset: true
      )
  """

  require Logger

  alias CGraph.Uploads.ImageOptimizer, as: BaseOptimizer

  # Default responsive breakpoints (in pixels)
  @default_srcset_widths [320, 640, 1024, 1440, 1920]

  # Quality defaults
  @default_webp_quality 80
  @default_jpeg_quality 85

  # ---------------------------------------------------------------------------
  # Public API — Delegated to base optimizer
  # ---------------------------------------------------------------------------

  @doc """
  Check if an image should be optimized. Delegates to the base optimizer.
  """
  @spec should_optimize?(String.t(), non_neg_integer(), boolean()) :: boolean()
  defdelegate should_optimize?(content_type, size, skip), to: BaseOptimizer, as: :should_optimize_image?

  @doc """
  Get image dimensions. Delegates to the base optimizer.
  """
  @spec get_dimensions(String.t()) ::
          {:ok, non_neg_integer(), non_neg_integer()} | {:error, atom()}
  defdelegate get_dimensions(path), to: BaseOptimizer, as: :get_image_dimensions

  @doc """
  Check WebP support. Delegates to the base optimizer.
  """
  @spec webp_supported?() :: boolean()
  defdelegate webp_supported?(), to: BaseOptimizer, as: :supports_webp?

  # ---------------------------------------------------------------------------
  # Public API — Extended CDN operations
  # ---------------------------------------------------------------------------

  @doc """
  Resize an image while preserving aspect ratio.

  ## Options

    * `:width` — target width (required)
    * `:height` — target height (optional, calculated from aspect ratio)
    * `:quality` — output quality 1-100, default 85
    * `:output` — output path (auto-generated if omitted)

  Returns `{:ok, output_path}` or `{:error, reason}`.
  """
  @spec resize(String.t(), keyword()) :: {:ok, String.t()} | {:error, term()}
  def resize(source_path, opts) do
    width = Keyword.fetch!(opts, :width)
    height = Keyword.get(opts, :height)
    quality = Keyword.get(opts, :quality, @default_jpeg_quality)
    output = Keyword.get(opts, :output, auto_output_path(source_path, "#{width}w"))

    ensure_dir(output)

    geometry =
      if height,
        do: "#{width}x#{height}>",
        else: "#{width}x>"

    args = [
      source_path,
      "-resize", geometry,
      "-strip",
      "-quality", to_string(quality),
      output
    ]

    run_convert(args, "resize", source_path, output)
  end

  @doc """
  Convert an image to WebP format.

  ## Options

    * `:quality` — WebP quality 1-100, default 80
    * `:output` — output path (auto-generated `.webp` if omitted)

  Returns `{:ok, output_path}` or `{:error, reason}`.
  """
  @spec to_webp(String.t(), keyword()) :: {:ok, String.t()} | {:error, term()}
  def to_webp(source_path, opts \\ []) do
    quality = Keyword.get(opts, :quality, @default_webp_quality)
    output = Keyword.get(opts, :output, replace_ext(source_path, ".webp"))

    ensure_dir(output)

    args = [
      source_path,
      "-strip",
      "-quality", to_string(quality),
      "-define", "webp:method=6",
      "-define", "webp:auto-filter=true",
      output
    ]

    run_convert(args, "to_webp", source_path, output)
  end

  @doc """
  Generate a progressive JPEG for faster perceived loading.

  ## Options

    * `:quality` — JPEG quality 1-100, default 85
    * `:output` — output path (auto-generated if omitted)

  Returns `{:ok, output_path}` or `{:error, reason}`.
  """
  @spec progressive_jpeg(String.t(), keyword()) :: {:ok, String.t()} | {:error, term()}
  def progressive_jpeg(source_path, opts \\ []) do
    quality = Keyword.get(opts, :quality, @default_jpeg_quality)
    output = Keyword.get(opts, :output, auto_output_path(source_path, "progressive", ".jpg"))

    ensure_dir(output)

    args = [
      source_path,
      "-strip",
      "-interlace", "JPEG",
      "-quality", to_string(quality),
      output
    ]

    run_convert(args, "progressive_jpeg", source_path, output)
  end

  @doc """
  Generate responsive image variants for use in HTML `srcset`.

  Produces resized copies at each specified width, optionally converting
  to WebP format.

  ## Options

    * `:widths` — list of widths, default `#{inspect(@default_srcset_widths)}`
    * `:format` — `:webp` | `:jpeg` | `:original`, default `:webp`
    * `:quality` — output quality. Default 80 for WebP, 85 for JPEG.
    * `:output_dir` — directory for output files (auto-generated if omitted)

  Returns `{:ok, variants}` where variants is a list of
  `%{width: integer, path: String.t(), size: integer}`.
  """
  @spec generate_srcset(String.t(), keyword()) ::
          {:ok, [%{width: pos_integer(), path: String.t(), size: non_neg_integer()}]}
          | {:error, term()}
  def generate_srcset(source_path, opts \\ []) do
    widths = Keyword.get(opts, :widths, @default_srcset_widths)
    format = Keyword.get(opts, :format, :webp)
    quality = Keyword.get(opts, :quality, default_quality(format))
    output_dir = Keyword.get(opts, :output_dir, Path.dirname(source_path))

    ensure_dir(Path.join(output_dir, "dummy"))

    # Get source dimensions to skip widths larger than original
    source_width =
      case get_dimensions(source_path) do
        {:ok, w, _h} -> w
        _ -> :infinity
      end

    effective_widths =
      widths
      |> Enum.filter(&(&1 <= source_width))
      |> Enum.sort()

    variants =
      Enum.reduce(effective_widths, [], fn width, acc ->
        ext = format_extension(format, source_path)
        basename = Path.basename(source_path, Path.extname(source_path))
        output = Path.join(output_dir, "#{basename}_#{width}w#{ext}")

        args =
          [
            source_path,
            "-resize", "#{width}x>",
            "-strip",
            "-quality", to_string(quality)
          ] ++
            format_args(format) ++
            [output]

        case run_convert(args, "srcset_#{width}w", source_path, output) do
          {:ok, path} ->
            size =
              case File.stat(path) do
                {:ok, %{size: s}} -> s
                _ -> 0
              end

            [%{width: width, path: path, size: size} | acc]

          {:error, reason} ->
            Logger.warning("srcset_variant_failed",
              width: width,
              source: source_path,
              reason: inspect(reason)
            )

            acc
        end
      end)

    variants = Enum.reverse(variants)

    Logger.info("srcset_generated",
      source: source_path,
      variant_count: length(variants),
      widths: Enum.map(variants, & &1.width)
    )

    {:ok, variants}
  end

  @doc """
  Full pipeline: optimize an image and upload all variants to CDN.

  Runs resize + WebP + progressive JPEG + srcset generation, then uploads
  all resulting files via `CGraph.CDN.CDNManager.upload_to_cdn/2`.

  ## Options

    * `:cdn_key_prefix` — CDN key prefix (e.g., `"avatars"`)
    * `:generate_srcset` — whether to generate srcset variants (default `true`)
    * `:srcset_widths` — custom breakpoints for srcset
    * `:webp` — generate WebP variant (default `true`)
    * `:progressive` — generate progressive JPEG (default `true`)

  Returns `{:ok, %{original: url, webp: url, progressive: url, srcset: [%{width, url}]}}`.
  """
  @spec optimize_and_upload(String.t(), keyword()) :: {:ok, map()} | {:error, term()}
  def optimize_and_upload(source_path, opts \\ []) do
    prefix = Keyword.get(opts, :cdn_key_prefix, "images")
    generate_srcset? = Keyword.get(opts, :generate_srcset, true)
    generate_webp? = Keyword.get(opts, :webp, true)
    generate_progressive? = Keyword.get(opts, :progressive, true)

    basename = Path.basename(source_path, Path.extname(source_path))
    tmp_dir = Path.join(System.tmp_dir!(), "cgraph_cdn_#{basename}_#{System.unique_integer([:positive])}")
    File.mkdir_p!(tmp_dir)

    try do
      result = %{original: nil, webp: nil, progressive: nil, srcset: []}
      result = upload_original(result, source_path, prefix, basename)
      result = maybe_generate_webp(result, generate_webp?, source_path, tmp_dir, prefix, basename)
      result = maybe_generate_progressive(result, generate_progressive?, source_path, tmp_dir, prefix, basename)
      result = maybe_generate_srcset(result, generate_srcset?, source_path, tmp_dir, prefix, basename)

      {:ok, result}
    after
      File.rm_rf(tmp_dir)
    end
  end

  defp upload_original(result, source_path, prefix, basename) do
    case upload_variant(source_path, prefix, basename, Path.extname(source_path)) do
      {:ok, url} -> %{result | original: url}
      _ -> result
    end
  end

  defp maybe_generate_webp(result, false, _source_path, _tmp_dir, _prefix, _basename), do: result
  defp maybe_generate_webp(result, true, source_path, tmp_dir, prefix, basename) do
    webp_out = Path.join(tmp_dir, "#{basename}.webp")

    case to_webp(source_path, output: webp_out) do
      {:ok, webp_path} ->
        case upload_variant(webp_path, prefix, basename, ".webp") do
          {:ok, url} -> %{result | webp: url}
          _ -> result
        end

      _ ->
        result
    end
  end

  defp maybe_generate_progressive(result, false, _source_path, _tmp_dir, _prefix, _basename), do: result
  defp maybe_generate_progressive(result, true, source_path, tmp_dir, prefix, basename) do
    pjpeg_out = Path.join(tmp_dir, "#{basename}_progressive.jpg")

    case progressive_jpeg(source_path, output: pjpeg_out) do
      {:ok, pjpeg_path} ->
        case upload_variant(pjpeg_path, prefix, "#{basename}_progressive", ".jpg") do
          {:ok, url} -> %{result | progressive: url}
          _ -> result
        end

      _ ->
        result
    end
  end

  defp maybe_generate_srcset(result, false, _source_path, _tmp_dir, _prefix, _basename), do: result
  defp maybe_generate_srcset(result, true, source_path, tmp_dir, prefix, basename) do
    case generate_srcset(source_path, output_dir: tmp_dir, format: :webp) do
      {:ok, variants} ->
        srcset_urls =
          Enum.map(variants, fn %{width: w, path: p} ->
            case upload_variant(p, prefix, "#{basename}_#{w}w", ".webp") do
              {:ok, url} -> %{width: w, url: url}
              _ -> nil
            end
          end)
          |> Enum.reject(&is_nil/1)

        %{result | srcset: srcset_urls}
    end
  end

  # ---------------------------------------------------------------------------
  # Private helpers
  # ---------------------------------------------------------------------------

  defp upload_variant(local_path, prefix, name, ext) do
    key = "#{prefix}/#{name}#{ext}"
    CGraph.CDN.CDNManager.upload_to_cdn(local_path, key: key)
  end

  defp run_convert(args, operation, source, output) do
    case System.cmd("convert", args, stderr_to_stdout: true) do
      {_, 0} ->
        Logger.debug("image_#{operation}_success", source: source, output: output)
        {:ok, output}

      {error, code} ->
        Logger.warning("image_#{operation}_failed",
          source: source,
          exit_code: code,
          error: String.slice(error, 0, 200)
        )

        {:error, {:convert_failed, operation, code}}
    end
  rescue
    e ->
      Logger.error("image_#{operation}_error", reason: Exception.message(e))
      {:error, {:convert_error, operation, Exception.message(e)}}
  end

  defp auto_output_path(source, suffix, ext \\ nil) do
    dir = Path.dirname(source)
    basename = Path.basename(source, Path.extname(source))
    extension = ext || Path.extname(source)
    Path.join(dir, "#{basename}_#{suffix}#{extension}")
  end

  defp replace_ext(path, new_ext) do
    dir = Path.dirname(path)
    basename = Path.basename(path, Path.extname(path))
    Path.join(dir, "#{basename}#{new_ext}")
  end

  defp ensure_dir(path) do
    path |> Path.dirname() |> File.mkdir_p!()
  end

  defp format_extension(:webp, _source), do: ".webp"
  defp format_extension(:jpeg, _source), do: ".jpg"
  defp format_extension(:original, source), do: Path.extname(source)

  defp format_args(:webp), do: ["-define", "webp:method=6"]
  defp format_args(:jpeg), do: ["-interlace", "JPEG"]
  defp format_args(_), do: []

  defp default_quality(:webp), do: @default_webp_quality
  defp default_quality(_), do: @default_jpeg_quality
end
