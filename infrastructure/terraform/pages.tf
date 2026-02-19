# ──────────────────────────────────────────────────────────────────────────────
# Cloudflare Pages — Web App
# ──────────────────────────────────────────────────────────────────────────────

resource "cloudflare_pages_project" "web" {
  account_id        = var.cloudflare_account_id
  name              = "cgraph-web"
  production_branch = "main"

  build_config {
    build_command   = "pnpm --filter @cgraph/web build"
    destination_dir = "apps/web/dist"
    root_dir        = ""
  }

  deployment_configs {
    production {
      environment_variables = {
        NODE_VERSION = "22"
        PNPM_VERSION = "10"
      }
    }
    preview {
      environment_variables = {
        NODE_VERSION = "22"
        PNPM_VERSION = "10"
      }
    }
  }
}

resource "cloudflare_pages_domain" "web" {
  account_id   = var.cloudflare_account_id
  project_name = cloudflare_pages_project.web.name
  domain       = "web.${var.zone_name}"
}

resource "cloudflare_pages_domain" "app" {
  account_id   = var.cloudflare_account_id
  project_name = cloudflare_pages_project.web.name
  domain       = "app.${var.zone_name}"
}

# ──────────────────────────────────────────────────────────────────────────────
# Cloudflare R2 — Object Storage
# ──────────────────────────────────────────────────────────────────────────────

resource "cloudflare_r2_bucket" "uploads" {
  account_id = var.cloudflare_account_id
  name       = "cgraph-uploads"
  location   = "ENAM" # Eastern North America (closest to Fly.io IAD)
}
