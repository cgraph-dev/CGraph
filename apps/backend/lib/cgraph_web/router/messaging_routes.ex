defmodule CGraphWeb.Router.MessagingRoutes do
  @moduledoc """
  Messaging and real-time communication routes.

  Includes direct messages (conversations), group channels,
  reactions, and group management endpoints.
  """

  defmacro messaging_routes do
    quote do
      scope "/api/v1", CGraphWeb.API.V1 do
        pipe_through [:api, :api_auth]

        # Direct Messages (1:1)
        resources "/conversations", ConversationController, only: [:index, :show, :create] do
          # Mark entire conversation as read
          post "/read", ConversationController, :mark_read
          # Disappearing messages TTL
          put "/ttl", ConversationController, :update_ttl
          resources "/messages", MessageController, only: [:index, :create, :update, :delete] do
            post "/pin", MessageController, :pin
            delete "/pin", MessageController, :unpin
          end
          post "/messages/:id/read", MessageController, :mark_read
          post "/typing", MessageController, :typing
          # Thread replies
          get "/messages/:message_id/replies", MessageController, :thread_replies
          post "/thread-counts", MessageController, :thread_counts
          # Scheduled messages
          get "/scheduled-messages", MessageController, :list_scheduled
        end

        # Scheduled message management (outside conversation scope)
        patch "/messages/:id/reschedule", MessageController, :reschedule
        delete "/messages/:id/cancel-schedule", MessageController, :cancel_schedule

        # Message forwarding (outside conversation scope)
        post "/messages/:id/forward", MessageController, :forward

        # Saved Messages (bookmarks)
        get "/saved-messages", SavedMessageController, :index
        post "/saved-messages", SavedMessageController, :create
        delete "/saved-messages/:id", SavedMessageController, :delete

        # Group Channels
        resources "/groups", GroupController do
          resources "/channels", ChannelController do
            resources "/messages", ChannelMessageController, only: [:index, :create]
            post "/typing", ChannelMessageController, :typing
            resources "/permissions", PermissionOverwriteController, only: [:index, :create, :update, :delete]
            resources "/pins", PinnedMessageController, only: [:index, :create, :delete]
            get "/permissions/:member_id/effective", RoleController, :effective_permissions
          end

          # Channel reordering (outside nested resource to avoid :id requirement)
          put "/channels/reorder", ChannelController, :reorder

          resources "/members", GroupMemberController, only: [:index, :create, :update, :delete]
          patch "/members/me/notifications", GroupMemberController, :update_notifications
          post "/members/:id/kick", GroupMemberController, :kick
          post "/members/:id/ban", GroupMemberController, :ban
          post "/members/:id/mute", GroupMemberController, :mute

          # Ban management
          get "/bans", GroupMemberController, :list_bans
          delete "/bans/:user_id", GroupMemberController, :unban

          # Group-scoped moderation
          get "/moderation/reports", GroupModerationController, :index
          get "/moderation/reports/:id", GroupModerationController, :show
          post "/moderation/reports/:id/review", GroupModerationController, :review
          get "/moderation/stats", GroupModerationController, :stats

          resources "/roles", RoleController
          resources "/invites", InviteController, only: [:index, :create, :delete]
          resources "/categories", ChannelCategoryController
          resources "/emojis", GroupEmojiController, except: [:show]
          get "/audit-log", GroupController, :audit_log

          # Automod rules
          resources "/automod/rules", AutomodController, only: [:index, :show, :create, :update, :delete]
          patch "/automod/rules/:id/toggle", AutomodController, :toggle
        end

        # Join group via invite
        post "/invites/:code/join", InviteController, :join
        get "/invites/:code", InviteController, :show
        post "/invites/:code/accept", InviteController, :join

        # Plugin marketplace (global)
        get "/plugins/marketplace", PluginController, :marketplace
        get "/plugins/marketplace/:plugin_id", PluginController, :marketplace_show

        # Reactions (for messages)
        post "/messages/:id/reactions", ReactionController, :create
        delete "/messages/:id/reactions/:emoji", ReactionController, :delete

        # Reactions (for conversation messages)
        post "/conversations/:conversation_id/messages/:message_id/reactions", ReactionController, :create
        delete "/conversations/:conversation_id/messages/:message_id/reactions/:emoji", ReactionController, :delete

        # Sticker System
        scope "/stickers" do
          get "/store", StickerController, :store
          get "/search", StickerController, :search
          get "/categories", StickerController, :categories
          get "/trending", StickerController, :trending
          get "/my-packs", StickerController, :my_packs
          get "/recent", StickerController, :recently_used
          get "/packs/:id", StickerController, :show_pack
          post "/packs/:id/add", StickerController, :add_pack
          delete "/packs/:id/remove", StickerController, :remove_pack
        end

        # Secret Chats (Telegram-style device-bound E2EE)
        resources "/secret-chats", SecretChatController, only: [:index, :show, :create, :delete]
        put "/secret-chats/:id/timer", SecretChatController, :set_timer

        # Call History (voice/video calls)
        resources "/calls", CallController, only: [:index, :show]

        # LiveKit SFU (group voice/video calls)
        post "/livekit/token", LiveKitController, :create_token
      end
    end
  end
end
