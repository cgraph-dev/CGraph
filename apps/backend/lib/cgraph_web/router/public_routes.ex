defmodule CGraphWeb.Router.PublicRoutes do
  @moduledoc """
  Public API routes that don't require authentication.

  Includes public forum browsing, tier info, RSS feeds, emojis,
  web push VAPID keys, and other publicly accessible endpoints.
  """

  defmacro public_routes do
    quote do
      # Public API routes (no auth required, allows anonymous browsing)
      scope "/api/v1", CGraphWeb.API.V1 do
        pipe_through :api_relaxed

        # Subscription tiers - public info
        get "/tiers", TierController, :index
        get "/tiers/compare", TierController, :compare
        get "/tiers/:tier", TierController, :show

        # Public forum browsing - forums are public by default
        get "/forums", ForumController, :index
        get "/forums/leaderboard", ForumController, :leaderboard
        get "/forums/top", ForumController, :top
        get "/forums/feed/popular", ForumController, :popular_feed
        get "/forums/tree", ForumHierarchyController, :tree
        get "/forums/roots", ForumHierarchyController, :roots
        get "/forums/vote-eligibility", ForumController, :vote_eligibility
        get "/forums/:id", ForumController, :show
        get "/forums/:id/contributors", ForumController, :contributors

        # Public posts browsing
        get "/forums/:forum_id/posts", PostController, :index
        get "/forums/:forum_id/posts/:id", PostController, :show

        # Public post feed (aggregated from all public forums)
        get "/posts/feed", PostController, :feed

        # RSS/Atom Feeds - Public syndication for forum content
        get "/rss/global/activity", RssController, :global_activity
        get "/rss/forums/:forum_id/threads", RssController, :forum_threads
        get "/rss/forums/:forum_id/posts", RssController, :forum_posts
        get "/rss/boards/:board_id/threads", RssController, :board_threads
        get "/rss/threads/:thread_id/posts", RssController, :thread_posts
        get "/rss/users/:user_id/activity", RssController, :user_activity

        # Web Push - VAPID key and status (public for browser subscription)
        get "/web-push/vapid-key", WebPushController, :vapid_key
        get "/web-push/status", WebPushController, :status

        # Custom Emojis - Public read access
        get "/emojis", CustomEmojiController, :index
        get "/emojis/categories", CustomEmojiController, :categories
        get "/emojis/search", CustomEmojiController, :search
        get "/emojis/popular", CustomEmojiController, :popular
        get "/emojis/:id", CustomEmojiController, :show

        # Forum Hierarchy - Public tree navigation
        get "/forums/:id/subtree", ForumHierarchyController, :subtree
        get "/forums/:id/children", ForumHierarchyController, :children
        get "/forums/:id/ancestors", ForumHierarchyController, :ancestors
        get "/forums/:id/breadcrumbs", ForumHierarchyController, :breadcrumbs

        # Public user customizations (read-only)
        get "/users/:id/customizations", CustomizationController, :show
      end
    end
  end
end
