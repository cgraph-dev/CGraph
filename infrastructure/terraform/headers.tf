# ──────────────────────────────────────────────────────────────────────────────
# Response Header Transform Rules
# Security headers, CORS, and cache headers
# ──────────────────────────────────────────────────────────────────────────────

resource "cloudflare_ruleset" "response_headers" {
  zone_id     = local.zone_id
  name        = "CGraph Response Headers"
  description = "Security and CORS response headers"
  kind        = "zone"
  phase       = "http_response_headers_transform"

  # ── Security headers on all responses ─────────────────────────────────────
  rules {
    action = "rewrite"
    action_parameters {
      headers {
        name      = "X-Content-Type-Options"
        operation = "set"
        value     = "nosniff"
      }
      headers {
        name      = "X-Frame-Options"
        operation = "set"
        value     = "DENY"
      }
      headers {
        name      = "Referrer-Policy"
        operation = "set"
        value     = "strict-origin-when-cross-origin"
      }
      headers {
        name      = "Permissions-Policy"
        operation = "set"
        value     = "camera=(), microphone=(self), geolocation=(), payment=()"
      }
    }
    expression  = "true"
    description = "Security headers — all responses"
    enabled     = true
  }

  # ── CORS headers for API ──────────────────────────────────────────────────
  rules {
    action = "rewrite"
    action_parameters {
      headers {
        name      = "Access-Control-Allow-Origin"
        operation = "set"
        value     = "https://${var.zone_name}"
      }
      headers {
        name      = "Access-Control-Allow-Methods"
        operation = "set"
        value     = "GET, POST, PUT, DELETE, OPTIONS"
      }
      headers {
        name      = "Access-Control-Allow-Headers"
        operation = "set"
        value     = "Content-Type, Authorization, X-CSRF-Token, X-Request-ID"
      }
      headers {
        name      = "Access-Control-Max-Age"
        operation = "set"
        value     = "86400"
      }
    }
    expression  = "(http.request.uri.path matches \"^/api/\")"
    description = "CORS headers — API responses"
    enabled     = true
  }
}
