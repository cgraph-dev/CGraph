/**
 * EventFormFields Component - Event metadata fields (location, description, category)
 * @module modules/social/components/event-form
 */
import {
  MapPinIcon,
  DocumentTextIcon,
  TagIcon,
  GlobeAltIcon,
  UsersIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import type { EventFormData, RecurrencePattern } from '@/modules/settings/store';

interface Category {
  id: string;
  name: string;
}

interface EventFormFieldsProps {
  formData: EventFormData;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  handleRecurrenceChange: (pattern: RecurrencePattern | '') => void;
  categories: Category[];
}

/**
 * Event Form Fields component.
 */
export default function EventFormFields({
  formData,
  handleChange,
  handleRecurrenceChange,
  categories,
}: EventFormFieldsProps) {
  return (
    <>
      {/* Location */}
      <div>
        <label className="text-foreground mb-1 block text-sm font-medium">Location</label>
        <div className="relative">
          <MapPinIcon className="text-muted-foreground absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2" />
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Add location (optional)"
            className="bg-background border-border focus:ring-primary w-full rounded-lg border py-2 pl-10 pr-4 focus:outline-none focus:ring-2"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="text-foreground mb-1 block text-sm font-medium">Description</label>
        <div className="relative">
          <DocumentTextIcon className="text-muted-foreground absolute left-3 top-3 h-5 w-5" />
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Add description (optional)"
            rows={4}
            className="bg-background border-border focus:ring-primary w-full resize-none rounded-lg border py-2 pl-10 pr-4 focus:outline-none focus:ring-2"
          />
        </div>
      </div>

      {/* Category & Visibility */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-foreground mb-1 block text-sm font-medium">Category</label>
          <div className="relative">
            <TagIcon className="text-muted-foreground absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2" />
            <select
              name="categoryId"
              value={formData.categoryId || ''}
              onChange={handleChange}
              className="bg-background border-border focus:ring-primary w-full appearance-none rounded-lg border py-2 pl-10 pr-4 focus:outline-none focus:ring-2"
            >
              <option value="">No category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-foreground mb-1 block text-sm font-medium">Visibility</label>
          <div className="relative">
            <GlobeAltIcon className="text-muted-foreground absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2" />
            <select
              name="visibility"
              value={formData.visibility}
              onChange={handleChange}
              className="bg-background border-border focus:ring-primary w-full appearance-none rounded-lg border py-2 pl-10 pr-4 focus:outline-none focus:ring-2"
            >
              <option value="public">🌐 Public</option>
              <option value="members">👥 Members Only</option>
              <option value="invite">🔒 Invite Only</option>
              <option value="private">🔐 Private</option>
            </select>
          </div>
        </div>
      </div>

      {/* Recurrence */}
      <div>
        <label className="text-foreground mb-1 block text-sm font-medium">Repeat</label>
        <div className="relative">
          <ArrowPathIcon className="text-muted-foreground absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2" />
          <select
            value={formData.recurrence?.pattern || ''}
            // type assertion: select element value matches RecurrencePattern union
             
            onChange={(e) => handleRecurrenceChange(e.target.value as RecurrencePattern | '')}
            className="bg-background border-border focus:ring-primary w-full appearance-none rounded-lg border py-2 pl-10 pr-4 focus:outline-none focus:ring-2"
          >
            <option value="">Does not repeat</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Every 2 weeks</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>

      {/* Max Attendees */}
      <div>
        <label className="text-foreground mb-1 block text-sm font-medium">Max Attendees</label>
        <div className="relative">
          <UsersIcon className="text-muted-foreground absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2" />
          <input
            type="number"
            name="maxAttendees"
            value={formData.maxAttendees || ''}
            onChange={handleChange}
            placeholder="Unlimited"
            min="1"
            className="bg-background border-border focus:ring-primary w-full rounded-lg border py-2 pl-10 pr-4 focus:outline-none focus:ring-2"
          />
        </div>
        <p className="text-muted-foreground mt-1 text-xs">Leave empty for unlimited attendees</p>
      </div>
    </>
  );
}
