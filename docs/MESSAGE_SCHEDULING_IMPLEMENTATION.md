# Message Scheduling Implementation Plan

> **Status**: Foundation Complete, Full Implementation Pending **Version**: 0.9.5 **Last Updated**:
> January 2026

## Overview

Message scheduling allows users to compose messages and schedule them for delivery at a future
date/time. This document outlines the implementation plan and tracks progress.

## Architecture

### Database Layer ✅ COMPLETE

**Migration**: `20260127000001_add_scheduled_messages_support.exs`

Added fields to `messages` table:

- `scheduled_at` (utc_datetime_usec): When the message should be sent
- `schedule_status` (string): Status tracking ('immediate', 'scheduled', 'sent', 'cancelled')

Indexes created:

- Partial index on `scheduled_at` where `schedule_status = 'scheduled'` (for efficient worker
  queries)
- Index on `schedule_status` (for status filtering)
- Composite index on `conversation_id + schedule_status` (for listing scheduled messages)

### Worker Layer ✅ COMPLETE

**Worker**: `CGraph.Workers.ScheduledMessageWorker`

Features:

- Runs every minute via Oban.Plugins.Cron
- Queries messages where `scheduled_at <= now()` and `schedule_status = 'scheduled'`
- Broadcasts messages via Phoenix channels for real-time delivery
- Updates status to 'sent' after broadcasting
- Processes up to 100 messages per run
- 3 max retry attempts for failed jobs

**Cron Configuration**: Added to `config/config.exs`

```elixir
{Oban.Plugins.Cron,
 crontab: [
   {"* * * * *", CGraph.Workers.ScheduledMessageWorker}
 ]}
```

### Schema Updates ✅ COMPLETE

**File**: `lib/cgraph/messaging/message.ex`

Added fields:

- `field :scheduled_at, :utc_datetime_usec`
- `field :schedule_status, :string, default: "immediate"`

Updated Jason encoder to include new fields in JSON responses.

Updated changeset to accept `scheduled_at` and `schedule_status` parameters.

## API Endpoints ⏳ PENDING

Need to create endpoints in `MessageController`:

### POST `/api/v1/conversations/:id/messages` (Modified)

Add support for `scheduled_at` parameter:

```elixir
def create(conn, %{"scheduled_at" => scheduled_at} = params) when not is_nil(scheduled_at) do
  # Validate scheduled_at is in the future
  # Set schedule_status to "scheduled"
  # Create message with scheduled_at timestamp
  # Return message with status "scheduled"
end
```

### GET `/api/v1/conversations/:id/scheduled-messages`

List all scheduled messages for a conversation:

- Filter by `schedule_status = 'scheduled'`
- Order by `scheduled_at ASC`
- Paginate results

### PATCH `/api/v1/messages/:id/reschedule`

Reschedule an existing scheduled message:

- Validate message is still in 'scheduled' status
- Update `scheduled_at` to new timestamp
- Return updated message

### DELETE `/api/v1/messages/:id/cancel-schedule`

Cancel a scheduled message:

- Validate message is in 'scheduled' status
- Update `schedule_status` to 'cancelled'
- Return confirmation

## Frontend Implementation ⏳ PENDING

### ScheduleMessageModal Component

**File**: `apps/web/src/components/chat/ScheduleMessageModal.tsx`

Features needed:

