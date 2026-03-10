defmodule CGraphWeb.API.V1.FeedJSON do
  @moduledoc "JSON rendering for discovery feed responses."

  @spec index(map()) :: map()
  def index(%{threads: threads, meta: meta}) do
    %{data: Enum.map(threads, &thread_data/1), meta: meta}
  end

  defp thread_data(thread) do
    %{
      id: thread.id,
      title: thread.title,
      slug: thread.slug,
      content_preview: truncate(thread.content, 300),
      thread_type: thread.thread_type,
      is_locked: thread.is_locked,
      is_pinned: thread.is_pinned,
      is_content_gated: thread.is_content_gated || false,
      gate_price_nodes: thread.gate_price_nodes,
      view_count: thread.view_count || 0,
      reply_count: thread.reply_count || 0,
      score: thread.score || 0,
      hot_score: thread.hot_score || 0.0,
      weighted_resonates: decimal_to_float(thread.weighted_resonates),
      author: render_author(thread.author),
      board: render_board(thread.board),
      created_at: thread.inserted_at,
      updated_at: thread.updated_at
    }
  end

  defp render_author(%Ecto.Association.NotLoaded{}), do: nil
  defp render_author(nil), do: nil

  defp render_author(author) do
    %{id: author.id, username: author.username}
  end

  defp render_board(%Ecto.Association.NotLoaded{}), do: nil
  defp render_board(nil), do: nil

  defp render_board(board) do
    %{id: board.id, name: board.name, slug: Map.get(board, :slug)}
  end

  defp truncate(nil, _len), do: nil
  defp truncate(text, len) when byte_size(text) <= len, do: text
  defp truncate(text, len), do: String.slice(text, 0, len) <> "..."

  defp decimal_to_float(nil), do: 0.0
  defp decimal_to_float(%Decimal{} = d), do: Decimal.to_float(d)
  defp decimal_to_float(val) when is_float(val), do: val
  defp decimal_to_float(val) when is_integer(val), do: val * 1.0
  defp decimal_to_float(_), do: 0.0
end
