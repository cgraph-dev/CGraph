/**
 * DateTimeFields Component - Date and time picker inputs for event scheduling
 * @module modules/social/components/event-form
 */
import { ClockIcon } from '@heroicons/react/24/outline';
import type { EventFormData } from '@/modules/settings/store';
import { formatDateTimeLocal, formatDateLocal } from './hooks';

interface DateTimeFieldsProps {
  formData: EventFormData;
  errors: Record<string, string>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDateChange: (field: 'startDate' | 'endDate', value: string) => void;
}

/**
 * Date Time Fields component.
 */
export default function DateTimeFields({
  formData,
  errors,
  handleChange,
  handleDateChange,
}: DateTimeFieldsProps) {
  return (
    <>
      {/* All Day Toggle */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="allDay"
          name="allDay"
          checked={formData.allDay}
          onChange={handleChange}
          className="border-border text-primary focus:ring-primary h-4 w-4 rounded"
        />
        <label htmlFor="allDay" className="text-foreground cursor-pointer text-sm font-medium">
          All-day event
        </label>
      </div>

      {/* Date/Time */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-foreground mb-1 block text-sm font-medium">
            Start {formData.allDay ? 'Date' : 'Date & Time'} *
          </label>
          <div className="relative">
            <ClockIcon className="text-muted-foreground absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2" />
            <input
              type={formData.allDay ? 'date' : 'datetime-local'}
              value={
                formData.allDay
                  ? formatDateLocal(formData.startDate)
                  : formatDateTimeLocal(formData.startDate)
              }
              onChange={(e) => handleDateChange('startDate', e.target.value)}
              className={`bg-background focus:ring-primary w-full rounded-lg border py-2 pl-10 pr-4 focus:outline-none focus:ring-2 ${
                errors.startDate ? 'border-destructive' : 'border-border'
              }`}
            />
          </div>
          {errors.startDate && <p className="text-destructive mt-1 text-sm">{errors.startDate}</p>}
        </div>

        <div>
          <label className="text-foreground mb-1 block text-sm font-medium">
            End {formData.allDay ? 'Date' : 'Date & Time'}
          </label>
          <div className="relative">
            <ClockIcon className="text-muted-foreground absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2" />
            <input
              type={formData.allDay ? 'date' : 'datetime-local'}
              value={
                formData.allDay
                  ? formatDateLocal(formData.endDate || '')
                  : formatDateTimeLocal(formData.endDate || '')
              }
              onChange={(e) => handleDateChange('endDate', e.target.value)}
              className={`bg-background focus:ring-primary w-full rounded-lg border py-2 pl-10 pr-4 focus:outline-none focus:ring-2 ${
                errors.endDate ? 'border-destructive' : 'border-border'
              }`}
            />
          </div>
          {errors.endDate && <p className="text-destructive mt-1 text-sm">{errors.endDate}</p>}
        </div>
      </div>
    </>
  );
}
