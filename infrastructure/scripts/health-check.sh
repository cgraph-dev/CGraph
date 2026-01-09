#!/bin/bash
# ============================================================================
# CGraph Health Check Script
# ============================================================================
# 
# Monitors application health and dependencies with standardized warning codes.
# Uses CGraph warning code system for consistent alerting.
#
# @since v0.7.31
# ============================================================================

set -e

# Source warning codes
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/warning-codes.sh" 2>/dev/null || true

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BACKEND_URL="${BACKEND_URL:-http://localhost:4000}"
WEB_URL="${WEB_URL:-http://localhost:3000}"
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
REDIS_HOST="${REDIS_HOST:-localhost}"
REDIS_PORT="${REDIS_PORT:-6379}"

# Response time thresholds (in seconds)
BACKEND_WARN_THRESHOLD="${BACKEND_WARN_THRESHOLD:-0.5}"
BACKEND_CRIT_THRESHOLD="${BACKEND_CRIT_THRESHOLD:-2.0}"

# Track overall status
OVERALL_STATUS=0
ALERTS=()

print_status() {
    local service="$1"
    local status="$2"
    local details="$3"
    local code="${4:-}"
    
    if [ "$status" = "ok" ]; then
        echo -e "${GREEN}✓${NC} $service: ${GREEN}OK${NC} $details"
    elif [ "$status" = "warn" ]; then
        echo -e "${YELLOW}⚠${NC} $service: ${YELLOW}WARNING${NC} $details${code:+ [$code]}"
        OVERALL_STATUS=1
        [ -n "$code" ] && ALERTS+=("$code:$service - $details")
    else
        echo -e "${RED}✗${NC} $service: ${RED}FAIL${NC} $details${code:+ [$code]}"
        OVERALL_STATUS=2
        [ -n "$code" ] && ALERTS+=("$code:$service - $details")
    fi
}

check_backend() {
    echo -e "${BLUE}Checking Backend...${NC}"
    
    if curl -sf "$BACKEND_URL/health" > /dev/null 2>&1; then
        response_time=$(curl -sf -o /dev/null -w '%{time_total}' "$BACKEND_URL/health")
        
        # Check response time thresholds
        if (( $(echo "$response_time > $BACKEND_CRIT_THRESHOLD" | bc -l 2>/dev/null || echo 0) )); then
            print_status "Backend API" "fail" "(${response_time}s - critical latency)" "CGAP02"
        elif (( $(echo "$response_time > $BACKEND_WARN_THRESHOLD" | bc -l 2>/dev/null || echo 0) )); then
            print_status "Backend API" "warn" "(${response_time}s - high latency)" "CGAP02"
        else
            print_status "Backend API" "ok" "(${response_time}s)"
        fi
    else
        print_status "Backend API" "fail" "(not responding)" "CGAP01"
    fi
}

check_web() {
    echo -e "${BLUE}Checking Web Frontend...${NC}"
    
    if curl -sf "$WEB_URL" > /dev/null 2>&1; then
        response_time=$(curl -sf -o /dev/null -w '%{time_total}' "$WEB_URL")
        print_status "Web Frontend" "ok" "(${response_time}s)"
    else
        print_status "Web Frontend" "fail" "(not responding)" "CGWB01"
    fi
}

check_postgres() {
    echo -e "${BLUE}Checking PostgreSQL...${NC}"
    
    if pg_isready -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" > /dev/null 2>&1; then
        # Check connection latency if psql is available
        if command -v psql &> /dev/null; then
            latency=$(PGPASSWORD="${POSTGRES_PASSWORD:-}" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" \
                -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-cgraph}" \
                -c "SELECT 1" -t 2>/dev/null | head -1 || echo "")
            
            if [ -n "$latency" ]; then
                print_status "PostgreSQL" "ok" "($POSTGRES_HOST:$POSTGRES_PORT)"
            else
                print_status "PostgreSQL" "warn" "($POSTGRES_HOST:$POSTGRES_PORT - query failed)" "CGDB02"
            fi
        else
            print_status "PostgreSQL" "ok" "($POSTGRES_HOST:$POSTGRES_PORT)"
        fi
    else
        print_status "PostgreSQL" "fail" "($POSTGRES_HOST:$POSTGRES_PORT)" "CGDB01"
    fi
}

check_redis() {
    echo -e "${BLUE}Checking Redis...${NC}"
    
    if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping > /dev/null 2>&1; then
        redis_info=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" info memory 2>/dev/null | grep used_memory_human | cut -d: -f2 | tr -d '\r')
        
        # Check memory usage
        redis_used_pct=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" info memory 2>/dev/null | \
            grep -E "used_memory_peak_perc" | cut -d: -f2 | tr -d '%\r' || echo "0")
        
        if (( $(echo "${redis_used_pct:-0} > 80" | bc -l 2>/dev/null || echo 0) )); then
            print_status "Redis" "warn" "(memory: $redis_info - ${redis_used_pct}% of peak)" "CGRD02"
        else
            print_status "Redis" "ok" "(memory: $redis_info)"
        fi
    else
        print_status "Redis" "fail" "($REDIS_HOST:$REDIS_PORT)" "CGRD01"
    fi
    fi
}

