defmodule CGraphWeb.Router.AuthRoutes do
  @moduledoc """
  Authentication route definitions.

  Includes registration, login, OAuth, wallet auth, 2FA, and session management.
  All public auth endpoints use strict rate limiting to prevent brute force attacks.
  """

  defmacro auth_routes do
    quote do
      # Public API routes (authentication endpoints - strict rate limiting)
      scope "/api/v1", CGraphWeb.API.V1 do
        pipe_through :api_auth_strict

        # Authentication - strict rate limiting to prevent brute force attacks
        post "/auth/register", AuthController, :register
        post "/auth/login", AuthController, :login
        post "/auth/login/2fa", AuthController, :verify_login_2fa
        post "/auth/refresh", AuthController, :refresh
        post "/auth/wallet/challenge", AuthController, :wallet_challenge
        post "/auth/wallet/verify", AuthController, :wallet_verify
        post "/auth/forgot-password", AuthController, :forgot_password
        post "/auth/reset-password", AuthController, :reset_password
        post "/auth/verify-email", AuthController, :verify_email
      end

      # OAuth Authentication Routes (public - strict rate limiting)
      scope "/api/v1/auth/oauth", CGraphWeb.API.V1 do
        pipe_through :api_auth_strict

        # Get available OAuth providers
        get "/providers", OAuthController, :list_providers

        # OAuth flow - authorization and callback
        get "/:provider", OAuthController, :authorize
        get "/:provider/callback", OAuthController, :callback
        post "/:provider/callback", OAuthController, :callback

        # Mobile OAuth - verify tokens from native SDKs
        post "/:provider/mobile", OAuthController, :mobile
      end

      # OAuth account linking (requires auth)
      scope "/api/v1/auth/oauth", CGraphWeb.API.V1 do
        pipe_through [:api, :api_auth]

        post "/:provider/link", OAuthController, :link
        delete "/:provider/link", OAuthController, :unlink
      end

      # Anonymous Wallet Authentication (CGraph-style) - strict rate limiting
      scope "/api/v1/auth/wallet", CGraphWeb do
        pipe_through :api_auth_strict

        post "/generate", WalletAuthController, :generate
        post "/validate-pin", WalletAuthController, :validate_pin
        post "/register", WalletAuthController, :register
        post "/login", WalletAuthController, :login
        post "/recover/code", WalletAuthController, :recover_with_code
        post "/recover/file", WalletAuthController, :recover_with_file
      end

      # Wallet linking (requires auth)
      scope "/api/v1/auth/wallet", CGraphWeb do
        pipe_through [:api, :api_auth]

        post "/link", WalletAuthController, :link_wallet
        put "/pin", WalletAuthController, :update_pin
        delete "/unlink", WalletAuthController, :unlink_wallet
      end

      # Authenticated auth actions (logout, email verification)
      scope "/api/v1", CGraphWeb.API.V1 do
        pipe_through [:api, :api_auth]

        # Authentication - logout and email verification require auth
        post "/auth/logout", AuthController, :logout
        post "/auth/resend-verification", AuthController, :resend_verification
      end

      # Two-factor authentication — strict rate limiting (20 req/60s)
      # 2FA endpoints are brute-force targets (6-digit TOTP = 1M combinations)
      scope "/api/v1", CGraphWeb.API.V1 do
        pipe_through [:api_auth_strict, :api_auth]

        get "/auth/2fa/status", TwoFactorController, :status
        post "/auth/2fa/setup", TwoFactorController, :setup
        post "/auth/2fa/enable", TwoFactorController, :enable
        post "/auth/2fa/verify", TwoFactorController, :verify
        post "/auth/2fa/disable", TwoFactorController, :disable
        post "/auth/2fa/backup-codes", TwoFactorController, :regenerate_backup_codes
        post "/auth/2fa/backup-codes/use", TwoFactorController, :use_backup_code
      end
    end
  end
end
