defmodule CGraphWeb.API.V1.AIController do
  @moduledoc """
  AI feature endpoints.

  All endpoints require authentication. Rate limits are enforced per tier.
  """

  use CGraphWeb, :controller

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
        json(conn, %{data: summary})

      {:error, :rate_limited} ->
        conn
        |> put_status(429)
        |> json(%{error: "Rate limit exceeded", message: "AI requests are limited per your tier"})

      {:error, reason} ->
        conn
        |> put_status(422)
        |> json(%{error: "Summarization failed", message: to_string(reason)})
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
        json(conn, %{data: replies})

      {:error, :rate_limited} ->
        conn
        |> put_status(429)
        |> json(%{error: "Rate limit exceeded"})

      {:error, reason} ->
        conn
        |> put_status(422)
        |> json(%{error: to_string(reason)})
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
        json(conn, %{data: result})

      {:error, :rate_limited} ->
        conn
        |> put_status(429)
        |> json(%{error: "Rate limit exceeded"})

      {:error, reason} ->
        conn
        |> put_status(422)
        |> json(%{error: to_string(reason)})
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
        json(conn, %{data: result})

      {:error, :rate_limited} ->
        conn
        |> put_status(429)
        |> json(%{error: "Rate limit exceeded"})

      {:error, reason} ->
        conn
        |> put_status(422)
        |> json(%{error: to_string(reason)})
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
