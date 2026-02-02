import { useState } from 'react';
import CalendarView from '@/modules/social/components/CalendarView';
import EventForm from '@/modules/social/components/EventForm';
import { CalendarEvent } from '@/stores/calendarStore';

/**
 * Calendar Page
 *
 * Main calendar page with event viewing and creation
 */

export default function CalendarPage() {
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | undefined>();
  const [initialDate, setInitialDate] = useState<Date | undefined>();

  const handleCreateEvent = () => {
    setEditingEventId(undefined);
    setInitialDate(new Date());
    setShowEventForm(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setEditingEventId(event.id);
    setShowEventForm(true);
  };

  const handleCloseForm = () => {
    setShowEventForm(false);
    setEditingEventId(undefined);
    setInitialDate(undefined);
  };

  return (
    <>
      <CalendarView onCreateEvent={handleCreateEvent} onEventClick={handleEventClick} />

      {showEventForm && (
        <EventForm
          eventId={editingEventId}
          initialDate={initialDate}
          onClose={handleCloseForm}
          onSuccess={() => {
            // Refresh handled by store
          }}
        />
      )}
    </>
  );
}
