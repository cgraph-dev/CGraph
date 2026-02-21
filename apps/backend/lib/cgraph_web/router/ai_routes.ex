defmodule CGraphWeb.Router.AIRoutes do
  @moduledoc """
  AI feature routes.

  Provides endpoints for LLM-powered features: summarization,
  smart replies, content moderation, and sentiment analysis.

  All endpoints require authentication and are rate-limited per tier.
  """

  defmacro ai_routes do
    quote do
      scope "/api/v1/ai", CGraphWeb.API.V1 do
        pipe_through [:api, :api_auth]

        post "/summarize", AIController, :summarize
        post "/smart-replies", AIController, :smart_replies
        post "/moderate", AIController, :moderate
        post "/sentiment", AIController, :sentiment
      end
    end
  end
end
