# Fly.io Infrastructure Configuration

This directory contains **reference/template** Fly.io configuration.

## Important: Which fly.toml to Use

There are two `fly.toml` files in this project:

| Location                      | Purpose                             | When to Use                |
| ----------------------------- | ----------------------------------- | -------------------------- |
| `apps/backend/fly.toml`       | **Active deployment config**        | Use for actual deployments |
| `infrastructure/fly/fly.toml` | Reference template with BEAM tuning | Copy settings from here    |

## Current Production Setup

The active deployment uses `apps/backend/fly.toml` and is deployed as:

- **App Name**: `cgraph-backend`
- **Region**: Frankfurt (fra)
- **URL**: https://cgraph-backend.fly.dev

## Deploying

Always deploy from the `apps/backend` directory:

```bash
cd apps/backend
fly deploy
```

## BEAM VM Tuning (Reference)

The `fly.toml` in this directory contains advanced BEAM VM settings that can be applied when scaling
up:

```toml
[env]
  # Scheduler tuning: +S matches CPU count, +SDcpu enables dirty CPU schedulers
  ELIXIR_ERL_OPTIONS = "+S 2:2 +SDcpu 2:2 +sbwt very_short +swt very_low"
  # Memory allocator settings
  ERL_CRASH_DUMP_SECONDS = "10"
```

### What these do:

- `+S 2:2` - Use 2 schedulers with 2 online
- `+SDcpu 2:2` - Use 2 dirty CPU schedulers
- `+sbwt very_short` - Scheduler busy wait threshold (very short)
- `+swt very_low` - Scheduler wakeup threshold (very low)

These are optimized for low-latency workloads on shared CPUs.

## Consolidation Note

The two files exist because:

1. `apps/backend/fly.toml` - Self-contained, simple config for quick deployments
2. `infrastructure/fly/fly.toml` - Advanced config with BEAM tuning, metrics, statics

When scaling to production, consider merging the advanced settings from this directory into
`apps/backend/fly.toml`.
