# Phase 36: Creator Economy - Context

**Gathered:** 2026-03-11 **Status:** Ready for execution

<domain>
## Phase Boundary

Full creator/consumer economy. Paid DM file attachments (sell/unlock). Forum monetization with 3
Node tiers per forum. Content gating types (one_time, time_based, tier_based). Boosts for
forums/threads/profiles. KYC/AML compliance. Tax receipts. Economic guardrails. Corresponds to
ATOMIC_PLAN v2.1 Phase 3 (Tasks 3.1–3.31).

Version target: v1.3.0

</domain>

<decisions>
## Implementation Decisions

### Paid DM Files

- `paid_file_attachment` schema linked to messages
- Categories: software, art, guide, replay, music, document, other
- 20% platform cut, 21-day hold on seller earnings
- Max price cap without review for new sellers
- DM group size ≤20 restriction for paid files
- Scam flagging: report/flag system + mod review queue

### Forum Monetization

- Replace boolean `monetization_enabled` with enum: free/gated/hybrid
- 3 Node tiers per forum: Supporter (500/mo), Pro (2000/mo), Founder (50K one-time)
- Tiers map to feature flags: private boards, attachment size, threads/day limits
- Configurable revenue share (default 80%, adjustable)
- Content gating types: one_time, time_based, tier_based

### Boosts

- Boostable types: forums, threads, profiles
- Duration-based pricing
- Discovery score multiplier with organic floor (boosts influence but don't override)
- "Boosted" label for transparency

### Compliance

- KYC threshold: €500 lifetime earnings triggers verification
- AML: detect circular tips, high-frequency patterns
- Tax receipts: monthly/yearly PDF generation
- Refund/reversal audit log

### Economic Guardrails

- Reputation gating: minimum pulse score to sell files or create gated forums
- Weekly payout processing (Oban cron)
- Refund audit trail

</decisions>

<specifics>
## Specific Ideas

- Paid file: "Sell this file" toggle in DM file picker
- Unlock modal: "Unlock for ℕ X — Creator receives 80%"
- Forum tier editor: visual card-based UI for 3 tiers
- Boost button on forum/thread long-press (mobile)
- Creator dashboard: earnings graph, transaction history, pending payouts

</specifics>

<deferred>
## Deferred Ideas

- Stripe→Paddle migration for Merchant of Record compliance
- Subscription renewal reminders
- Automated payout scheduling (currently manual request)
- Tip leaderboards per forum

</deferred>

---

_Phase: 36-creator-economy_ _Context gathered: 2026-03-11_
