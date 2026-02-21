defmodule CGraph.AI do
  @moduledoc """
  AI Service Context — Server-side intelligence for CGraph.

  Provides LLM-powered features:
  - Conversation summarization
  - Smart reply suggestions
  - Content moderation
  - Sentiment analysis
  - Topic extraction

  ## Architecture

  All AI operations are rate-limited per tier:
  - Free:       10 requests/hour
  - Premium:    100 requests/hour
  - Enterprise: 1000 requests/hour

  The LLM provider is configurable via application config:

      config :cgraph, CGraph.AI,
        provider: :openai,           # :openai | :anthropic | :ollama
        model: "gpt-4o-mini",
        api_key: System.get_env("OPENAI_API_KEY"),
        base_url: "https://api.openai.com/v1",
        max_tokens: 500,
        temperature: 0.7,
        timeout: 30_000

  Falls back to local heuristic analysis when LLM is unavailable.
  """

  require Logger

  alias CGraph.AI.{Summarizer, SmartReplies, Moderation, Sentiment}

  @type tier :: :free | :premium | :enterprise
  @type ai_result :: {:ok, map()} | {:error, atom() | String.t()}

  # Rate limits per tier (requests per hour)
  @rate_limits %{
    free: 10,
    premium: 100,
    enterprise: 1000
  }

  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------

  @doc """
  Summarize a conversation.

  Returns structured summary with brief, detailed, key points,
  action items, and decisions.
  """
  @spec summarize(list(map()), keyword()) :: ai_result()
  def summarize(messages, opts \\ []) do
    with :ok <- check_rate_limit(opts[:user_id], opts[:tier] || :free) do
      Summarizer.summarize(messages, opts)
    end
  end

  @doc """
  Generate smart reply suggestions for a message.
  """
  @spec smart_replies(String.t(), keyword()) :: ai_result()
  def smart_replies(message, opts \\ []) do
    with :ok <- check_rate_limit(opts[:user_id], opts[:tier] || :free) do
      SmartReplies.generate(message, opts)
    end
  end

  @doc """
  Moderate content for safety violations.
  """
  @spec moderate(String.t(), keyword()) :: ai_result()
  def moderate(content, opts \\ []) do
    with :ok <- check_rate_limit(opts[:user_id], opts[:tier] || :free) do
      Moderation.check(content, opts)
    end
  end

  @doc """
  Analyze sentiment of text.
  """
  @spec analyze_sentiment(String.t(), keyword()) :: ai_result()
  def analyze_sentiment(text, opts \\ []) do
    with :ok <- check_rate_limit(opts[:user_id], opts[:tier] || :free) do
      Sentiment.analyze(text, opts)
    end
  end

  # ---------------------------------------------------------------------------
  # Rate Limiting
  # ---------------------------------------------------------------------------

  defp check_rate_limit(nil, _tier), do: {:error, :unauthenticated}

  defp check_rate_limit(user_id, tier) do
    limit = Map.get(@rate_limits, tier, @rate_limits.free)
    key = "ai_rate:#{user_id}"

    case CGraph.RateLimiter.check(key, :api, limit: limit, window: 3600) do
      :ok -> :ok
      {:error, :rate_limited, _info} -> {:error, :rate_limited}
    end
  rescue
    e ->
      # Fail closed on unknown errors — log and deny
      Logger.warning("Rate limiter error: #{inspect(e)}")
      {:error, :rate_limit_unavailable}
  end

  # ---------------------------------------------------------------------------
  # Configuration
  # ---------------------------------------------------------------------------

  @doc """
  Get the current AI provider configuration.
  """
  def config do
    defaults = [
      provider: :openai,
      model: "gpt-4o-mini",
      max_tokens: 500,
      temperature: 0.7,
      timeout: 30_000
    ]

    Keyword.merge(defaults, Application.get_env(:cgraph, __MODULE__, []))
  end

  @doc """
  Check if LLM provider is configured and available.
  """
  def llm_available? do
    config = config()
    config[:api_key] != nil and config[:api_key] != ""
  end
end
