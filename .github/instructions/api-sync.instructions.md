# API Contract Sync — Mandatory Rules

## Backend: After ANY endpoint add/change
1. Update docs/API_CONTRACTS.md with exact request/response shape
2. Update packages/shared-types/src/ if shape changed
3. Commit both files in the SAME commit as the endpoint

## Frontend: Before ANY API call implementation
1. Read docs/API_CONTRACTS.md for the contract
2. Import types from @cgraph/shared-types — never define locally
3. If contract missing → add TODO comment, do not guess

## WebSocket: Message shapes in packages/shared-types/src/events/
Always use typed wrappers from @cgraph/socket package
