defmodule CgraphWeb.API.V1.ThreadPostJSON do
  @moduledoc """
  JSON rendering for thread posts.
  """

  def index(%{posts: posts, meta: meta}) do
    %{
      data: Enum.map(posts, &post_data/1),
      meta: meta
    }
  end

  def show(%{post: post}) do
    %{data: post_data(post)}
  end

  defp post_data(post) do
    %{
      id: post.id,
      content: post.content,
      content_html: post.content_html,
      is_edited: post.is_edited,
      edit_count: post.edit_count,
      edit_reason: post.edit_reason,
      edited_at: post.edited_at,
      is_hidden: post.is_hidden,
      score: post.score,
      upvotes: post.upvotes,
      downvotes: post.downvotes,
      position: post.position,
      thread_id: post.thread_id,
      author_id: post.author_id,
      author: author_data(post.author),
      reply_to_id: post.reply_to_id,
      inserted_at: post.inserted_at,
      updated_at: post.updated_at
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
