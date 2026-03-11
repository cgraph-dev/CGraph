# CGraph Infrastructure Warning Codes Reference

**Version:** 0.7.32  
**Last Updated:** January 2026

This document provides a comprehensive reference for the CGraph infrastructure warning code system. These standardized codes enable consistent monitoring, alerting, and incident response across all CGraph components.

## Code Format

```
CGXXNN
  │││└─ Specific code (00-99)
  ││└── Category code (2 chars)
  └┴─── CGraph prefix
```

## Severity Levels

| Level | Code | Description |
|-------|------|-------------|
| INFO | 0 | Informational, no action required |
| WARNING | 1 | Attention needed, system may be degraded |
| ERROR | 2 | Action required, functionality impaired |
| CRITICAL | 3 | Immediate action required, system down |

---

## Category Reference

### CGDB - Database (PostgreSQL)

| Code | Severity | Description | Recommended Action |
|------|----------|-------------|-------------------|
| CGDB01 | ERROR | PostgreSQL connection failed | Check PostgreSQL status, verify credentials |
| CGDB02 | WARNING | High latency (>100ms) | Check query performance, connection pool |
| CGDB03 | ERROR | Connection pool exhausted | Increase pool size or reduce connections |
| CGDB04 | WARNING | Replication lag detected | Check replica status, network latency |
| CGDB05 | WARNING | Disk space low (<20%) | Add disk space, archive old data |
| CGDB06 | WARNING | High CPU usage (>80%) | Optimize queries, add resources |
| CGDB07 | ERROR | Deadlock detected | Review transaction isolation, query order |
| CGDB08 | WARNING | Long-running query (>30s) | Analyze and optimize query |
| CGDB09 | WARNING | Table bloat detected | Run VACUUM FULL |
| CGDB10 | WARNING | Backup overdue (>24h) | Check backup job, run manual backup |
| CGDB11 | WARNING | Vacuum needed | Schedule VACUUM ANALYZE |
| CGDB12 | WARNING | Too many connections | Review connection limits, pooling |
| CGDB13 | ERROR | Authentication failure | Verify credentials, check pg_hba.conf |
| CGDB14 | WARNING | Schema migration required | Run pending migrations |
| CGDB15 | WARNING | Index scan ratio low | Review and add indexes |

### CGRD - Redis/Cache

| Code | Severity | Description | Recommended Action |
|------|----------|-------------|-------------------|
| CGRD01 | ERROR | Redis connection failed | Check Redis status, verify connection |
| CGRD02 | WARNING | High memory usage (>80%) | Set maxmemory policy, add memory |
| CGRD03 | WARNING | Eviction rate high | Increase memory or reduce cache TTL |
| CGRD04 | WARNING | Replication lag | Check replica status |
| CGRD05 | ERROR | Persistence failed | Check disk space, RDB/AOF config |
| CGRD06 | WARNING | Key expiration backlog | Review lazy-expire settings |
| CGRD07 | ERROR | Cluster node down | Restore cluster node |
| CGRD08 | WARNING | Slow commands detected | Optimize Lua scripts, avoid KEYS |
| CGRD09 | WARNING | Client connections high | Implement connection pooling |
| CGRD10 | ERROR | Authentication failure | Verify Redis AUTH password |

### CGAP - API/Application

| Code | Severity | Description | Recommended Action |
|------|----------|-------------|-------------------|
| CGAP01 | CRITICAL | Application not responding | Restart application, check logs |
| CGAP02 | WARNING | High response time (>500ms) | Profile endpoints, optimize queries |
| CGAP03 | ERROR | Error rate high (>5%) | Review error logs, deploy fix |
| CGAP04 | WARNING | Memory leak suspected | Profile memory, restart app |
| CGAP05 | CRITICAL | Out of Memory (OOM) | Increase memory, fix leak |
| CGAP06 | WARNING | Rate limiting active | Expected if under load |
| CGAP07 | WARNING | Queue backlog high | Add workers, increase throughput |
| CGAP08 | WARNING | WebSocket connections high | Review limits, scale horizontally |
| CGAP09 | CRITICAL | Application crash | Analyze crash dump, deploy fix |
| CGAP10 | WARNING | Scheduled job failed | Check job logs, retry manually |
| CGAP11 | WARNING | Dependency timeout | Check external service status |
| CGAP12 | WARNING | Health check degraded | Investigate component health |
| CGAP13 | WARNING | Phoenix channel overload | Scale channels, limit connections |
| CGAP14 | WARNING | GenServer bottleneck | Profile process, add workers |
| CGAP15 | WARNING | Process limit approaching | Increase BEAM process limit |

### CGWB - Web Frontend

