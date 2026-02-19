# ──────────────────────────────────────────────────────────────────────────────
# DNS Zone & Records
# ──────────────────────────────────────────────────────────────────────────────

data "cloudflare_zone" "main" {
  name = var.zone_name
}

locals {
  zone_id = data.cloudflare_zone.main.id
}

# ── Landing (Vercel) ─────────────────────────────────────────────────────────

resource "cloudflare_record" "root" {
  zone_id = local.zone_id
  name    = "@"
  content = "cname.vercel-dns.com"
  type    = "CNAME"
  proxied = true
  ttl     = 1 # auto
  comment = "Landing page on Vercel"
}

resource "cloudflare_record" "www" {
  zone_id = local.zone_id
  name    = "www"
  content = "cname.vercel-dns.com"
  type    = "CNAME"
  proxied = true
  ttl     = 1
  comment = "Landing page www redirect"
}

# ── Web App (Cloudflare Pages) ───────────────────────────────────────────────

resource "cloudflare_record" "web" {
  zone_id = local.zone_id
  name    = "web"
  content = "cgraph-web.pages.dev"
  type    = "CNAME"
  proxied = true
  ttl     = 1
  comment = "Web app — Cloudflare Pages"
}

resource "cloudflare_record" "app" {
  zone_id = local.zone_id
  name    = "app"
  content = "cgraph-web.pages.dev"
  type    = "CNAME"
  proxied = true
  ttl     = 1
  comment = "Web app alias — Cloudflare Pages"
}

# ── API Backend (Fly.io) ─────────────────────────────────────────────────────

resource "cloudflare_record" "api" {
  zone_id = local.zone_id
  name    = "api"
  content = var.fly_backend_hostname
  type    = "CNAME"
  proxied = true
  ttl     = 1
  comment = "API backend on Fly.io"
}

# ── Documentation ────────────────────────────────────────────────────────────

resource "cloudflare_record" "docs" {
  zone_id = local.zone_id
  name    = "docs"
  content = "cgraph-web.pages.dev"
  type    = "CNAME"
  proxied = true
  ttl     = 1
  comment = "Documentation site"
}

# ── Email (SPF + DMARC) ─────────────────────────────────────────────────────

resource "cloudflare_record" "spf" {
  zone_id = local.zone_id
  name    = "@"
  content = "v=spf1 -all"
  type    = "TXT"
  ttl     = 3600
  comment = "SPF — no outbound email"
}

resource "cloudflare_record" "dmarc" {
  zone_id = local.zone_id
  name    = "_dmarc"
  content = "v=DMARC1; p=reject; rua=mailto:dmarc@cgraph.org"
  type    = "TXT"
  ttl     = 3600
  comment = "DMARC reject policy"
}
