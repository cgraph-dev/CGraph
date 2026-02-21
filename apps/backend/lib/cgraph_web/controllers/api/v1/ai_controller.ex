defmodule CGraphWeb.API.V1.AIController do
  @moduledoc """
  AI feature endpoints.

  All endpoints require authentication. Rate limits are enforced per tier.
  """

  use CGraphWeb, :controller
  import CGraphWeb.ControllerHelpers, only: [render_data: 2, render_error: 3]

  alias CGraph.AI

  action_fallback CGraphWeb.FallbackController

  @doc """
  POST /api/v1/ai/summarize

  Summarize a conversation.

  Body: { "messages": [{ "sender": "Alice", "content": "Hello!", "timestamp": 1234 }] }
  """
  def summarize(conn, %{"messages" => messages}) do
    user = conn.assigns.current_user
    tier = user_tier(user)

    case AI.summarize(messages, user_id: user.id, tier: tier) do
      {:ok, summary} ->
        render_data(conn, summary)

      {:error, :rate_limited} ->
        render_error(conn, 429, "Rate limit exceeded")

      {:error, _reason} ->
        render_error(conn, 422, "Summarization failed")
    end
  end

  @doc """
  POST /api/v1/ai/smart-replies

  Generate smart reply suggestions.

  Body: { "message": "How are you?", "context": "optional context" }
  """
  def smart_replies(conn, %{"message" => message} = params) do
    user = conn.assigns.current_user
    tier = user_tier(user)
    context = Map.get(params, "context", "")

    case AI.smart_replies(message, user_id: user.id, tier: tier, context: context) do
      {:ok, replies} ->
        render_data(conn, replies)

      {:error, :rate_limited} ->
        render_error(conn, 429, "Rate limit exceeded")

      {:error, reason} ->
        render_error(conn, 422, to_string(reason))
    end
  end

  @doc """
  POST /api/v1/ai/moderate

  Check content for safety violations.

  Body: { "content": "text to moderate" }
  """
  def moderate(conn, %{"content" => content}) do
    user = conn.assigns.current_user
    tier = user_tier(user)

    case AI.moderate(content, user_id: user.id, tier: tier) do
      {:ok, result} ->
        render_data(conn, result)

      {:error, :rate_limited} ->
        render_error(conn, 429, "Rate limit exceeded")

      {:error, reason} ->
        render_error(conn, 422, to_string(reason))
    end
  end

  @doc """
  POST /api/v1/ai/sentiment

  Analyze text sentiment.

  Body: { "text": "I love this feature!" }
  """
  def sentiment(conn, %{"text" => text}) do
    user = conn.assigns.current_user
    tier = user_tier(user)

    case AI.analyze_sentiment(text, user_id: user.id, tier: tier) do
      {:ok, result} ->
        render_data(conn, result)

      {:error, :rate_limited} ->
        render_error(conn, 429, "Rate limit exceeded")

      {:error, reason} ->
        render_error(conn, 422, to_string(reason))
    end
  end

  # ---------------------------------------------------------------------------
  # Helpers
  # ---------------------------------------------------------------------------

  defp user_tier(user) do
    case user do
      %{subscription_tier: "enterprise"} -> :enterprise
      %{subscription_tier: "premium"} -> :premium
      _ -> :free
    end
  end
end
