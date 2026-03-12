---
phase: 40-100-percent-completion
plan: 02
status: complete
---

# 40-02 Summary: KYC/AML + Reputation Levels + Thread Archiving + Guardrails

## Tasks Completed

1. **Task 1: KYC enforcement module** (commit `035d72ab`)
   - KYCEnforcement module with €500 threshold
   - check_kyc_required/1, kyc_status/1, enforce_kyc!/1
   - Integrated with request_withdrawal/2 in nodes.ex

2. **Task 2: AML monitoring + worker** (commit `bd905c33`)
   - AMLFlag schema on aml_flags table with severity/status tracking
   - AMLMonitor context: scan_user/1, check_circular_tips/1, check_rapid_volume/1,
     check_structuring/1
   - AMLScanWorker (Oban daily cron at 5 AM, aml_scan queue)
   - Migration 20260729100003_create_aml_flags

3. **Task 3: Reputation levels + thread archiving + boost + guardrails** (commit `bd905c33`)
   - ReputationLevel module (iron→diamond, 6 levels, pure constants)
   - reputation.ex extended with level_for_score/1 delegation
   - Thread.ex: is_archived field + migration 20260729100004
   - Boost.ex: @target_types extended with "profile"
   - nodes.ex: @max_paid_dm_price 10_000, reputation_gate/1
   - paid_dm_setting.ex: max price validation (≤ 10,000)
   - BoostExpirationWorker: hourly Oban cron calling expire_boosts/0
   - prod.exs: crontab entry for boost expiration

## Files Created

- apps/backend/lib/cgraph/compliance/kyc_enforcement.ex
- apps/backend/lib/cgraph/compliance/aml_monitor.ex
- apps/backend/lib/cgraph/compliance/aml_flag.ex
- apps/backend/lib/cgraph/workers/aml_scan_worker.ex
- apps/backend/lib/cgraph/forums/reputation_level.ex
- apps/backend/lib/cgraph/workers/boost_expiration_worker.ex
- apps/backend/priv/repo/migrations/20260729100003_create_aml_flags.exs
- apps/backend/priv/repo/migrations/20260729100004_add_thread_is_archived.exs

## Files Modified

- apps/backend/lib/cgraph/forums/reputation.ex (level_for_score delegation)
- apps/backend/lib/cgraph/forums/thread.ex (is_archived field + cast)
- apps/backend/lib/cgraph/boosts/boost.ex (profile target type)
- apps/backend/lib/cgraph/nodes/nodes.ex (max_paid_dm_price, reputation_gate)
- apps/backend/lib/cgraph/paid_dm/paid_dm_setting.ex (max price validation)
- apps/backend/config/config.exs (aml_scan queue)
- apps/backend/config/prod.exs (boost expiration crontab)

## Deviations

None

## Verification

Backend compiles with zero errors.
