defmodule CgraphWeb.API.V1.ThreadJSON do
  @moduledoc """
  JSON rendering for threads.
  """

  def index(%{threads: threads, meta: meta}) do
    %{
      data: Enum.map(threads, &thread_data/1),
      meta: meta
    }
  end

  def show(%{thread: thread}) do
    %{data: thread_data(thread)}
  end

  defp thread_data(thread) do
    %{
      id: thread.id,
      title: thread.title,
      slug: thread.slug,
      content: thread.content,
      content_html: thread.content_html,
      thread_type: thread.thread_type,
      is_locked: thread.is_locked,
      is_pinned: thread.is_pinned,
      is_hidden: thread.is_hidden,
      prefix: thread.prefix,
      prefix_color: thread.prefix_color,
      view_count: thread.view_count,
      reply_count: thread.reply_count,
      score: thread.score,
      upvotes: thread.upvotes,
      downvotes: thread.downvotes,
      last_post_at: thread.last_post_at,
      board_id: thread.board_id,
      author_id: thread.author_id,
      author: author_data(thread.author),
      last_poster: author_data(thread.last_poster),
      inserted_at: thread.inserted_at,
      updated_at: thread.updated_at
    }
  end

  defp author_data(nil), do: nil
  defp author_data(%Ecto.Association.NotLoaded{}), do: nil
  defp author_data(user) do
    %{
      id: user.id,
      username: user.username,
      avatar_url: user.avatar_url
    }
  end
end
