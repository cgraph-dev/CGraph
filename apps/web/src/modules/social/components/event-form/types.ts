export interface EventFormProps {
  eventId?: string;
  initialDate?: Date;
  onClose: () => void;
  onSuccess?: () => void;
}
