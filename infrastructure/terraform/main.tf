# CGraph Terraform Configuration
# Main infrastructure definition
#
# This configuration provisions:
# - Fly.io applications for backend and frontend
# - Cloudflare DNS and CDN configuration
# - Security rules and caching policies
#
# Required Environment Setup:
# - TF_VAR_fly_api_token: Fly.io API token
# - TF_VAR_cloudflare_api_token: Cloudflare API token
# - TF_VAR_cloudflare_zone_id: Your Cloudflare zone ID
# - AWS credentials configured for S3 state backend

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    fly = {
      source  = "fly-apps/fly"
      version = "~> 0.1"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
  
  # State backend configuration - override with your own bucket
  # To use a different backend, run: terraform init -backend-config=backend.tfvars
  backend "s3" {
    bucket         = "cgraph-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "cgraph-terraform-locks"
  }
}

# ==============================================================================
# Variables - All sensitive values must be provided via environment or tfvars
# ==============================================================================

variable "fly_api_token" {
  type        = string
  description = "Fly.io API token (TF_VAR_fly_api_token)"
  sensitive   = true
}

variable "fly_org" {
  type        = string
  description = "Fly.io organization slug"
  default     = "personal"
}

variable "cloudflare_api_token" {
  type        = string
  description = "Cloudflare API token (TF_VAR_cloudflare_api_token)"
  sensitive   = true
}

variable "cloudflare_zone_id" {
  type        = string
  description = "Cloudflare zone ID for the domain"
}

variable "domain" {
  type        = string
  description = "Primary domain name"
  default     = "cgraph.dev"
}

variable "environment" {
  type        = string
  description = "Deployment environment (production, staging, development)"
  default     = "production"
  
  validation {
    condition     = contains(["production", "staging", "development"], var.environment)
    error_message = "Environment must be production, staging, or development."
  }
}

variable "backend_app_name" {
  type        = string
  description = "Name for the backend Fly.io application"
  default     = "cgraph"
}

variable "web_app_name" {
  type        = string
  description = "Name for the web frontend Fly.io application"
  default     = "cgraph-web"
}

# Provider configuration
provider "fly" {
  fly_api_token = var.fly_api_token
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# ==============================================================================
# Fly.io Backend Application
# ==============================================================================

resource "fly_app" "backend" {
  name = var.backend_app_name
  org  = var.fly_org
}

resource "fly_ip" "backend_ipv4" {
  app  = fly_app.backend.name
  type = "v4"
}

resource "fly_ip" "backend_ipv6" {
  app  = fly_app.backend.name
  type = "v6"
}

# ==============================================================================
# Fly.io Web Frontend
# ==============================================================================

resource "fly_app" "web" {
  name = var.web_app_name
  org  = var.fly_org
}

resource "fly_ip" "web_ipv4" {
  app  = fly_app.web.name
  type = "v4"
}

resource "fly_ip" "web_ipv6" {
  app  = fly_app.web.name
  type = "v6"
}

# ==============================================================================
# Cloudflare DNS Records
# ==============================================================================

resource "cloudflare_record" "api" {
  zone_id = var.cloudflare_zone_id
  name    = "api"
  value   = fly_ip.backend_ipv4.address
  type    = "A"
  proxied = true
}

resource "cloudflare_record" "api_ipv6" {
  zone_id = var.cloudflare_zone_id
  name    = "api"
  value   = fly_ip.backend_ipv6.address
  type    = "AAAA"
  proxied = true
}

resource "cloudflare_record" "www" {
  zone_id = var.cloudflare_zone_id
  name    = "www"
  value   = fly_ip.web_ipv4.address
  type    = "A"
  proxied = true
}

resource "cloudflare_record" "www_ipv6" {
  zone_id = var.cloudflare_zone_id
  name    = "www"
  value   = fly_ip.web_ipv6.address
  type    = "AAAA"
  proxied = true
}

resource "cloudflare_record" "root" {
  zone_id = var.cloudflare_zone_id
  name    = "@"
  value   = fly_ip.web_ipv4.address
  type    = "A"
  proxied = true
}

# Cloudflare Page Rules
resource "cloudflare_page_rule" "api_bypass_cache" {
  zone_id  = var.cloudflare_zone_id
  target   = "api.${var.domain}/*"
  priority = 1

  actions {
    cache_level       = "bypass"
    security_level    = "high"
    browser_check     = "on"
  }
}

resource "cloudflare_page_rule" "static_cache" {
  zone_id  = var.cloudflare_zone_id
  target   = "${var.domain}/static/*"
  priority = 2

  actions {
    cache_level = "cache_everything"
    edge_cache_ttl = 604800  # 1 week
  }
}

# Outputs
output "backend_url" {
  value = "https://${fly_app.backend.name}.fly.dev"
}

output "web_url" {
  value = "https://${fly_app.web.name}.fly.dev"
}

output "api_url" {
  value = "https://api.${var.domain}"
}

output "www_url" {
  value = "https://www.${var.domain}"
}
