#!/bin/bash
# ============================================================================
# CGraph Infrastructure Warning Codes
# ============================================================================
#
# Standardized warning and error codes for infrastructure monitoring.
# Based on industry standards and best practices for alerting systems.
#
# Code Format: CGXXNN
#   CG = CGraph prefix
#   XX = Category code (2 chars)
#   NN = Specific code (2 digits)
#
# Categories:
#   DB = Database
#   RD = Redis/Cache
#   AP = API/Application
#   WB = Web Frontend
#   DK = Docker/Container
#   SY = System Resources
#   NT = Network
#   SC = Security
#   CF = Configuration
#   BK = Backup/Recovery
#
# Severity Levels:
#   INFO (0)     - Informational, no action required
#   WARNING (1)  - Attention needed, system degraded
#   ERROR (2)    - Action required, functionality impaired
#   CRITICAL (3) - Immediate action required, system down
#
# @since v0.7.31
# ============================================================================

# =============================================================================
# DATABASE CODES (CGDB)
# =============================================================================

export CGDB01="CGDB01" # PostgreSQL connection failed
export CGDB02="CGDB02" # PostgreSQL high latency (>100ms)
export CGDB03="CGDB03" # PostgreSQL connection pool exhausted
export CGDB04="CGDB04" # PostgreSQL replication lag detected
export CGDB05="CGDB05" # PostgreSQL disk space low (<20%)
export CGDB06="CGDB06" # PostgreSQL high CPU usage (>80%)
export CGDB07="CGDB07" # PostgreSQL deadlock detected
export CGDB08="CGDB08" # PostgreSQL long-running query (>30s)
export CGDB09="CGDB09" # PostgreSQL table bloat detected
export CGDB10="CGDB10" # PostgreSQL backup overdue (>24h)
export CGDB11="CGDB11" # PostgreSQL vacuum needed
export CGDB12="CGDB12" # PostgreSQL too many connections
export CGDB13="CGDB13" # PostgreSQL authentication failure
export CGDB14="CGDB14" # PostgreSQL schema migration required
export CGDB15="CGDB15" # PostgreSQL index scan ratio low

# =============================================================================
# REDIS/CACHE CODES (CGRD)
# =============================================================================

export CGRD01="CGRD01" # Redis connection failed
export CGRD02="CGRD02" # Redis high memory usage (>80%)
export CGRD03="CGRD03" # Redis eviction rate high
export CGRD04="CGRD04" # Redis replication lag
export CGRD05="CGRD05" # Redis persistence failed
export CGRD06="CGRD06" # Redis key expiration backlog
export CGRD07="CGRD07" # Redis cluster node down
export CGRD08="CGRD08" # Redis slow commands detected
export CGRD09="CGRD09" # Redis client connections high
export CGRD10="CGRD10" # Redis authentication failure

# =============================================================================
# API/APPLICATION CODES (CGAP)
# =============================================================================

export CGAP01="CGAP01" # Application not responding
export CGAP02="CGAP02" # Application high response time (>500ms)
export CGAP03="CGAP03" # Application error rate high (>5%)
export CGAP04="CGAP04" # Application memory leak suspected
export CGAP05="CGAP05" # Application OOM (Out of Memory)
export CGAP06="CGAP06" # Application rate limiting active
export CGAP07="CGAP07" # Application queue backlog high
export CGAP08="CGAP08" # Application WebSocket connections high
export CGAP09="CGAP09" # Application crash detected
export CGAP10="CGAP10" # Application scheduled job failed
export CGAP11="CGAP11" # Application dependency timeout
export CGAP12="CGAP12" # Application health check degraded
export CGAP13="CGAP13" # Application Phoenix channel overload
export CGAP14="CGAP14" # Application GenServer bottleneck
export CGAP15="CGAP15" # Application process limit approaching

# =============================================================================
# WEB FRONTEND CODES (CGWB)
# =============================================================================

export CGWB01="CGWB01" # Web frontend not responding
export CGWB02="CGWB02" # Web frontend asset loading failed
export CGWB03="CGWB03" # Web frontend CDN unavailable
export CGWB04="CGWB04" # Web frontend high bundle size
export CGWB05="CGWB05" # Web frontend API timeout
export CGWB06="CGWB06" # Web frontend JavaScript errors high
export CGWB07="CGWB07" # Web frontend cache miss rate high
export CGWB08="CGWB08" # Web frontend CORS error
export CGWB09="CGWB09" # Web frontend SSL certificate expiring
export CGWB10="CGWB10" # Web frontend service worker failed

# =============================================================================
# DOCKER/CONTAINER CODES (CGDK)
# =============================================================================