check_docker() {
    echo -e "${BLUE}Checking Docker Services...${NC}"
    
    if command -v docker &> /dev/null; then
        # Check if docker-compose services are running
        if docker-compose ps 2>/dev/null | grep -q "Up"; then
            running=$(docker-compose ps 2>/dev/null | grep "Up" | wc -l)
            
            # Check for restarting containers
            restarting=$(docker-compose ps 2>/dev/null | grep -c "Restarting" || echo 0)
            if [ "$restarting" -gt 0 ]; then
                print_status "Docker Services" "warn" "($running running, $restarting restarting)" "CGDK03"
            else
                print_status "Docker Services" "ok" "($running containers running)"
            fi
        else
            print_status "Docker Services" "warn" "(no containers running)" "CGDK02"
        fi
    else
        print_status "Docker" "warn" "(not installed)" "CGDK01"
    fi
}

check_disk() {
    echo -e "${BLUE}Checking Disk Space...${NC}"
    
    disk_usage=$(df -h . | awk 'NR==2 {print $5}' | tr -d '%')
    disk_avail=$(df -h . | awk 'NR==2 {print $4}')
    
    if [ "$disk_usage" -lt 80 ]; then
        print_status "Disk Space" "ok" "(${disk_usage}% used, ${disk_avail} available)"
    elif [ "$disk_usage" -lt 90 ]; then
        print_status "Disk Space" "warn" "(${disk_usage}% used, ${disk_avail} available)" "CGSY02"
    else
        print_status "Disk Space" "fail" "(${disk_usage}% used, ${disk_avail} available)" "CGSY01"
    fi
}

check_memory() {
    echo -e "${BLUE}Checking Memory...${NC}"
    
    if command -v free &> /dev/null; then
        mem_usage=$(free | awk '/Mem:/ {printf "%.0f", $3/$2 * 100}')
        mem_avail=$(free -h | awk '/Mem:/ {print $7}')
        
        if [ "$mem_usage" -lt 80 ]; then
            print_status "Memory" "ok" "(${mem_usage}% used, ${mem_avail} available)"
        elif [ "$mem_usage" -lt 90 ]; then
            print_status "Memory" "warn" "(${mem_usage}% used, ${mem_avail} available)" "CGSY04"
        else
            print_status "Memory" "fail" "(${mem_usage}% used, ${mem_avail} available)" "CGSY03"
        fi
    else
        print_status "Memory" "warn" "(unable to check)"
    fi
}

check_ssl_certs() {
    echo -e "${BLUE}Checking SSL Certificates...${NC}"
    
    # Check if SSL is configured
    local ssl_host="${SSL_CHECK_HOST:-}"
    if [ -n "$ssl_host" ]; then
        local expiry_days=$(echo | openssl s_client -connect "$ssl_host:443" -servername "$ssl_host" 2>/dev/null | \
            openssl x509 -noout -enddate 2>/dev/null | \
            cut -d= -f2 | \
            xargs -I{} bash -c 'echo $(( ($(date -d "{}" +%s) - $(date +%s)) / 86400 ))' 2>/dev/null || echo "-1")
        
        if [ "$expiry_days" -lt 0 ]; then
            print_status "SSL Certificate" "fail" "($ssl_host - expired or unreachable)" "CGSC05"
        elif [ "$expiry_days" -lt 30 ]; then
            print_status "SSL Certificate" "warn" "($ssl_host - expires in ${expiry_days} days)" "CGSC06"
        else
            print_status "SSL Certificate" "ok" "($ssl_host - expires in ${expiry_days} days)"
        fi
    else
        print_status "SSL Certificate" "ok" "(check skipped - SSL_CHECK_HOST not set)"
    fi
}

# Main
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         CGraph Health Check v0.7.31      ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════╝${NC}"
echo ""
echo "Timestamp: $(date)"
echo ""

check_postgres
check_redis
check_backend
check_web
check_docker
check_disk
check_memory
check_ssl_certs

echo ""
echo "─────────────────────────────────────────────"
if [ "$OVERALL_STATUS" -eq 0 ]; then
    echo -e "${GREEN}Overall Status: HEALTHY${NC}"
elif [ "$OVERALL_STATUS" -eq 1 ]; then
    echo -e "${YELLOW}Overall Status: DEGRADED${NC}"
else
    echo -e "${RED}Overall Status: UNHEALTHY${NC}"
fi

# Print alerts summary if any
if [ ${#ALERTS[@]} -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}Active Alerts:${NC}"
    for alert in "${ALERTS[@]}"; do
        echo "  - $alert"
    done
fi

echo ""

exit $OVERALL_STATUS
