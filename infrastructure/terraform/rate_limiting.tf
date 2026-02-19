# ──────────────────────────────────────────────────────────────────────────────
# Rate Limiting Rulesets
# Codifies rate limiting rules from cdn_configuration.yaml
# ──────────────────────────────────────────────────────────────────────────────

resource "cloudflare_ruleset" "rate_limiting" {
  zone_id     = local.zone_id
  name        = "CGraph Rate Limiting"
  description = "API, auth, and AI endpoint rate limits"
  kind        = "zone"
  phase       = "http_ratelimit"

  # ── General API: 100 requests / 10 seconds ────────────────────────────────
  rules {
    action = "block"
    action_parameters {
      response {
        status_code  = 429
        content      = "{\"error\":\"rate_limited\",\"message\":\"Too many requests\"}"
        content_type = "application/json"
      }
    }
    ratelimit {
      characteristics     = ["cf.colo.id", "ip.src"]
      period              = 10
      requests_per_period = 100
      mitigation_timeout  = 30
    }
    expression  = "(http.request.uri.path matches \"^/api/\")"
    description = "API general rate limit — 100 req/10s per IP"
    enabled     = true
  }

  # ── Auth endpoints: 10 requests / 60 seconds ──────────────────────────────
  rules {
    action = "block"
    action_parameters {
      response {
        status_code  = 429
        content      = "{\"error\":\"rate_limited\",\"message\":\"Too many auth attempts\"}"
        content_type = "application/json"
      }
    }
    ratelimit {
      characteristics     = ["cf.colo.id", "ip.src"]
      period              = 60
      requests_per_period = 10
      mitigation_timeout  = 300
    }
    expression  = "(http.request.uri.path matches \"^/api/v[0-9]+/auth/\")"
    description = "Auth rate limit — 10 req/min per IP"
    enabled     = true
  }

  # ── AI endpoints: 60 requests / 60 seconds ────────────────────────────────
  rules {
    action = "block"
    action_parameters {
      response {
        status_code  = 429
        content      = "{\"error\":\"rate_limited\",\"message\":\"AI rate limit exceeded\"}"
        content_type = "application/json"
      }
    }
    ratelimit {
      characteristics     = ["cf.colo.id", "ip.src"]
      period              = 60
      requests_per_period = 60
      mitigation_timeout  = 60
    }
    expression  = "(http.request.uri.path matches \"^/api/v[0-9]+/ai/\")"
    description = "AI rate limit — 60 req/min per IP"
    enabled     = true
  }
}
