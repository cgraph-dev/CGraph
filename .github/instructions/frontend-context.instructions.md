---
applyTo: "{apps/web,apps/mobile,apps/landing}/**"
---
# CGraph Frontend — Copilot Context

## Stack
React 19 + TypeScript strict + Vite + SWC (web)
React Native 0.81 + Expo SDK 54 (mobile)
Zustand v5 (client state) + TanStack Query v5 (server state)
Tailwind + CVA + Radix UI + Framer Motion 12 + GSAP

## NEVER
- Use raw fetch — always @cgraph/api-client
- Use raw Phoenix client — always @cgraph/socket
- Redefine API types — always import from @cgraph/shared-types
- Implement crypto inline — always @cgraph/crypto
- Put business logic in components — use hooks + stores
- Store JWT in localStorage — httpOnly cookies only
- Import directly between feature modules — use barrel exports

## ALWAYS
- Read docs/API_CONTRACTS.md before any API call
- Server state → TanStack Query
- Client/UI state → Zustand store slice
- All user HTML → DOMPurify
- E2EE keys → IndexedDB (web) / expo-secure-store (mobile)

## Module Structure (every feature)
api/ components/ hooks/ store/ types/ index.ts
