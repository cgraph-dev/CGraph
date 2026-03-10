# Plan 30-01 Summary: Pulse Backend

## Status: Complete

## Deliverables

- Migration: `pulse_scores` + `pulse_transactions` tables with binary_id PKs and proper indexes
- PulseSystem context (5 files): PulseScore, PulseTransaction, PulseTiers, TransactionProcessor,
  PulseSystem
- PulseDecayWorker (Oban, daily 2AM UTC, 5% decay after 30 days inactive)
- PulseController (4 endpoints) + pulse_routes.ex macro integrated into router.ex

## Commits

- `d82611ea` — feat(pulse): create pulse_scores and pulse_transactions migration
- `4f1c4412` — feat(pulse): add pulse system context with schemas, tiers, and transaction processor
- `50a3c38b` — feat(pulse): add pulse decay worker with oban crontab entries
- `21552bde` — feat(pulse): add pulse api controller, routes, and router integration

## API Endpoints

| Method | Path                            | Action                                       |
| ------ | ------------------------------- | -------------------------------------------- |
| GET    | /api/v1/pulse/me                | my_pulse — all pulse scores for current user |
| GET    | /api/v1/pulse/community/:id     | community_pulse — user's pulse in a forum    |
| POST   | /api/v1/pulse/vote              | vote — resonate/fade/not_for_me              |
| GET    | /api/v1/pulse/top/:community_id | top — leaderboard for a forum                |

## Issues

None — backend compiles cleanly after every task.
