defmodule CGraphWeb.API.V1.ForumJSON do
  @moduledoc """
  JSON rendering for forum responses.
  """

  alias CGraphWeb.API.V1.UserJSON

  @doc "Renders a list of resources as JSON."
  @spec index(map()) :: map()
  def index(%{forums: forums, meta: meta}) do
    %{
      data: Enum.map(forums, &forum_data/1),
      meta: meta
    }
  end

  @doc "Renders a single resource as JSON."
  @spec show(map()) :: map()
  def show(%{forum: forum}) do
    %{data: forum_data(forum)}
  end

  @doc "Renders the moderation queue as JSON."
  @spec mod_queue(map()) :: map()
  def mod_queue(%{items: items, meta: meta}) do
    %{
      data: Enum.map(items, &mod_queue_item/1),
      meta: meta
    }
  end

  @doc "Renders forum statistics as JSON."
  @spec stats(map()) :: map()
  def stats(%{stats: stats}) do
    %{data: stats}
  end

  @doc "Renders forum subscription status as JSON."
  @spec subscription(map()) :: map()
  def subscription(%{subscription: subscription}) do
    %{
      data: %{
        id: subscription.id,
        forum_id: subscription.forum_id,
        notify_new_posts: subscription.notify_new_posts,
        notify_replies: subscription.notify_replies,
        created_at: subscription.inserted_at
      }
    }
  end

  @doc "Renders the forum leaderboard as JSON."
  @spec leaderboard(map()) :: map()
  def leaderboard(%{forums: forums, meta: meta}) do
    %{
      data: Enum.map(forums, &forum_data_with_voting/1),
      meta: meta
    }
  end

  @doc "Renders top forum content as JSON."
  @spec top(map()) :: map()
  def top(%{forums: forums}) do
    %{
      data: Enum.map(forums, &forum_data_with_voting/1)
    }
  end

  @doc """
  Render feed (home or popular).
  """
  @spec feed(map()) :: map()
  def feed(%{posts: posts, meta: meta, feed_type: feed_type}) do
    %{
      data: Enum.map(posts, &post_data/1),
      meta: meta,
      feed_type: feed_type
    }
  end

  @doc """
  Render post data for feeds.
  """
  @spec post_data(map()) :: map()
  def post_data(post) do
    %{
      id: post.id,
      title: post.title,
      body: post.body,
      url: Map.get(post, :url),
      type: Map.get(post, :post_type, "text"),
      score: Map.get(post, :score, 0),
      upvotes: Map.get(post, :upvotes, 0),
      downvotes: Map.get(post, :downvotes, 0),
      comment_count: Map.get(post, :comment_count, 0),
      is_nsfw: Map.get(post, :is_nsfw, false),
      is_spoiler: Map.get(post, :is_spoiler, false),
      is_pinned: Map.get(post, :is_pinned, false),
      is_locked: Map.get(post, :is_locked, false),
      flair_text: Map.get(post, :flair_text),
      flair_color: Map.get(post, :flair_color),
      user_vote: Map.get(post, :user_vote, 0),
      author: render_author(post.author),
      forum: render_post_forum(Map.get(post, :forum)),
      category: render_post_category(Map.get(post, :category)),
      thumbnail_url: Map.get(post, :thumbnail_url),
      created_at: post.inserted_at,
      updated_at: post.updated_at
    }
  end

  defp render_author(nil), do: nil
  defp render_author(%Ecto.Association.NotLoaded{}), do: nil
  defp render_author(author) do
    %{
      id: author.id,
      username: author.username,
      display_name: author.display_name,
      avatar_url: author.avatar_url
    }
  end

  defp render_post_forum(nil), do: nil
  defp render_post_forum(%Ecto.Association.NotLoaded{}), do: nil
  defp render_post_forum(forum) do
    %{
      id: forum.id,
      name: forum.name,
      slug: forum.slug,
      icon: forum.icon_url
    }
  end

  defp render_post_category(nil), do: nil
  defp render_post_category(%Ecto.Association.NotLoaded{}), do: nil
  defp render_post_category(category) do
    %{
      id: category.id,
      name: category.name,
      slug: category.slug
    }
  end

  @doc """
  Render forum data with categories and stats.
  """
  @spec forum_data(map()) :: map()
  def forum_data(forum) do
    %{
      id: forum.id,
      name: forum.name,
      slug: forum.slug,
      description: forum.description,
      icon: forum.icon_url,
      banner: forum.banner_url,
      is_private: Map.get(forum, :is_private, false),
      is_public: Map.get(forum, :is_public, true),
      is_archived: Map.get(forum, :is_archived, false),
      is_nsfw: Map.get(forum, :is_nsfw, false),
      post_count: Map.get(forum, :post_count, 0),
      member_count: Map.get(forum, :member_count, 0),
      # Membership status (set by controller if user is authenticated)
      is_subscribed: Map.get(forum, :is_subscribed, false),
      is_member: Map.get(forum, :is_member, false),
      # Voting fields
      score: Map.get(forum, :score, 0),
      upvotes: Map.get(forum, :upvotes, 0),
      downvotes: Map.get(forum, :downvotes, 0),
      hot_score: Map.get(forum, :hot_score, 0.0),
      weekly_score: Map.get(forum, :weekly_score, 0),
      featured: Map.get(forum, :featured, false),
      categories: render_categories(forum.categories),
      owner: render_owner(forum.owner),
      created_at: forum.inserted_at,
      updated_at: forum.updated_at
    }
  end

  @doc """
  Render forum data with user's vote status for leaderboard.
  """
  @spec forum_data_with_voting(map()) :: map()
  def forum_data_with_voting(forum) do
    forum_data(forum)
    |> Map.put(:user_vote, Map.get(forum, :user_vote, 0))
  end

  defp render_categories(nil), do: []
  defp render_categories(%Ecto.Association.NotLoaded{}), do: []
  defp render_categories(categories) when is_list(categories) do
    Enum.map(categories, fn cat ->
      %{
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        position: cat.position,
        post_count: Map.get(cat, :post_count, 0)
      }
    end)
  end

  defp render_owner(nil), do: nil
  defp render_owner(%Ecto.Association.NotLoaded{}), do: nil
  defp render_owner(owner) do
    UserJSON.user_data(owner)
  end

  defp mod_queue_item(item) do
    %{
      id: item.id,
      type: item.type, # "post", "comment", "user"
      reason: item.reason,
      status: item.status, # "pending", "approved", "rejected"
      reported_at: item.inserted_at,
      reports_count: Map.get(item, :reports_count, 1),
      content: render_mod_content(item),
      reported_by: UserJSON.user_data(item.reporter),
      target_user: UserJSON.user_data(item.target_user)
    }
  end

  defp render_mod_content(%{type: "post", post: post}) do
    %{
      id: post.id,
      title: post.title,
      body: String.slice(post.body || "", 0, 500)
    }
  end

  defp render_mod_content(%{type: "comment", comment: comment}) do
    %{
      id: comment.id,
      body: String.slice(comment.body || "", 0, 500),
      post_id: comment.post_id
    }
  end

  defp render_mod_content(_), do: nil

  @doc """
  Render forum contributors (leaderboard within a forum).
  """
  @spec contributors(map()) :: map()
  def contributors(%{contributors: contributors, meta: meta, forum: forum}) do
    %{
      data: Enum.map(contributors, &contributor_data/1),
      meta: meta,
      forum: %{
        id: forum.id,
        name: forum.name,
        slug: forum.slug
      }
    }
  end

  defp contributor_data(%{rank: rank, user: user, forum_karma: forum_karma}) do
    %{
      rank: rank,
      forum_karma: forum_karma,
      user: %{
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        is_verified: user.is_verified || false,
        karma: user.karma || 0
      }
    }
  end
end
