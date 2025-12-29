#!/bin/bash
# CGraph Health Check Script
# Monitors application health and dependencies

set -e

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

# Track overall status
OVERALL_STATUS=0

print_status() {
    local service="$1"
    local status="$2"
    local details="$3"
    
    if [ "$status" = "ok" ]; then
        echo -e "${GREEN}✓${NC} $service: ${GREEN}OK${NC} $details"
    elif [ "$status" = "warn" ]; then
        echo -e "${YELLOW}⚠${NC} $service: ${YELLOW}WARNING${NC} $details"
        OVERALL_STATUS=1
    else
        echo -e "${RED}✗${NC} $service: ${RED}FAIL${NC} $details"
        OVERALL_STATUS=2
    fi
}

check_backend() {
    echo -e "${BLUE}Checking Backend...${NC}"
    
    if curl -sf "$BACKEND_URL/health" > /dev/null 2>&1; then
        response_time=$(curl -sf -o /dev/null -w '%{time_total}' "$BACKEND_URL/health")
        print_status "Backend API" "ok" "(${response_time}s)"
    else
        print_status "Backend API" "fail" "(not responding)"
    fi
}

check_web() {
    echo -e "${BLUE}Checking Web Frontend...${NC}"
    
    if curl -sf "$WEB_URL" > /dev/null 2>&1; then
        response_time=$(curl -sf -o /dev/null -w '%{time_total}' "$WEB_URL")
        print_status "Web Frontend" "ok" "(${response_time}s)"
    else
        print_status "Web Frontend" "fail" "(not responding)"
    fi
}

check_postgres() {
    echo -e "${BLUE}Checking PostgreSQL...${NC}"
    
    if pg_isready -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" > /dev/null 2>&1; then
        print_status "PostgreSQL" "ok" "($POSTGRES_HOST:$POSTGRES_PORT)"
    else
        print_status "PostgreSQL" "fail" "($POSTGRES_HOST:$POSTGRES_PORT)"
    fi
}

check_redis() {
    echo -e "${BLUE}Checking Redis...${NC}"
    
    if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping > /dev/null 2>&1; then
        redis_info=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" info memory 2>/dev/null | grep used_memory_human | cut -d: -f2 | tr -d '\r')
        print_status "Redis" "ok" "(memory: $redis_info)"
    else
        print_status "Redis" "fail" "($REDIS_HOST:$REDIS_PORT)"
    fi
}

check_docker() {
    echo -e "${BLUE}Checking Docker Services...${NC}"
    
    if command -v docker &> /dev/null; then
        # Check if docker-compose services are running
        if docker-compose ps 2>/dev/null | grep -q "Up"; then
            running=$(docker-compose ps 2>/dev/null | grep "Up" | wc -l)
            print_status "Docker Services" "ok" "($running containers running)"
        else
            print_status "Docker Services" "warn" "(no containers running)"
        fi
    else
        print_status "Docker" "warn" "(not installed)"
    fi
}

check_disk() {
    echo -e "${BLUE}Checking Disk Space...${NC}"
    
    disk_usage=$(df -h . | awk 'NR==2 {print $5}' | tr -d '%')
    disk_avail=$(df -h . | awk 'NR==2 {print $4}')
    
    if [ "$disk_usage" -lt 80 ]; then
        print_status "Disk Space" "ok" "(${disk_usage}% used, ${disk_avail} available)"
    elif [ "$disk_usage" -lt 90 ]; then
        print_status "Disk Space" "warn" "(${disk_usage}% used, ${disk_avail} available)"
    else
        print_status "Disk Space" "fail" "(${disk_usage}% used, ${disk_avail} available)"
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
            print_status "Memory" "warn" "(${mem_usage}% used, ${mem_avail} available)"
        else
            print_status "Memory" "fail" "(${mem_usage}% used, ${mem_avail} available)"
        fi
    else
        print_status "Memory" "warn" "(unable to check)"
    fi
}

# Main
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         CGraph Health Check              ║${NC}"
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

echo ""
echo "─────────────────────────────────────────────"
if [ "$OVERALL_STATUS" -eq 0 ]; then
    echo -e "${GREEN}Overall Status: HEALTHY${NC}"
elif [ "$OVERALL_STATUS" -eq 1 ]; then
    echo -e "${YELLOW}Overall Status: DEGRADED${NC}"
else
    echo -e "${RED}Overall Status: UNHEALTHY${NC}"
fi
echo ""

exit $OVERALL_STATUS
