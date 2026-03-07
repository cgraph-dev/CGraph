defmodule Mix.Tasks.Cgraph.Lottie.Seed do
  @moduledoc """
  Seeds the `lottie_assets` table from the Noto Emoji Animation manifest.

  Reads `priv/data/noto_emoji_manifest.json` and upserts each animated emoji
  entry into the `lottie_assets` table via `CGraph.Animations.Lottie`.

  ## Usage

      mix cgraph.lottie.seed              # Seed all animated emojis
      mix cgraph.lottie.seed --dry-run    # Preview without inserting

  ## Options

    * `--dry-run` — Print what would be seeded without writing to the database
    * `--category` — Only seed emojis from a specific category
  """
  use Mix.Task

  require Logger

  @shortdoc "Seed the lottie_assets table from the Noto Emoji manifest"

  @manifest_path "priv/data/noto_emoji_manifest.json"

  @impl Mix.Task
  def run(args) do
    {opts, _, _} =
      OptionParser.parse(args,
        strict: [dry_run: :boolean, category: :string],
        aliases: [d: :dry_run, c: :category]
      )

    dry_run? = Keyword.get(opts, :dry_run, false)
    category_filter = Keyword.get(opts, :category)

    Mix.Task.run("app.start")

    manifest = load_manifest()
    cdn_base = manifest["cdn_base"]

    emojis =
      manifest["emojis"]
      |> maybe_filter_category(category_filter)

    if dry_run? do
      Mix.shell().info("DRY RUN: Would seed #{length(emojis)} animated emojis")

      Enum.each(emojis, fn emoji ->
        Mix.shell().info("  #{emoji["emoji"]} #{emoji["codepoint"]} — #{emoji["name"]}")
      end)
    else
      results =
        Enum.map(emojis, fn emoji ->
          attrs = build_attrs(emoji, cdn_base)
          upsert_lottie_asset(attrs)
        end)

      {ok, err} = Enum.split_with(results, &match?({:ok, _}, &1))
      new_count = Enum.count(ok, fn {:ok, action} -> action == :inserted end)
      updated_count = Enum.count(ok, fn {:ok, action} -> action == :updated end)

      Mix.shell().info(
        "Seeded #{length(ok)} animated emojis (#{new_count} new, #{updated_count} updated, #{length(err)} errors)"
      )

      if length(err) > 0 do
        Enum.each(err, fn {:error, cp, reason} ->
          Mix.shell().error("  Error seeding #{cp}: #{inspect(reason)}")
        end)
      end
    end
  end

  # ============================================================================
  # Private
  # ============================================================================

  defp load_manifest do
    path = Path.join(Application.app_dir(:cgraph), @manifest_path)

    case File.read(path) do
      {:ok, content} ->
        Jason.decode!(content)

      {:error, reason} ->
        Mix.raise(
          "Failed to read manifest at #{path}: #{inspect(reason)}. " <>
            "Run `mix cgraph.lottie.build_manifest` first or ensure the file exists."
        )
    end
  end

  defp build_attrs(emoji, cdn_base) do
    %{
      codepoint: emoji["codepoint"],
      emoji: emoji["emoji"],
      name: emoji["name"],
      category: emoji["category"],
      subcategory: emoji["subcategory"],
      keywords: emoji["keywords"] || [],
      lottie_url: cdn_base <> "/" <> emoji["formats"]["lottie"],
      webp_url: cdn_base <> "/" <> emoji["formats"]["webp"],
      gif_url: cdn_base <> "/" <> emoji["formats"]["gif"],
      file_size: emoji["file_size_bytes"],
      asset_type: "emoji",
      source: "noto"
    }
  end

  defp upsert_lottie_asset(attrs) do
    alias CGraph.Animations.Lottie
    alias CGraph.Repo

    case Repo.get_by(Lottie, codepoint: attrs.codepoint, asset_type: attrs.asset_type) do
      nil ->
        case Lottie.create(attrs) do
          {:ok, _record} -> {:ok, :inserted}
          {:error, changeset} -> {:error, attrs.codepoint, changeset}
        end

      existing ->
        case Lottie.update(existing, attrs) do
          {:ok, _record} -> {:ok, :updated}
          {:error, changeset} -> {:error, attrs.codepoint, changeset}
        end
    end
  end

  defp maybe_filter_category(emojis, nil), do: emojis

  defp maybe_filter_category(emojis, category) do
    Enum.filter(emojis, &(&1["category"] == category))
  end
end