export CGDK01="CGDK01" # Docker daemon not responding
export CGDK02="CGDK02" # Container exited unexpectedly
export CGDK03="CGDK03" # Container restart loop detected
export CGDK04="CGDK04" # Container high CPU usage (>80%)
export CGDK05="CGDK05" # Container high memory usage (>80%)
export CGDK06="CGDK06" # Container volume full
export CGDK07="CGDK07" # Container image pull failed
export CGDK08="CGDK08" # Container network unreachable
export CGDK09="CGDK09" # Container health check failing
export CGDK10="CGDK10" # Container orphaned (no compose association)
export CGDK11="CGDK11" # Container logs size excessive
export CGDK12="CGDK12" # Container image outdated
export CGDK13="CGDK13" # Container security vulnerability
export CGDK14="CGDK14" # Container resource limits not set
export CGDK15="CGDK15" # Container privileged mode warning

# =============================================================================
# SYSTEM RESOURCE CODES (CGSY)
# =============================================================================

export CGSY01="CGSY01" # System disk space critical (<10%)
export CGSY02="CGSY02" # System disk space warning (<20%)
export CGSY03="CGSY03" # System memory usage critical (>90%)
export CGSY04="CGSY04" # System memory usage warning (>80%)
export CGSY05="CGSY05" # System CPU usage critical (>90%)
export CGSY06="CGSY06" # System CPU usage warning (>80%)
export CGSY07="CGSY07" # System load average high
export CGSY08="CGSY08" # System inode usage high
export CGSY09="CGSY09" # System swap usage high
export CGSY10="CGSY10" # System file descriptors exhausted
export CGSY11="CGSY11" # System time drift detected
export CGSY12="CGSY12" # System kernel updates pending
export CGSY13="CGSY13" # System entropy low
export CGSY14="CGSY14" # System zombie processes detected
export CGSY15="CGSY15" # System uptime concerning (>365 days)

# =============================================================================
# NETWORK CODES (CGNT)
# =============================================================================

export CGNT01="CGNT01" # Network interface down
export CGNT02="CGNT02" # Network high packet loss (>1%)
export CGNT03="CGNT03" # Network high latency (>100ms)
export CGNT04="CGNT04" # Network DNS resolution failed
export CGNT05="CGNT05" # Network firewall blocking traffic
export CGNT06="CGNT06" # Network bandwidth saturated
export CGNT07="CGNT07" # Network SSL/TLS handshake failed
export CGNT08="CGNT08" # Network port unreachable
export CGNT09="CGNT09" # Network DDoS attack suspected
export CGNT10="CGNT10" # Network load balancer unhealthy
export CGNT11="CGNT11" # Network CDN origin failure
export CGNT12="CGNT12" # Network websocket connection limit

# =============================================================================
# SECURITY CODES (CGSC)
# =============================================================================

export CGSC01="CGSC01" # Security authentication failure spike
export CGSC02="CGSC02" # Security brute force detected
export CGSC03="CGSC03" # Security SQL injection attempt
export CGSC04="CGSC04" # Security XSS attempt detected
export CGSC05="CGSC05" # Security certificate expired
export CGSC06="CGSC06" # Security certificate expiring soon (<30 days)
export CGSC07="CGSC07" # Security unauthorized access attempt
export CGSC08="CGSC08" # Security rate limit exceeded
export CGSC09="CGSC09" # Security suspicious IP detected
export CGSC10="CGSC10" # Security API key compromised
export CGSC11="CGSC11" # Security CSRF token mismatch
export CGSC12="CGSC12" # Security password breach detected
export CGSC13="CGSC13" # Security 2FA bypass attempt
export CGSC14="CGSC14" # Security admin action logged
export CGSC15="CGSC15" # Security audit log gap

# =============================================================================
# CONFIGURATION CODES (CGCF)
# =============================================================================

export CGCF01="CGCF01" # Configuration file missing
export CGCF02="CGCF02" # Configuration environment variable unset
export CGCF03="CGCF03" # Configuration secret exposed
export CGCF04="CGCF04" # Configuration deprecated setting
export CGCF05="CGCF05" # Configuration validation failed
export CGCF06="CGCF06" # Configuration drift detected
export CGCF07="CGCF07" # Configuration hot reload failed
export CGCF08="CGCF08" # Configuration version mismatch
export CGCF09="CGCF09" # Configuration unsafe defaults
export CGCF10="CGCF10" # Configuration backup missing

# =============================================================================
# BACKUP/RECOVERY CODES (CGBK)
# =============================================================================

export CGBK01="CGBK01" # Backup failed
export CGBK02="CGBK02" # Backup overdue (>24h)
export CGBK03="CGBK03" # Backup verification failed
export CGBK04="CGBK04" # Backup storage full
export CGBK05="CGBK05" # Backup restoration test failed
export CGBK06="CGBK06" # Backup encryption failed
export CGBK07="CGBK07" # Backup retention policy violated
export CGBK08="CGBK08" # Backup replication lag
export CGBK09="CGBK09" # Backup integrity check failed
export CGBK10="CGBK10" # Backup offsite sync failed

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

