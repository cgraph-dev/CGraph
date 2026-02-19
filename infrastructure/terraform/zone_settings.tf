# ──────────────────────────────────────────────────────────────────────────────
# Zone Settings — SSL/TLS, Performance, Security
# Codifies settings from infrastructure/cloudflare/cdn_configuration.yaml
# ──────────────────────────────────────────────────────────────────────────────

resource "cloudflare_zone_settings_override" "main" {
  zone_id = local.zone_id

  settings {
    # ── SSL/TLS ──────────────────────────────────────────────────────────────
    ssl                      = "strict"
    min_tls_version          = "1.2"
    tls_1_3                  = "on"
    always_use_https         = "on"
    automatic_https_rewrites = "on"
    opportunistic_encryption = "on"

    security_header {
      enabled            = true
      preload            = true
      max_age            = 31536000
      include_subdomains = true
      nosniff            = true
    }

    # ── Performance ──────────────────────────────────────────────────────────
    brotli          = "on"
    early_hints     = "on"
    http3           = "on"
    zero_rtt        = "on"
    rocket_loader   = "off"
    minify {
      css  = "on"
      js   = "on"
      html = "on"
    }

    # ── Caching ──────────────────────────────────────────────────────────────
    browser_cache_ttl = 14400 # 4 hours default
    cache_level       = "aggressive"

    # ── Security ─────────────────────────────────────────────────────────────
    security_level    = "medium"
    challenge_ttl     = 1800
    browser_check     = "on"

    # ── Network ──────────────────────────────────────────────────────────────
    websockets      = "on"
    ip_geolocation  = "on"
    pseudo_ipv4     = "add_header"
  }
}

# ──────────────────────────────────────────────────────────────────────────────
# Origin Health Check — Backend API
# ──────────────────────────────────────────────────────────────────────────────

resource "cloudflare_healthcheck" "backend" {
  zone_id     = local.zone_id
  name        = "backend-health"
  description = "Fly.io backend /health endpoint check"
  address     = var.fly_backend_hostname
  type        = "HTTPS"
  port        = 443
  method      = "GET"
  path        = "/health"

  interval          = 60
  retries           = 2
  timeout           = 5
  consecutive_fails = 3
  consecutive_successes = 2

  header {
    header = "Host"
    values = ["api.${var.zone_name}"]
  }
}