| Code | Severity | Description | Recommended Action |
|------|----------|-------------|-------------------|
| CGWB01 | CRITICAL | Frontend not responding | Check web server, CDN status |
| CGWB02 | ERROR | Asset loading failed | Verify asset URLs, CDN status |
| CGWB03 | ERROR | CDN unavailable | Switch to fallback origin |
| CGWB04 | WARNING | High bundle size | Analyze and code-split |
| CGWB05 | WARNING | API timeout | Check backend status |
| CGWB06 | WARNING | JavaScript errors high | Review error tracking |
| CGWB07 | WARNING | Cache miss rate high | Review caching strategy |
| CGWB08 | ERROR | CORS error | Update CORS configuration |
| CGWB09 | WARNING | SSL certificate expiring | Renew certificate |
| CGWB10 | ERROR | Service worker failed | Update service worker |

### CGDK - Docker/Container

| Code | Severity | Description | Recommended Action |
|------|----------|-------------|-------------------|
| CGDK01 | CRITICAL | Docker daemon not responding | Restart Docker service |
| CGDK02 | ERROR | Container exited unexpectedly | Check container logs |
| CGDK03 | WARNING | Restart loop detected | Fix application, check config |
| CGDK04 | WARNING | Container high CPU (>80%) | Scale or optimize |
| CGDK05 | WARNING | Container high memory (>80%) | Increase limits or optimize |
| CGDK06 | ERROR | Container volume full | Clean up or expand volume |
| CGDK07 | ERROR | Image pull failed | Check registry access |
| CGDK08 | ERROR | Network unreachable | Check Docker network config |
| CGDK09 | ERROR | Health check failing | Investigate container health |
| CGDK10 | WARNING | Orphaned container | Clean up with docker system prune |
| CGDK11 | WARNING | Logs size excessive | Configure log rotation |
| CGDK12 | WARNING | Image outdated | Pull latest image |
| CGDK13 | CRITICAL | Security vulnerability | Update base image |
| CGDK14 | WARNING | Resource limits not set | Set CPU/memory limits |
| CGDK15 | WARNING | Privileged mode warning | Review security requirements |

### CGSY - System Resources

| Code | Severity | Description | Recommended Action |
|------|----------|-------------|-------------------|
| CGSY01 | CRITICAL | Disk space critical (<10%) | Immediate cleanup required |
| CGSY02 | WARNING | Disk space warning (<20%) | Plan cleanup or expansion |
| CGSY03 | CRITICAL | Memory usage critical (>90%) | Add memory or reduce load |
| CGSY04 | WARNING | Memory usage warning (>80%) | Monitor and plan scaling |
| CGSY05 | CRITICAL | CPU usage critical (>90%) | Add CPU or reduce load |
| CGSY06 | WARNING | CPU usage warning (>80%) | Monitor and optimize |
| CGSY07 | WARNING | Load average high | Reduce processes, add resources |
| CGSY08 | WARNING | Inode usage high | Clean up files |
| CGSY09 | WARNING | Swap usage high | Add RAM |
| CGSY10 | ERROR | File descriptors exhausted | Increase ulimit |
| CGSY11 | WARNING | Time drift detected | Configure NTP |
| CGSY12 | WARNING | Kernel updates pending | Schedule maintenance window |
| CGSY13 | WARNING | Entropy low | Add entropy source |
| CGSY14 | WARNING | Zombie processes detected | Kill parent processes |
| CGSY15 | WARNING | Uptime concerning (>365 days) | Schedule maintenance reboot |

### CGNT - Network

| Code | Severity | Description | Recommended Action |
|------|----------|-------------|-------------------|
| CGNT01 | CRITICAL | Network interface down | Check hardware/config |
| CGNT02 | WARNING | High packet loss (>1%) | Check network path |
| CGNT03 | WARNING | High latency (>100ms) | Optimize routing |
| CGNT04 | ERROR | DNS resolution failed | Check DNS servers |
| CGNT05 | ERROR | Firewall blocking traffic | Review firewall rules |
| CGNT06 | WARNING | Bandwidth saturated | Add capacity |
| CGNT07 | ERROR | SSL/TLS handshake failed | Check certificate, protocols |
| CGNT08 | ERROR | Port unreachable | Check service, firewall |
| CGNT09 | CRITICAL | DDoS attack suspected | Enable mitigation |
| CGNT10 | ERROR | Load balancer unhealthy | Check backend targets |
| CGNT11 | ERROR | CDN origin failure | Check origin server |
| CGNT12 | WARNING | WebSocket connection limit | Scale horizontally |

### CGSC - Security

