# ──────────────────────────────────────────────────────────────────────────────
# Cache Rules
# Codifies caching behavior from cdn_configuration.yaml
# ──────────────────────────────────────────────────────────────────────────────

resource "cloudflare_ruleset" "cache" {
  zone_id     = local.zone_id
  name        = "CGraph Cache Rules"
  description = "Static assets, API bypass, HTML caching"
  kind        = "zone"
  phase       = "http_request_cache_settings"

  # ── Static assets: 1 year edge + browser cache ────────────────────────────
  rules {
    action = "set_cache_settings"
    action_parameters {
      cache = true
      edge_ttl {
        mode    = "override_origin"
        default = 31536000 # 1 year
      }
      browser_ttl {
        mode    = "override_origin"
        default = 31536000
      }
    }
    expression  = "(http.request.uri.path.extension in {\"js\" \"css\" \"png\" \"jpg\" \"jpeg\" \"gif\" \"svg\" \"ico\" \"woff\" \"woff2\" \"ttf\" \"eot\"})"
    description = "Static assets — 1 year cache"
    enabled     = true
  }

  # ── API: bypass cache ─────────────────────────────────────────────────────
  rules {
    action = "set_cache_settings"
    action_parameters {
      cache = false
    }
    expression  = "(http.request.uri.path matches \"^/api/\")"
    description = "API — bypass cache"
    enabled     = true
  }

  # ── WebSockets: bypass cache ──────────────────────────────────────────────
  rules {
    action = "set_cache_settings"
    action_parameters {
      cache = false
    }
    expression  = "(http.request.uri.path matches \"^/socket/\")"
    description = "WebSocket — bypass cache"
    enabled     = true
  }

  # ── HTML: short edge cache with revalidation ──────────────────────────────
  rules {
    action = "set_cache_settings"
    action_parameters {
      cache = true
      edge_ttl {
        mode    = "override_origin"
        default = 3600 # 1 hour
      }
      browser_ttl {
        mode    = "respect_origin"
        default = 0
      }
    }
    expression  = "(http.request.uri.path.extension eq \"html\" or http.request.uri.path eq \"/\")"
    description = "HTML — 1hr edge, revalidate browser"
    enabled     = true
  }
}
