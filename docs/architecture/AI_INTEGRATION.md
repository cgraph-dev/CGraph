# AI Integration

> **Status**: Implemented (Session 34)  
> **Provider**: Configurable — OpenAI, Anthropic, Ollama  
> **Last Updated**: February 2026

---

## Overview

CGraph's AI subsystem provides LLM-powered features with automatic heuristic fallback when no LLM provider is configured. The implementation lives under the `CGraph.AI.*` namespace on the backend and `lib/ai/aiService.ts` on the web frontend.

## Implemented Features

### 1. Content Moderation (`CGraph.AI.Moderation`)
- **Status**: Implemented
- LLM-powered content safety checks with keyword-based heuristic fallback
- Detects: spam, harassment, hate speech, violence, sexual content, self-harm, scams
- Returns structured result: `%{safe, categories, confidence, action}`
- Actions: `:allow`, `:flag`, `:block`
- Integrated with the existing moderation system

### 2. Smart Replies (`CGraph.AI.SmartReplies`)
- **Status**: Implemented
- Generates 3 short reply suggestions per message
- Categories: greeting, question, thanks, agreement, info, farewell
- Supports optional conversation context
- Heuristic fallback produces pattern-matched suggestions

### 3. Conversation Summarization (`CGraph.AI.Summarizer`)
- **Status**: Implemented
- Produces structured summaries from message lists
- Output: `%{brief, detailed, key_points, action_items, decisions}`
- Heuristic fallback extracts key sentences and word-frequency topics

### 4. Sentiment Analysis (`CGraph.AI.Sentiment`)
- **Status**: Implemented
- Scores text sentiment from -1.0 to 1.0
- Classifies: `:positive`, `:negative`, `:neutral`, `:mixed`
- Returns detected emotions and confidence score

---

## Architecture

### Backend Modules

| Module                    | Responsibility                                  |
| ------------------------- | ----------------------------------------------- |
| `CGraph.AI`               | Context module — public API, rate limiting, config |
| `CGraph.AI.LLMClient`     | HTTP client for OpenAI/Anthropic/Ollama APIs     |
| `CGraph.AI.Moderation`    | Content moderation with heuristic fallback        |
| `CGraph.AI.SmartReplies`  | Smart reply suggestion generation                 |
| `CGraph.AI.Summarizer`    | Conversation summarization                        |
| `CGraph.AI.Sentiment`     | Sentiment analysis                                |

### LLM Client (`CGraph.AI.LLMClient`)

Supports three providers with a unified interface:

- **OpenAI** — `gpt-4o-mini` (default)
- **Anthropic** — Claude models via Messages API
- **Ollama** — Local models for development

Features:
- Streaming via Server-Sent Events
- Automatic retries with exponential backoff (2 retries, 500ms base)
- Circuit breaker via Fuse
- Structured JSON response parsing

### Rate Limiting

Rate limits are enforced per user tier (requests per hour):

| Tier       | Requests/Hour |
| ---------- | ------------- |
| Free       | 10            |
| Premium    | 100           |
| Enterprise | 1,000         |

### API Endpoints

All endpoints require authentication and are rate-limited per tier.

```
POST /api/v1/ai/summarize      — Conversation summarization
POST /api/v1/ai/smart-replies   — Smart reply suggestions
POST /api/v1/ai/moderate        — Content moderation check
POST /api/v1/ai/sentiment       — Sentiment analysis
```

**Controller**: `CGraphWeb.API.V1.AIController`  
**Routes**: `CGraphWeb.Router.AIRoutes`

### Web Frontend

- `apps/web/src/lib/ai/aiService.ts` — API client with configurable service settings

---

## Configuration

```elixir
# config/runtime.exs
config :cgraph, CGraph.AI,
  provider: :openai,           # :openai | :anthropic | :ollama
  model: "gpt-4o-mini",
  api_key: System.get_env("OPENAI_API_KEY"),
  base_url: "https://api.openai.com/v1",
  max_tokens: 500,
  temperature: 0.7,
  timeout: 30_000
```

### Environment Variables

```bash
# Required (pick one provider)
OPENAI_API_KEY=sk-...
# or
ANTHROPIC_API_KEY=sk-ant-...

# Optional
AI_MODEL=gpt-4o-mini
AI_MAX_TOKENS=500
AI_TEMPERATURE=0.7
AI_TIMEOUT_MS=30000
```

When no API key is configured, all modules automatically fall back to local heuristic algorithms — no external calls are made.

---

## Resilience

- **Heuristic fallback**: Every AI module has a keyword/pattern-based fallback that activates when the LLM is unavailable or returns an error
- **Circuit breaker**: `Fuse` prevents cascading failures if the LLM provider is down
- **Retries**: Exponential backoff (2 retries, 500ms base) on transient failures
- **Input truncation**: Content is sliced to safe lengths before sending to the LLM (e.g., 2000 chars for moderation, 1000 for sentiment)

## Security Considerations

1. **API Key Security**: Stored in environment variables, never in code
2. **Rate Limiting**: Per-user limits enforced by tier via `CGraph.AI`
3. **Input Sanitization**: Content is truncated before sending to LLM providers
4. **Privacy**: User PII is not sent to external AI services
5. **Cost Control**: Token limits and rate caps prevent runaway usage

---

## References

- [Anthropic API Documentation](https://docs.anthropic.com/)
- [Claude Model Card](https://www.anthropic.com/claude)
- CGraph Backend Architecture: [ARCHITECTURE.md](./ARCHITECTURE.md)
- CGraph API Reference: [API_REFERENCE.md](../api/API_REFERENCE.md)
