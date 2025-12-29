defmodule CgraphWeb.API.V1.PostJSON do
  @moduledoc """
  JSON rendering for post responses.
  """

  alias CgraphWeb.API.V1.UserJSON

  def index(%{posts: posts, meta: meta}) do
    %{
      data: Enum.map(posts, &post_data/1),
      meta: meta
    }
  end

  def show(%{post: post}) do
    %{data: post_data(post)}
  end

  @doc """
  Renders vote response with updated post scores.
  Vote schema uses `value` (1 or -1) which we convert to :up/:down for API.
  """
  def vote(%{vote: vote, post: post}) do
    # Convert vote.value to vote_type for API response
    vote_type = case vote.value do
      1 -> :up
      -1 -> :down
      _ -> nil
    end
    
    %{
      data: %{
        vote_type: vote_type,
        score: post.score,
        upvotes: post.upvotes,
        downvotes: post.downvotes
      }
    }
  end

  def report(%{report: report}) do
    %{
      data: %{
        id: report.id,
        status: "submitted",
        message: "Report submitted successfully"
      }
    }
  end

  @doc """
  Render post data with author, category, and vote status.
  """
  def post_data(post) do
    %{
      id: post.id,
      title: post.title,
      body: post.content,
      slug: Map.get(post, :slug),
      forum_id: post.forum_id,
      category_id: post.category_id,
      # Voting
      score: Map.get(post, :score, 0),
      upvotes: Map.get(post, :upvotes, 0),
      downvotes: Map.get(post, :downvotes, 0),
      user_vote: Map.get(post, :user_vote), # :up, :down, or nil
      # Engagement
      comment_count: Map.get(post, :comment_count, 0),
      view_count: Map.get(post, :view_count, 0),
      # Status flags
      is_pinned: Map.get(post, :is_pinned, false),
      is_locked: Map.get(post, :is_locked, false),
      is_nsfw: Map.get(post, :is_nsfw, false),
      is_spoiler: Map.get(post, :is_spoiler, false),
      # Media
      link: Map.get(post, :url),
      thumbnail: Map.get(post, :thumbnail_url),
      media: render_media(Map.get(post, :images, [])),
      # Flair
      flair: render_flair(Map.get(post, :flair_text)),
      # Author
      author: render_author(Map.get(post, :author)),
      # Category
      category: render_category(Map.get(post, :category)),
      # Timestamps
      created_at: post.inserted_at,
      updated_at: post.updated_at,
      edited_at: Map.get(post, :edited_at)
    }
  end

  defp render_media(nil), do: []
  defp render_media(media) when is_list(media) do
    Enum.map(media, fn m ->
      %{
        type: m.type,
        url: m.url,
        thumbnail: m.thumbnail,
        width: m.width,
        height: m.height
      }
    end)
  end

  defp render_flair(nil), do: nil
  # Handle flair as a text field with optional color
  defp render_flair(nil), do: nil
  defp render_flair(text) when is_binary(text) do
    %{text: text, color: nil, background_color: nil}
  end
  defp render_flair(flair) when is_map(flair) do
    %{
      id: Map.get(flair, :id),
      text: Map.get(flair, :text),
      color: Map.get(flair, :color),
      background_color: Map.get(flair, :background_color)
    }
  end

  defp render_author(nil), do: nil
  defp render_author(%Ecto.Association.NotLoaded{}), do: nil
  defp render_author(user) do
    UserJSON.user_data(user)
  end

  defp render_category(nil), do: nil
  defp render_category(%Ecto.Association.NotLoaded{}), do: nil
  defp render_category(category) do
    %{
      id: category.id,
      name: category.name,
      slug: category.slug
    }
  end
end