| Code | Severity | Description | Recommended Action |
|------|----------|-------------|-------------------|
| CGSC01 | CRITICAL | Auth failure spike | Investigate possible attack |
| CGSC02 | CRITICAL | Brute force detected | Block IP, enable lockout |
| CGSC03 | CRITICAL | SQL injection attempt | Block IP, review logs |
| CGSC04 | CRITICAL | XSS attempt detected | Review and sanitize inputs |
| CGSC05 | CRITICAL | Certificate expired | Renew immediately |
| CGSC06 | WARNING | Certificate expiring (<30d) | Plan renewal |
| CGSC07 | CRITICAL | Unauthorized access attempt | Block IP, investigate |
| CGSC08 | WARNING | Rate limit exceeded | Normal if expected load |
| CGSC09 | WARNING | Suspicious IP detected | Review and block if needed |
| CGSC10 | CRITICAL | API key compromised | Rotate key immediately |
| CGSC11 | WARNING | CSRF token mismatch | Check session handling |
| CGSC12 | WARNING | Password breach detected | Force password change |
| CGSC13 | CRITICAL | 2FA bypass attempt | Investigate immediately |
| CGSC14 | INFO | Admin action logged | Audit log entry |
| CGSC15 | WARNING | Audit log gap | Investigate logging issue |

### CGCF - Configuration

| Code | Severity | Description | Recommended Action |
|------|----------|-------------|-------------------|
| CGCF01 | ERROR | Configuration file missing | Restore from backup |
| CGCF02 | ERROR | Environment variable unset | Set required variable |
| CGCF03 | CRITICAL | Secret exposed | Rotate secret immediately |
| CGCF04 | WARNING | Deprecated setting | Update configuration |
| CGCF05 | ERROR | Validation failed | Fix configuration |
| CGCF06 | WARNING | Configuration drift | Sync with source control |
| CGCF07 | WARNING | Hot reload failed | Restart service |
| CGCF08 | WARNING | Version mismatch | Update configuration |
| CGCF09 | WARNING | Unsafe defaults | Harden configuration |
| CGCF10 | WARNING | Backup missing | Create configuration backup |

### CGBK - Backup/Recovery

| Code | Severity | Description | Recommended Action |
|------|----------|-------------|-------------------|
| CGBK01 | CRITICAL | Backup failed | Investigate and retry |
| CGBK02 | WARNING | Backup overdue (>24h) | Check backup schedule |
| CGBK03 | ERROR | Verification failed | Re-run backup |
| CGBK04 | ERROR | Backup storage full | Add storage, cleanup old |
| CGBK05 | ERROR | Restoration test failed | Review backup integrity |
| CGBK06 | ERROR | Encryption failed | Check encryption keys |
| CGBK07 | WARNING | Retention policy violated | Review retention settings |
| CGBK08 | WARNING | Replication lag | Check network, storage |
| CGBK09 | ERROR | Integrity check failed | Investigate corruption |
| CGBK10 | WARNING | Offsite sync failed | Check connectivity |

---

## Usage Examples

### Shell Script Integration

```bash
# Source the warning codes
source /infrastructure/scripts/warning-codes.sh

# Send an alert
send_alert "$CGDB01" "Connection timeout after 30s"

# Check severity
severity=$(get_severity "CGSC02")
if [ "$severity" -ge 2 ]; then
    echo "Critical alert!"
fi
```

### Health Check Integration

```bash
# The health-check.sh script automatically uses these codes
./infrastructure/scripts/health-check.sh

# Example output:
# ✗ PostgreSQL: FAIL (localhost:5432) [CGDB01]
# ⚠ Memory: WARNING (85% used, 2.1Gi available) [CGSY04]
```

### Alerting Integration

Configure alerting endpoints by setting environment variables:

```bash
export ALERT_WEBHOOK_URL="https://hooks.slack.com/services/..."
export ALERT_LOG="/var/log/cgraph/alerts.log"
```

---

## Best Practices

1. **Always include context** - When sending alerts, include relevant details (IPs, durations, counts)
2. **Set up escalation** - CRITICAL alerts should page on-call, WARNING alerts can be batched
3. **Configure thresholds** - Adjust thresholds based on your environment
4. **Test alerting** - Regularly verify alert delivery to all channels
5. **Document runbooks** - Create incident response procedures for each code

---

## Related Documentation

- [DEPLOYMENT.md](../guides/DEPLOYMENT.md) - Deployment procedures
- [SECURITY.md](../guides/SECURITY.md) - Security guidelines
- [OPERATIONS.md](../guides/OPERATIONS.md) - Operational procedures
- [PRODUCTION_READINESS.md](../guides/PRODUCTION_READINESS.md) - Production checklist
