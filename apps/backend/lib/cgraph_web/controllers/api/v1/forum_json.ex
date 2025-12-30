defmodule CgraphWeb.API.V1.ForumJSON do
  @moduledoc """
  JSON rendering for forum responses.
  """

  alias CgraphWeb.API.V1.UserJSON

  def index(%{forums: forums, meta: meta}) do
    %{
      data: Enum.map(forums, &forum_data/1),
      meta: meta
    }
  end

  def show(%{forum: forum}) do
    %{data: forum_data(forum)}
  end

  def mod_queue(%{items: items, meta: meta}) do
    %{
      data: Enum.map(items, &mod_queue_item/1),
      meta: meta
    }
  end

  def stats(%{stats: stats}) do
    %{data: stats}
  end

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

  def leaderboard(%{forums: forums, meta: meta}) do
    %{
      data: Enum.map(forums, &forum_data_with_voting/1),
      meta: meta
    }
  end

  def top(%{forums: forums}) do
    %{
      data: Enum.map(forums, &forum_data_with_voting/1)
    }
  end

  @doc """
  Render forum data with categories and stats.
  """
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
end
