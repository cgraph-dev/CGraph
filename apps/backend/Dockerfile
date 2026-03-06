# CGraph Backend Dockerfile for Fly.io
# Multi-stage build for Elixir/Phoenix application

# Build stage
FROM hexpm/elixir:1.18.4-erlang-28.3.3-alpine-3.21.6 AS builder

# Install build dependencies
# Note: npm/nodejs intentionally excluded — Phoenix uses Elixir-native
# esbuild/tailwind wrappers, no Node.js toolchain needed at build time.
RUN apk add --no-cache \
    build-base \
    git

# Set build environment
ENV MIX_ENV=prod

# Install hex and rebar
RUN mix local.hex --force && \
    mix local.rebar --force

# Set working directory
WORKDIR /app

# Copy mix files first for better caching
COPY mix.exs mix.lock ./

# Copy config files
COPY config ./config/

# Fetch dependencies
RUN mix deps.get --only prod
RUN mix deps.compile

# Copy application code
COPY lib ./lib/
COPY priv ./priv/

# Compile the release
RUN mix compile

# Build release
RUN mix release

# Runtime stage - MUST match the Alpine version from build stage
FROM alpine:3.21.6 AS runtime

# Install runtime dependencies (including PgBouncer for sidecar mode)
RUN apk add --no-cache \
    libstdc++ \
    openssl \
    ncurses-libs \
    libgcc \
    ca-certificates \
    pgbouncer \
    gettext \
    wget \
    libc6-compat

# Install Grafana Alloy for metrics shipping to Grafana Cloud
RUN wget -q -O /tmp/alloy.zip "https://github.com/grafana/alloy/releases/download/v1.13.1/alloy-linux-amd64.zip" && \
    unzip /tmp/alloy.zip -d /tmp && \
    mv /tmp/alloy-linux-amd64 /usr/local/bin/alloy && \
    chmod +x /usr/local/bin/alloy && \
    rm /tmp/alloy.zip

# Create non-root user
RUN addgroup -g 1000 cgraph && \
    adduser -u 1000 -G cgraph -s /bin/sh -D cgraph

WORKDIR /app

# Copy release from builder
COPY --from=builder --chown=cgraph:cgraph /app/_build/prod/rel/cgraph ./

# Copy PgBouncer configuration for sidecar mode
# pgbouncer/ is a local copy of infrastructure/pgbouncer/ to work with apps/backend build context
COPY --chown=cgraph:cgraph pgbouncer/pgbouncer.ini /etc/pgbouncer/pgbouncer.ini
COPY --chown=cgraph:cgraph pgbouncer/start.sh /usr/local/bin/start-pgbouncer.sh
RUN chmod +x /usr/local/bin/start-pgbouncer.sh

# Copy Grafana Alloy configuration for metrics sidecar
COPY --chown=cgraph:cgraph alloy/config.alloy /etc/alloy/config.alloy
COPY --chown=cgraph:cgraph alloy/start.sh /usr/local/bin/start-alloy.sh
RUN chmod +x /usr/local/bin/start-alloy.sh
COPY --chown=cgraph:cgraph alloy/start-with-app.sh /usr/local/bin/start-with-app.sh
RUN chmod +x /usr/local/bin/start-with-app.sh

# Set user
USER cgraph

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

# Start the application (with Alloy sidecar if GRAFANA_CLOUD_* secrets are set)
CMD ["/usr/local/bin/start-with-app.sh"]
