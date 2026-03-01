defmodule CGraphWeb.Router.UserRoutes do
  @moduledoc """
  Authenticated user-centric routes.

  Includes current user profile, settings, friends, notifications,
  search, file uploads, and user discovery endpoints.
  """

  defmacro user_routes do
    quote do
      scope "/api/v1", CGraphWeb.API.V1 do
        pipe_through [:api, :api_auth]

        # Tier Limits & Subscription Features
        get "/tiers/me", TierController, :my_tier
        get "/tiers/check/:action", TierController, :check_action
        get "/tiers/features/:feature", TierController, :check_feature

        # Current user
        get "/me", UserController, :me
        put "/me", UserController, :update
        put "/me/username", UserController, :change_username
        delete "/me", UserController, :delete
        post "/me/avatar", UserController, :upload_avatar
        get "/me/sessions", UserController, :sessions
        delete "/me/sessions/:id", UserController, :revoke_session
        post "/me/export", UserController, :request_data_export
        post "/me/onboarding/complete", UserController, :complete_onboarding
        post "/me/delete-account", AccountDeletionController, :create
        delete "/me/delete-account", AccountDeletionController, :delete

        # User Settings
        get "/settings", SettingsController, :show
        put "/settings", SettingsController, :update
        put "/settings/notifications", SettingsController, :update_notifications
        put "/settings/privacy", SettingsController, :update_privacy
        put "/settings/appearance", SettingsController, :update_appearance
        put "/settings/locale", SettingsController, :update_locale
        post "/settings/reset", SettingsController, :reset

        # Theme Endpoints (Global Theme System)
        get "/users/:id/theme", ThemeController, :show
        put "/users/:id/theme", ThemeController, :update
        post "/users/:id/theme/reset", ThemeController, :reset
        post "/users/themes/batch", ThemeController, :batch
        get "/themes/default", ThemeController, :default
        get "/themes/presets", ThemeController, :presets

        # Global Leaderboard
        get "/leaderboard", LeaderboardController, :index

        # Users
        get "/users/leaderboard", UserController, :leaderboard
        get "/users/check-username", UserController, :check_username_availability
        resources "/users", UserController, only: [:index, :show]
        get "/users/:username/profile", UserController, :profile
        get "/users/:id/presence", UserController, :presence
        post "/users/presence/bulk", UserController, :bulk_presence

        # User Customizations
        put "/users/:id/customizations", CustomizationController, :update
        patch "/users/:id/customizations", CustomizationController, :patch
        delete "/users/:id/customizations", CustomizationController, :delete

        # My Customizations
        get "/me/customizations", CustomizationController, :my_customizations
        patch "/me/customizations", CustomizationController, :update_my_customizations
        delete "/me/customizations", CustomizationController, :delete_my_customizations

        # Avatar Border Configuration
        get "/users/:id/avatar-border", UserController, :get_avatar_border
        get "/me/avatar-border", UserController, :get_my_avatar_border
        patch "/me/avatar-border", UserController, :update_avatar_border

        # Search
        get "/search", SearchController, :index
        get "/search/users", SearchController, :users
        get "/search/messages", SearchController, :messages
        get "/search/posts", SearchController, :posts
        get "/search/groups", SearchController, :groups
        get "/search/suggestions", SearchController, :suggestions
        get "/search/recent", SearchController, :recent
        delete "/search/recent", SearchController, :clear_history

        # Notifications
        get "/notifications", NotificationController, :index
        put "/notifications/read_all", NotificationController, :mark_all_read
        post "/notifications/read", NotificationController, :mark_all_read
        get "/notifications/:id", NotificationController, :show
        post "/notifications/:id/read", NotificationController, :mark_read
        delete "/notifications/:id", NotificationController, :delete

        # Notification Preferences (per-conversation/channel/group)
        get "/notification-preferences", NotificationPreferenceController, :index
        get "/notification-preferences/:target_type/:target_id", NotificationPreferenceController, :show
        put "/notification-preferences/:target_type/:target_id", NotificationPreferenceController, :upsert
        delete "/notification-preferences/:target_type/:target_id", NotificationPreferenceController, :delete

        # Push notification tokens
        post "/push-tokens", PushTokenController, :create
        delete "/push-tokens/:token", PushTokenController, :delete

        # Web Push subscriptions (authenticated)
        post "/web-push/subscribe", WebPushController, :subscribe
        delete "/web-push/unsubscribe", WebPushController, :unsubscribe
        post "/web-push/test", WebPushController, :test

        # File uploads
        post "/upload", UploadController, :create
        post "/uploads", UploadController, :create
        post "/uploads/presigned", UploadController, :presigned
        get "/files/:id", UploadController, :show

        # Voice Messages
        post "/voice-messages", VoiceMessageController, :create
        get "/voice-messages/:id", VoiceMessageController, :show
        get "/voice-messages/:id/waveform", VoiceMessageController, :waveform
        delete "/voice-messages/:id", VoiceMessageController, :delete

        # GIF Search (Tenor API proxy)
        get "/gifs/search", GifController, :search
        get "/gifs/trending", GifController, :trending

        # Friends
        get "/friends/requests", FriendController, :requests
        get "/friends/sent", FriendController, :sent
        get "/friends/pending", FriendController, :pending
        get "/friends/suggestions", FriendController, :suggestions
        post "/friends/:id/accept", FriendController, :accept
        post "/friends/:id/decline", FriendController, :decline
        post "/friends/:id/block", FriendController, :block
        delete "/friends/:id/block", FriendController, :unblock
        get "/friends/:id/mutual", FriendController, :mutual
        resources "/friends", FriendController, only: [:index, :show, :create, :delete]

        # Content Reports
        resources "/reports", ReportController, only: [:index, :show, :create]

        # Custom Emojis (authenticated)
        get "/emojis/favorites", CustomEmojiController, :favorites
        get "/emojis/recent", CustomEmojiController, :recent
        post "/emojis", CustomEmojiController, :create
        put "/emojis/:id", CustomEmojiController, :update
        delete "/emojis/:id", CustomEmojiController, :delete
        post "/emojis/:id/use", CustomEmojiController, :use
        post "/emojis/:id/favorite", CustomEmojiController, :add_favorite
        delete "/emojis/:id/favorite", CustomEmojiController, :remove_favorite
        post "/emojis/categories", CustomEmojiController, :create_category
        put "/emojis/categories/:id", CustomEmojiController, :update_category
        delete "/emojis/categories/:id", CustomEmojiController, :delete_category

        # E2EE Key Management
        post "/e2ee/keys", E2EEController, :register_keys
        post "/e2ee/keys/prekeys", E2EEController, :replenish_prekeys
        get "/e2ee/keys/count", E2EEController, :prekey_count
        get "/e2ee/keys/:user_id", E2EEController, :get_prekey_bundle
        get "/e2ee/devices", E2EEController, :list_devices
        delete "/e2ee/devices/:device_id", E2EEController, :remove_device
        get "/e2ee/safety-number/:user_id", E2EEController, :safety_number
        post "/e2ee/keys/:key_id/verify", E2EEController, :verify_key
        post "/e2ee/keys/:key_id/revoke", E2EEController, :revoke_key

        # E2EE Cross-Signing & Key Sync
        post "/e2ee/devices/:device_id/cross-sign", E2EEController, :cross_sign_device
        get "/e2ee/devices/trust-chain", E2EEController, :device_trust_chain
        post "/e2ee/devices/:device_id/sync", E2EEController, :sync_keys
        get "/e2ee/devices/sync-packages", E2EEController, :get_sync_packages

        # MyBB Feature: Private Messages (PM)
        get "/pm/folders", PMController, :list_folders
        post "/pm/folders", PMController, :create_folder
        put "/pm/folders/:id", PMController, :update_folder
        delete "/pm/folders/:id", PMController, :delete_folder
        get "/pm/messages", PMController, :list_messages
        get "/pm/messages/:id", PMController, :show_message
        post "/pm/messages", PMController, :send_message
        put "/pm/messages/:id", PMController, :update_message
        delete "/pm/messages/:id", PMController, :delete_message
        post "/pm/messages/:id/read", PMController, :mark_read
        post "/pm/messages/:id/move", PMController, :move_to_folder
        post "/pms", PMController, :send_message
        get "/pm/drafts", PMController, :list_drafts
        post "/pm/drafts", PMController, :save_draft
        put "/pm/drafts/:id", PMController, :update_draft
        delete "/pm/drafts/:id", PMController, :delete_draft
        post "/pm/drafts/:id/send", PMController, :send_draft
        get "/pm/stats", PMController, :stats
        post "/pm/export", PMController, :export

        # Announcements
        get "/announcements", AnnouncementController, :index
        get "/announcements/:id", AnnouncementController, :show
        post "/announcements/:id/read", AnnouncementController, :mark_read
        post "/announcements/:id/dismiss", AnnouncementController, :dismiss

        # Calendar & Events
        get "/calendar/events", CalendarController, :list_events
        get "/calendar/events/:id", CalendarController, :show_event
        post "/calendar/events", CalendarController, :create_event
        put "/calendar/events/:id", CalendarController, :update_event
        delete "/calendar/events/:id", CalendarController, :delete_event
        get "/calendar/categories", CalendarController, :list_categories
        post "/calendar/categories", CalendarController, :create_category
        put "/calendar/categories/:id", CalendarController, :update_category
        delete "/calendar/categories/:id", CalendarController, :delete_category
        get "/calendar/events/:id/rsvps", CalendarController, :list_rsvps
        post "/calendar/events/:id/rsvp", CalendarController, :rsvp
        delete "/calendar/events/:id/rsvp", CalendarController, :cancel_rsvp

        # Referral System
        get "/referrals/code", ReferralController, :get_code
        post "/referrals/code/regenerate", ReferralController, :regenerate_code
        get "/referrals", ReferralController, :list_referrals
        get "/referrals/pending", ReferralController, :list_pending
        get "/referrals/stats", ReferralController, :stats
        get "/referrals/leaderboard", ReferralController, :leaderboard
        get "/referrals/rewards", ReferralController, :list_reward_tiers
        post "/referrals/rewards/:id/claim", ReferralController, :claim_reward
        get "/referrals/validate/:code", ReferralController, :validate_code
        post "/referrals/apply", ReferralController, :apply_code

        # Member List & Discovery
        get "/members", MemberController, :index
        get "/members/:id", MemberController, :show
        get "/user-groups", MemberController, :list_groups

        # Presence & Who's Online
        get "/presence/online", PresenceController, :online_users
        post "/presence/heartbeat", PresenceController, :heartbeat
        get "/presence/stats", PresenceController, :stats

        # User Profile Enhancements
        get "/profile", ProfileController, :me
        put "/profile", ProfileController, :update_me
        get "/profiles/:username", ProfileController, :show
        put "/profiles/signature", ProfileController, :update_signature
        put "/profiles/bio", ProfileController, :update_bio
        get "/profiles/:username/posts", ProfileController, :posts
        get "/profiles/:username/threads", ProfileController, :threads
        get "/profiles/:username/reputation", ProfileController, :reputation
        post "/profiles/:username/reputation", ProfileController, :give_reputation
      end

      # Billing, Subscriptions & Username routes (controllers outside V1 namespace)
      scope "/api/v1" do
        pipe_through [:api, :api_auth]

        # Billing & Payments (Stripe Integration)
        get "/billing/plans", CGraphWeb.Api.PaymentController, :plans
        get "/billing/status", CGraphWeb.Api.PaymentController, :billing_status
        post "/billing/checkout", CGraphWeb.Api.PaymentController, :create_checkout
        post "/billing/portal", CGraphWeb.Api.PaymentController, :create_portal

        # Forum Subscriptions
        get "/forum/subscriptions", CGraphWeb.API.SubscriptionController, :index
        post "/forum/subscriptions", CGraphWeb.API.SubscriptionController, :create
        put "/forum/subscriptions/:id", CGraphWeb.API.SubscriptionController, :update
        delete "/forum/subscriptions/:id", CGraphWeb.API.SubscriptionController, :delete
        post "/forum/subscriptions/bulk-update", CGraphWeb.API.SubscriptionController, :bulk_update
        post "/forum/subscriptions/toggle-thread", CGraphWeb.API.SubscriptionController, :toggle_thread

        # Username Management
        get "/users/check-username", CGraphWeb.API.UsernameController, :check_availability
        post "/users/me/change-username", CGraphWeb.API.UsernameController, :change_username
        get "/users/me/username-history", CGraphWeb.API.UsernameController, :history
        get "/users/me/username-cooldown", CGraphWeb.API.UsernameController, :cooldown_status
      end
    end
  end
end
