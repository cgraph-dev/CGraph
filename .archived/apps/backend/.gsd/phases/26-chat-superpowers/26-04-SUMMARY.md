---
phase: 26-chat-superpowers
plan: 04
subsystem: messaging
tags: [file-transfer, uploads, downloads, chunked, storage, oban]

requires: []
provides:
  - 'File transfer system with initiate/chunk/complete/download/cancel lifecycle'
  - 'Tier-based file size limits (25MB-200MB) and storage quotas (500MB-50GB)'
  - 'Dangerous file type blocking (.exe, .bat, .cmd, etc.)'
  - 'Presigned URL generation for both upload and download'
  - 'FileCleanupWorker (Oban hourly) for stale and expired transfers'
  - 'REST API at /api/v1/transfers/* (7 endpoints)'
affects: [26-07-chat-completeness]

tech-stack:
  added: []
  patterns:
    - 'Nested schema (Transfer) inside context module (FileTransfer)'
    - 'Phoenix.Token for signed download URLs (1h expiry)'
    - 'CGraph.Storage for presigned upload/download URLs'
    - 'Direct upload for files ≤5MB, chunked for larger'
    - 'Chunk size: 5MB fixed'

key-files:
  created:
    - lib/cgraph/messaging/file_transfer.ex
    - lib/cgraph_web/controllers/api/v1/file_transfer_controller.ex
    - lib/cgraph/workers/file_cleanup_worker.ex
    - priv/repo/migrations/20260306200000_create_file_transfers.exs
    - test/cgraph/messaging/file_transfer_test.exs
    - test/cgraph_web/controllers/api/v1/file_transfer_controller_test.exs
  modified:
    - lib/cgraph_web/router/messaging_routes.ex
    - config/config.exs
    - test/support/factory.ex

key-decisions:
  - 'Routes at /api/v1/transfers/* (not /files/*) to avoid conflict with existing UploadController'
  - 'No separate JSON view module — controller renders inline via render_transfer/1 helper'
  - 'No separate chunked_upload.ex or download_token.ex — consolidated into single context module'
  - 'Transfer statuses: pending → uploading → processing → ready (also failed, expired)'
  - 'Storage usage sums file_size where status in [ready, processing, uploading]'
  - 'Cleanup: pending >24h deleted, expired transfers deleted'

patterns-established:
  - 'Tier-based resource limits: per-file size + total storage quota'
  - 'File validation: extension blocklist approach for dangerous types'
  - 'Signed download tokens: Phoenix.Token with configurable max_age'
---

## Summary

Plan 26-04 implements a complete file transfer system for chat messaging.

### What was built

1. **FileTransfer context** (`lib/cgraph/messaging/file_transfer.ex`, ~400 lines):
   - Nested `Transfer` Ecto schema with full lifecycle tracking
   - `initiate_upload/2`: validates file type/size/quota, creates record, returns presigned upload
     config
   - `upload_chunk/3`: records chunk progress for chunked uploads
   - `complete_upload/2`: finalizes upload, stores checksum
   - `generate_download_url/3`: creates Phoenix.Token signed URLs
   - `cancel_upload/2`: cleans storage and marks failed
   - `cleanup_stale_transfers/0`: removes abandoned (24h) and expired transfers

2. **FileTransferController** (7 endpoints):
   - POST /api/v1/transfers/upload — initiate
   - PUT /api/v1/transfers/:id/chunks/:chunk_number — upload chunk
   - POST /api/v1/transfers/:id/complete — complete upload
   - GET /api/v1/transfers/:id/download — generate download URL
   - GET /api/v1/transfers/:id — status
   - DELETE /api/v1/transfers/:id — cancel
   - GET /api/v1/transfers/usage — storage usage

3. **FileCleanupWorker**: Oban worker running hourly on :cleanup queue

4. **Tier limits**:
   - File size: free=25MB, plus=50MB, pro=100MB, ultimate=200MB
   - Storage: free=500MB, plus=2GB, pro=10GB, ultimate=50GB

### Test results

- **42 tests, 0 failures** (26 context + 16 controller)
- Context tests: initiate_upload (6), upload_chunk (3), complete_upload (4), generate_download_url
  (3), get_transfer (2), get_user_storage_usage (2), cancel_upload (3), cleanup_stale_transfers (3)
- Controller tests: auth (3), upload initiation (4), status (2), complete (1), download (2), cancel
  (2), usage (2)

### Deviations from plan

- Consolidated `chunked_upload.ex` and `download_token.ex` into main `file_transfer.ex` context
  (simpler, under 400 lines)
- No separate JSON view module (controller handles rendering inline)
- Routes under `/transfers` instead of `/files` to avoid conflict with existing
  `UploadController :show` at `GET /api/v1/files/:id`