# Get severity level from code
get_severity() {
    local code="$1"
    local category="${code:2:2}"
    local number="${code:4:2}"
    
    # Default mappings (can be customized)
    case "$category" in
        "SC") echo 3 ;; # Security codes are typically critical
        *)
            case "$number" in
                01|02) echo 2 ;; # First codes usually indicate failures
                0[3-5]) echo 2 ;; # Early codes are usually errors
                0[6-9]) echo 1 ;; # Middle codes are warnings
                1[0-5]) echo 1 ;; # Higher codes are warnings/info
                *) echo 0 ;;      # Default to info
            esac
            ;;
    esac
}

# Get human-readable description
get_description() {
    local code="$1"
    
    case "$code" in
        # Database
        "CGDB01") echo "PostgreSQL connection failed" ;;
        "CGDB02") echo "PostgreSQL high latency (>100ms)" ;;
        "CGDB03") echo "PostgreSQL connection pool exhausted" ;;
        "CGDB04") echo "PostgreSQL replication lag detected" ;;
        "CGDB05") echo "PostgreSQL disk space low (<20%)" ;;
        
        # Redis
        "CGRD01") echo "Redis connection failed" ;;
        "CGRD02") echo "Redis high memory usage (>80%)" ;;
        "CGRD03") echo "Redis eviction rate high" ;;
        
        # API
        "CGAP01") echo "Application not responding" ;;
        "CGAP02") echo "Application high response time (>500ms)" ;;
        "CGAP03") echo "Application error rate high (>5%)" ;;
        
        # Security
        "CGSC01") echo "Security authentication failure spike" ;;
        "CGSC02") echo "Security brute force detected" ;;
        "CGSC05") echo "Security certificate expired" ;;
        
        # System
        "CGSY01") echo "System disk space critical (<10%)" ;;
        "CGSY03") echo "System memory usage critical (>90%)" ;;
        "CGSY05") echo "System CPU usage critical (>90%)" ;;
        
        *) echo "Unknown warning code: $code" ;;
    esac
}

# Format alert message
format_alert() {
    local code="$1"
    local details="$2"
    local severity=$(get_severity "$code")
    local description=$(get_description "$code")
    
    local severity_label
    case "$severity" in
        0) severity_label="INFO" ;;
        1) severity_label="WARNING" ;;
        2) severity_label="ERROR" ;;
        3) severity_label="CRITICAL" ;;
    esac
    
    echo "[$severity_label] $code: $description${details:+ - $details}"
}

# Log alert to file
log_alert() {
    local code="$1"
    local details="$2"
    local log_file="${ALERT_LOG:-/var/log/cgraph/alerts.log}"
    
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local message=$(format_alert "$code" "$details")
    
    mkdir -p "$(dirname "$log_file")" 2>/dev/null || true
    echo "$timestamp $message" >> "$log_file" 2>/dev/null || echo "$timestamp $message"
}

# Send alert (placeholder for integration with alerting systems)
send_alert() {
    local code="$1"
    local details="$2"
    local severity=$(get_severity "$code")
    
    # Log the alert
    log_alert "$code" "$details"
    
    # Print to stderr for immediate visibility
    format_alert "$code" "$details" >&2
    
    # Integration points for external alerting:
    # - PagerDuty: curl -X POST with API key
    # - Slack: webhook URL
    # - Datadog: dogstatsd
    # - Prometheus: push to Alertmanager
    # - Custom webhook: configurable endpoint
    
    # Example webhook integration (uncomment and configure):
    # if [ -n "$ALERT_WEBHOOK_URL" ]; then
    #     curl -sf -X POST "$ALERT_WEBHOOK_URL" \
    #         -H "Content-Type: application/json" \
    #         -d "{\"code\":\"$code\",\"severity\":$severity,\"details\":\"$details\"}" \
    #         > /dev/null 2>&1
    # fi
    
    return $severity
}

# =============================================================================
# EXPORTS
# =============================================================================

# Export functions for use in other scripts
export -f get_severity 2>/dev/null || true
export -f get_description 2>/dev/null || true
export -f format_alert 2>/dev/null || true
export -f log_alert 2>/dev/null || true
export -f send_alert 2>/dev/null || true

# Usage example when script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    echo "CGraph Infrastructure Warning Codes v0.7.31"
    echo ""
    echo "Categories:"
    echo "  CGDB - Database (PostgreSQL)"
    echo "  CGRD - Redis/Cache"
    echo "  CGAP - API/Application"
    echo "  CGWB - Web Frontend"
    echo "  CGDK - Docker/Container"
    echo "  CGSY - System Resources"
    echo "  CGNT - Network"
    echo "  CGSC - Security"
    echo "  CGCF - Configuration"
    echo "  CGBK - Backup/Recovery"
    echo ""
    echo "Usage:"
    echo "  source warning-codes.sh"
    echo "  send_alert \$CGDB01 \"Connection timeout after 30s\""
    echo "  send_alert \$CGSC02 \"5 failed attempts from IP 1.2.3.4\""
fi
