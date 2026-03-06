defmodule CGraphWeb.API.V1.StickerJSON do
  @moduledoc """
  JSON rendering for sticker resources.
  """

  alias CGraph.Stickers.{StickerPack, Sticker}

  @doc "Renders a list of sticker packs for the store."
  def store(%{packs: packs, total: total, page: page, per_page: per_page}) do
    %{
      packs: Enum.map(packs, &render_pack_preview/1),
      pagination: %{
        total: total,
        page: page,
        per_page: per_page,
        total_pages: ceil(total / max(per_page, 1))
      }
    }
  end

  @doc "Renders search results."
  def search(%{packs: packs}) do
    %{packs: Enum.map(packs, &render_pack_preview/1)}
  end

  @doc "Renders a single pack with all stickers."
  def show_pack(%{pack: pack}) do
    %{pack: render_pack_full(pack)}
  end

  @doc "Renders the user's installed packs."
  def my_packs(%{packs: packs}) do
    %{packs: Enum.map(packs, &render_pack_full/1)}
  end

  @doc "Renders recently used stickers."
  def recently_used(%{stickers: stickers}) do
    %{stickers: Enum.map(stickers, &render_sticker/1)}
  end

  @doc "Renders trending packs."
  def trending(%{packs: packs}) do
    %{packs: Enum.map(packs, &render_pack_preview/1)}
  end

  @doc "Renders the result of adding a pack."
  def add_pack(%{user_sticker_pack: usp}) do
    %{
      message: "Pack added to your collection",
      pack: render_pack_preview(usp.sticker_pack)
    }
  end

  @doc "Renders available categories."
  def categories(%{categories: categories}) do
    %{categories: categories}
  end

  # ============================================================================
  # Private Renderers
  # ============================================================================

  defp render_pack_preview(%StickerPack{} = pack) do
    %{
      id: pack.id,
      name: pack.name,
      title: pack.title,
      description: pack.description,
      author: pack.author,
      thumbnail_url: pack.thumbnail_url,
      category: pack.category,
      sticker_type: pack.sticker_type,
      is_premium: pack.is_premium,
      is_animated: pack.is_animated,
      coin_price: pack.coin_price,
      download_count: pack.download_count,
      sticker_count: pack.sticker_count,
      preview_stickers: render_stickers_if_loaded(pack.stickers)
    }
  end

  defp render_pack_full(%StickerPack{} = pack) do
    %{
      id: pack.id,
      name: pack.name,
      title: pack.title,
      description: pack.description,
      author: pack.author,
      thumbnail_url: pack.thumbnail_url,
      category: pack.category,
      sticker_type: pack.sticker_type,
      is_premium: pack.is_premium,
      is_animated: pack.is_animated,
      coin_price: pack.coin_price,
      download_count: pack.download_count,
      sticker_count: pack.sticker_count,
      stickers: render_stickers_if_loaded(pack.stickers)
    }
  end

  defp render_sticker(%Sticker{} = s) do
    %{
      id: s.id,
      emoji_shortcode: s.emoji_shortcode,
      file_url: s.file_url,
      thumbnail_url: s.thumbnail_url,
      file_type: s.file_type,
      file_size: s.file_size,
      width: s.width,
      height: s.height,
      pack_id: s.sticker_pack_id,
      pack_name: get_in_if_loaded(s, :sticker_pack, :name)
    }
  end

  defp render_stickers_if_loaded(%Ecto.Association.NotLoaded{}), do: []

  defp render_stickers_if_loaded(stickers) when is_list(stickers) do
    Enum.map(stickers, &render_sticker/1)
  end

  defp render_stickers_if_loaded(_), do: []

  defp get_in_if_loaded(%{sticker_pack: %Ecto.Association.NotLoaded{}}, :sticker_pack, _field), do: nil
  defp get_in_if_loaded(%{sticker_pack: nil}, :sticker_pack, _field), do: nil
  defp get_in_if_loaded(%{sticker_pack: pack}, :sticker_pack, field), do: Map.get(pack, field)
  defp get_in_if_loaded(_, _, _), do: nil
end
