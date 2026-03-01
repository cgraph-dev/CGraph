defmodule CGraphWeb.Router.ForumRoutes do
  @moduledoc """
  Forum, board, thread, and post routes.

  Includes forum CRUD, hierarchy management, boards, threads,
  permissions, secondary groups, and voting.
  """

  defmacro forum_routes do
    quote do
      scope "/api/v1", CGraphWeb.API.V1 do
        pipe_through [:api, :api_auth]

        # Home feed - posts from forums the user has joined (requires auth)
        get "/forums/feed/home", ForumController, :home_feed

        # Standalone post lookup (used by multi-quote and cross-references)
        get "/posts/:id", PostController, :show_by_id

        # Vote eligibility check
        get "/forums/vote-eligibility", ForumController, :vote_eligibility

        # Forum Hierarchy - Authenticated operations
        put "/forums/:id/move", ForumHierarchyController, :move
        put "/forums/:id/reorder", ForumHierarchyController, :reorder
        put "/forums/:id/hierarchy", ForumHierarchyController, :update_hierarchy
        post "/forums/:id/create_subforum", ForumHierarchyController, :create_subforum

        resources "/forums", ForumController, except: [:index, :show] do
          resources "/posts", PostController do
            post "/vote", PostController, :vote
            post "/save", PostController, :save
            resources "/comments", CommentController do
              post "/vote", CommentController, :vote
            end
          end

          resources "/categories", CategoryController
          get "/modqueue", ForumController, :mod_queue

          # Forum voting (competition)
          post "/vote", ForumController, :vote
          get "/vote", ForumController, :get_vote
          delete "/vote", ForumController, :remove_vote

          # Forum permissions
          get "/permissions", PermissionsController, :forum_permissions
          put "/permissions", PermissionsController, :update_forum_permissions
          delete "/permissions/:group_id", PermissionsController, :delete_forum_permission
          get "/permission-templates", PermissionsController, :list_templates
          post "/permission-templates", PermissionsController, :create_template

          # MyBB-style boards
          resources "/boards", BoardController, except: [:new, :edit] do
            get "/by-slug/:slug", BoardController, :show_by_slug
          end

          # Forum threads
          get "/threads", ThreadController, :forum_threads

          # Forum plugins
          resources "/plugins", PluginController, except: [:new, :edit] do
            post "/toggle", PluginController, :toggle
          end

          # Forum moderation (warnings, automod, stats)
          scope "/moderation" do
            get "/queue", ForumModerationController, :queue
            post "/action", ForumModerationController, :action
            get "/warnings", ForumModerationController, :warnings
            post "/warn", ForumModerationController, :warn
            get "/automod", ForumModerationController, :automod
            put "/automod", ForumModerationController, :update_automod
            get "/stats", ForumModerationController, :stats
          end

          # Forum customization engine (55 options, 8 categories)
          get "/customization", ForumCustomizationController, :show
          get "/customization/options", ForumCustomizationController, :list_options
          put "/customization/:category", ForumCustomizationController, :update
          delete "/customization/:category", ForumCustomizationController, :reset
          post "/customization/preview", ForumCustomizationController, :preview

          # Custom fields CRUD
          get "/custom-fields", ForumCustomizationController, :list_fields
          post "/custom-fields", ForumCustomizationController, :create_field
          put "/custom-fields/:id", ForumCustomizationController, :update_field
          delete "/custom-fields/:id", ForumCustomizationController, :delete_field
          # Emoji Packs
          get "/emoji-packs", CustomEmojiController, :list_packs
          get "/emoji-packs/:id/export", CustomEmojiController, :export_pack
          post "/emoji-packs/import", CustomEmojiController, :import_pack

          # Post Icons
          get "/boards/:board_id/post-icons", PostIconController, :board_icons
          # Forum theme CRUD (separate from user profile ThemeController)
          resources "/themes", ForumThemeCrudController, except: [:new, :edit] do
            post "/activate", ForumThemeCrudController, :activate
          end
        end

        # Board Permissions
        get "/boards/:board_id/permissions", PermissionsController, :board_permissions
        put "/boards/:board_id/permissions", PermissionsController, :update_board_permissions
        delete "/boards/:board_id/permissions/:group_id", PermissionsController, :delete_board_permission
        post "/boards/:board_id/apply-template", PermissionsController, :apply_template_to_board
        get "/boards/:board_id/check-permission", PermissionsController, :check_board_permission
        get "/boards/:board_id/my-permissions", PermissionsController, :my_board_permissions

        # System permission templates
        get "/permission-templates", PermissionsController, :list_system_templates
        delete "/permission-templates/:id", PermissionsController, :delete_template

        # Emoji Packs marketplace (global)
        get "/emoji-packs/marketplace", CustomEmojiController, :marketplace

        # Boards -> Threads
        resources "/boards", BoardController, only: [] do
          resources "/threads", ThreadController, except: [:new, :edit] do
            get "/by-slug/:slug", ThreadController, :show_by_slug
            post "/pin", ThreadController, :pin
            post "/lock", ThreadController, :lock
            post "/vote", ThreadController, :vote
          end
        end

        # Threads -> Posts (replies)
        resources "/threads", ThreadController, only: [] do
          resources "/posts", ThreadPostController, except: [:new, :edit] do
            post "/vote", ThreadPostController, :vote
          end

          # Thread polls
          get "/poll", PollController, :show
          post "/poll", PollController, :create
          put "/poll", PollController, :update
          post "/poll/vote", PollController, :vote
          post "/poll/close", PollController, :close

          # Thread attachments
          get "/attachments", ThreadAttachmentController, :index
          post "/attachments", ThreadAttachmentController, :upload
          delete "/attachments/:id", ThreadAttachmentController, :delete
        end

        # Standalone thread routes
        get "/threads/:id", ThreadController, :show

        # Forum > Board > Threads nested route
        get "/forums/:forum_id/boards/:board_id/threads", ThreadController, :index
        post "/forums/:forum_id/boards/:board_id/threads", ThreadController, :create

        # Secondary Groups & Auto-Assignment Rules
        get "/forums/:forum_id/members/:member_id/groups", SecondaryGroupsController, :member_groups
        get "/forums/:forum_id/my-groups", SecondaryGroupsController, :my_groups
        post "/forums/:forum_id/members/:member_id/secondary-groups", SecondaryGroupsController, :add_secondary_group
        delete "/forums/:forum_id/members/:member_id/secondary-groups/:group_id", SecondaryGroupsController, :remove_secondary_group
        put "/forums/:forum_id/members/:member_id/display-group", SecondaryGroupsController, :set_display_group

        # Auto-assignment rules
        get "/forums/:forum_id/group-rules", SecondaryGroupsController, :list_rules
        post "/forums/:forum_id/groups/:group_id/rules", SecondaryGroupsController, :create_rule
        post "/forums/:forum_id/evaluate-rules", SecondaryGroupsController, :evaluate_rules
        put "/group-rules/:id", SecondaryGroupsController, :update_rule
        delete "/group-rules/:id", SecondaryGroupsController, :delete_rule
        get "/group-rules/templates", SecondaryGroupsController, :rule_templates
      end
    end
  end
end