- Date/time picker for scheduling
- Timezone selector (default to user's timezone)
- Preview of scheduled send time
- Quick scheduling buttons (1 hour, tomorrow, next week)
- Recurring message options (daily, weekly, monthly)
- Validation (must be future time, max 1 year out)

**UI Flow**:

1. User composes message
2. Clicks "Schedule" button (clock icon)
3. Modal opens with date/time picker
4. User selects send time
5. Confirms scheduling
6. Message saved with `schedule_status = 'scheduled'`

### Scheduled Messages List

**Component**: `ScheduledMessagesList.tsx`

Display scheduled messages with:

- Grouped by date (Today, Tomorrow, This Week, Later)
- Preview of message content
- Scheduled time with countdown
- Edit and Cancel buttons
- Status indicators

### Integration Points

1. **Conversation View**
   - Add "Schedule" button to message input area (clock icon)
   - Show scheduled messages indicator in conversation header
   - Display scheduled messages in a separate panel

2. **State Management** (`chatStore.ts`)
   ```typescript
   interface ChatState {
     scheduledMessages: Record<string, Message[]>;
     fetchScheduledMessages: (conversationId: string) => Promise<void>;
     scheduleMessage: (conversationId: string, content: string, scheduledAt: Date) => Promise<void>;
     cancelScheduledMessage: (messageId: string) => Promise<void>;
     rescheduleMessage: (messageId: string, newScheduledAt: Date) => Promise<void>;
   }
   ```

## Advanced Features (Future)

### Recurring Messages

- Daily, weekly, monthly, yearly recurrence
- End date or occurrence count
- Skip weekends/holidays option

### Smart Scheduling

- Suggest optimal send times based on recipient activity
- Time zone conversion for multi-timezone conversations
- "Send when online" option (sends when recipient is active)

### Batch Scheduling

- Schedule multiple messages at once
- Template-based scheduling (birthday messages, reminders)
- Import schedule from calendar

## Testing Plan

### Backend Tests

```elixir
# test/cgraph/workers/scheduled_message_worker_test.exs
describe "ScheduledMessageWorker" do
  test "sends messages when scheduled_at is reached"
  test "does not send messages scheduled for future"
  test "updates message status to 'sent' after sending"
  test "broadcasts message via Phoenix channels"
  test "handles messages with deleted conversations"
  test "processes up to 100 messages per run"
end

# test/cgraph/messaging_test.exs
describe "schedule_message/3" do
  test "creates message with scheduled_at in future"
  test "rejects scheduled_at in the past"
  test "sets schedule_status to 'scheduled'"
end
```

### Frontend Tests

```typescript
// MessageScheduling.test.tsx
describe('ScheduleMessageModal', () => {
  it('opens when schedule button is clicked');
  it('validates future time only');
  it('displays timezone selector');
  it('schedules message on confirm');
  it('closes modal after scheduling');
});

describe('ScheduledMessagesList', () => {
  it('groups messages by date');
  it('shows countdown to scheduled time');
  it('allows canceling scheduled messages');
  it('allows rescheduling messages');
});
```

## Migration Path

### Phase 1: Core Scheduling ✅ FOUNDATION COMPLETE

- [x] Database migration
- [x] Worker implementation
- [x] Cron configuration
- [x] Schema updates

### Phase 2: API Layer ⏳ IN PROGRESS

- [ ] Create/modify message endpoint
- [ ] List scheduled messages endpoint
- [ ] Reschedule endpoint
- [ ] Cancel endpoint
- [ ] API tests

### Phase 3: Frontend UI ⏳ PENDING

- [ ] ScheduleMessageModal component
- [ ] Date/time picker integration
- [ ] Schedule button in conversation view
- [ ] Scheduled messages list
- [ ] State management
- [ ] Frontend tests

### Phase 4: Advanced Features 📋 PLANNED

- [ ] Recurring messages
- [ ] Smart scheduling suggestions
- [ ] Batch scheduling
- [ ] Calendar integration

## Performance Considerations

1. **Worker Efficiency**
   - Partial index ensures worker queries are fast (< 10ms)
   - Batch limit of 100 prevents timeouts
   - Runs every minute (configurable)

2. **Database Impact**
   - Scheduled messages don't appear in normal message queries
   - Filtered by `schedule_status` in all queries
   - Minimal storage overhead (2 extra fields)

3. **Scaling**
   - Worker can be parallelized across multiple nodes
   - Oban handles distributed job processing
   - No single point of failure

## Security & Privacy

1. **Authorization**
   - Users can only schedule messages in conversations they're part of
   - Only message sender can cancel/reschedule their own scheduled messages

2. **Validation**
   - Scheduled time must be in future
   - Maximum schedule time: 1 year
   - Validate conversation access before scheduling

3. **Encryption**
   - Scheduled messages support E2EE
   - Encrypted messages stored until send time
   - Decryption happens at send time, not schedule time

## Success Metrics

- **Adoption**: % of users who schedule at least one message
- **Usage**: Average scheduled messages per active user per week
- **Reliability**: % of scheduled messages sent within 1 minute of scheduled time
- **Cancellation Rate**: % of scheduled messages cancelled before sending

## Known Limitations

1. **Timezone Handling**: Currently uses UTC, frontend must convert
2. **Recurring Messages**: Not yet implemented
3. **Calendar Integration**: Not yet implemented
4. **Maximum Schedule Time**: 1 year (configurable)

## References

- [Oban Documentation](https://hexdocs.pm/oban/Oban.html)
- [Phoenix PubSub Documentation](https://hexdocs.pm/phoenix_pubsub/Phoenix.PubSub.html)
- Message schema: `lib/cgraph/messaging/message.ex`
- Worker: `lib/cgraph/workers/scheduled_message_worker.ex`
- Migration: `priv/repo/migrations/20260127000001_add_scheduled_messages_support.exs`
