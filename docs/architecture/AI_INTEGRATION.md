# AI Integration Plan

> **Status**: Placeholder - Not Yet Implemented  
> **Provider**: Claude (Anthropic)  
> **Last Updated**: January 18, 2026

---

## Overview

This document outlines the planned AI integration for CGraph using Claude (Anthropic) as the AI provider. AI features are currently disabled and reserved for future implementation.

## Planned Features

### 1. Forum Moderation
- **Description**: AI-powered content moderation for forum posts
- **Use Cases**:
  - Detect inappropriate content
  - Flag spam and low-quality posts
  - Suggest moderation actions to admins
- **Priority**: High
- **Status**: Planned

### 2. Chat Experience Enhancements
- **Description**: Intelligent suggestions to improve chat interactions
- **Use Cases**:
  - Smart reply suggestions
  - Conversation summarization
  - Topic detection and categorization
- **Priority**: Medium
- **Status**: Planned

### 3. Content Suggestions
- **Description**: AI-assisted content creation and improvement
- **Use Cases**:
  - Post title suggestions
  - Grammar and clarity improvements
  - Related content recommendations
- **Priority**: Medium
- **Status**: Planned

### 4. Smart Search
- **Description**: Enhanced search with semantic understanding
- **Use Cases**:
  - Natural language queries
  - Intent-based search results
  - Cross-forum search relevance
- **Priority**: Low
- **Status**: Planned

---

## Technical Architecture

### Provider
- **Model**: Claude 4 Opus (Anthropic)
- **Max Tokens**: 200,000
- **API**: Anthropic Messages API

### Rate Limiting (Planned)
| Tier       | Requests/Min | Tokens/Day   |
|------------|--------------|--------------|
| Free       | 10           | 10,000       |
| Premium    | 60           | 100,000      |
| Enterprise | 200          | 1,000,000    |

### Configuration

```elixir
# Backend (runtime.exs)
config :cgraph, CGraph.AI,
  enabled: true,
  model: "claude-4-opus",
  provider: "anthropic",
  api_key: System.get_env("ANTHROPIC_API_KEY"),
  features: %{
    forum_moderation: true,
    chat_suggestions: true,
    content_moderation: true,
    smart_search: true
  }
```

```typescript
// Frontend (env.ts)
ai: {
  enabled: true,
  model: 'claude-4-opus',
  features: {
    forumModeration: true,
    chatSuggestions: true,
    contentModeration: true,
    smartSearch: true,
  },
}
```

---

## Implementation Checklist

### Backend
- [ ] Create `lib/cgraph/ai/` module structure
- [ ] Implement Anthropic API client
- [ ] Add rate limiter (ETS-based)
- [ ] Add circuit breaker for resilience
- [ ] Create AI controller with endpoints
- [ ] Add feature flag checks
- [ ] Write tests

### Frontend
- [ ] Create `aiService.ts` for API calls
- [ ] Create `useAI.ts` React hook
- [ ] Integrate with chat UI (suggestions)
- [ ] Integrate with forum UI (moderation indicators)
- [ ] Add loading states and error handling

### API Endpoints (Planned)
```
GET  /api/v1/ai/status     - Check AI service status
POST /api/v1/ai/moderate   - Content moderation
POST /api/v1/ai/suggest    - Get suggestions
POST /api/v1/ai/search     - Smart search
```

---

## Environment Variables (Required for Implementation)

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...

# Optional
AI_ENABLED=true
AI_MODEL=claude-4-opus
AI_MAX_TOKENS=200000
AI_TEMPERATURE=0.7
AI_TIMEOUT_MS=30000
```

---

## Security Considerations

1. **API Key Security**: Store in environment variables, never in code
2. **Rate Limiting**: Implement per-user rate limits
3. **Content Filtering**: Pre-filter inputs before sending to AI
4. **Cost Control**: Monitor token usage, set budget alerts
5. **Privacy**: Do not send PII to AI services

---

## References

- [Anthropic API Documentation](https://docs.anthropic.com/)
- [Claude Model Card](https://www.anthropic.com/claude)
- CGraph Backend Architecture: [ARCHITECTURE.md](./ARCHITECTURE.md)
- CGraph API Reference: [API_REFERENCE.md](../api/API_REFERENCE.md)
