#!/bin/bash
#
# CGraph Code Monitoring Script
# 
# This script searches for potential unauthorized copies of CGraph code
# on public repositories. Run periodically (weekly recommended).
#
# Usage: ./monitor_code.sh [--verbose]
#
# Requirements:
# - GitHub CLI (gh) authenticated
# - curl
# - jq
#

set -e

VERBOSE=${1:-""}
DATE=$(date +%Y-%m-%d)
LOG_FILE="monitoring_log_${DATE}.txt"

# Unique code signatures to search for
# These are distinctive strings that would indicate copied code
SIGNATURES=(
    "CGraph.Subscriptions.TierLimits"
    "CGraphWeb.Endpoint"
    "cgraph_key"
    "@cgraph/web"
    "@cgraph/utils"
    "CGraph.Encryption.Crypto"
)

# Terms that might indicate clones
CLONE_TERMS=(
    '"cgraph"'
    'cgraph-clone'
    'cgraph-fork'
    'cgraph alternative'
)

echo "========================================" | tee -a "$LOG_FILE"
echo "CGraph Code Monitoring - $DATE" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# Function to search GitHub
search_github() {
    local query=$1
    local description=$2
    
    echo "Searching: $description" | tee -a "$LOG_FILE"
    
    # GitHub code search
    results=$(gh search code "$query" --limit 20 2>/dev/null || echo "")
    
    if [ -n "$results" ] && [ "$results" != "" ]; then
        echo "⚠️  FOUND RESULTS:" | tee -a "$LOG_FILE"
        echo "$results" | tee -a "$LOG_FILE"
        echo "" | tee -a "$LOG_FILE"
    else
        if [ "$VERBOSE" = "--verbose" ]; then
            echo "✓ No results found" | tee -a "$LOG_FILE"
        fi
    fi
    
    echo "" | tee -a "$LOG_FILE"
}

# Function to search for repository names
search_repos() {
    local query=$1
    local description=$2
    
    echo "Searching repos: $description" | tee -a "$LOG_FILE"
    
    # GitHub repo search - exclude our own org
    results=$(gh search repos "$query" --limit 20 2>/dev/null | grep -v "cgraph-dev/" || echo "")
    
    if [ -n "$results" ] && [ "$results" != "" ]; then
        echo "⚠️  FOUND REPOSITORIES:" | tee -a "$LOG_FILE"
        echo "$results" | tee -a "$LOG_FILE"
        echo "" | tee -a "$LOG_FILE"
    else
        if [ "$VERBOSE" = "--verbose" ]; then
            echo "✓ No suspicious repositories found" | tee -a "$LOG_FILE"
        fi
    fi
    
    echo "" | tee -a "$LOG_FILE"
}

echo "=== Phase 1: Searching for Code Signatures ===" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

for sig in "${SIGNATURES[@]}"; do
    search_github "$sig" "Signature: $sig"
    sleep 2  # Rate limiting
done

echo "=== Phase 2: Searching for Clone/Fork References ===" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

for term in "${CLONE_TERMS[@]}"; do
    search_repos "$term" "Term: $term"
    sleep 2  # Rate limiting
done

echo "=== Phase 3: Checking GitHub Topics ===" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# Search for repos with cgraph topic
results=$(gh search repos "topic:cgraph" --limit 20 2>/dev/null | grep -v "cgraph-dev/" || echo "")
if [ -n "$results" ]; then
    echo "⚠️  Repos with 'cgraph' topic:" | tee -a "$LOG_FILE"
    echo "$results" | tee -a "$LOG_FILE"
fi

echo "" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"
echo "Monitoring complete. Log saved to: $LOG_FILE" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"

# Summary
echo ""
echo "NEXT STEPS:"
echo "1. Review any flagged repositories manually"
echo "2. For confirmed infringement, use docs/LEGAL/DMCA_TEMPLATE.md"
echo "3. Log any actions taken in the monitoring spreadsheet"
echo ""
