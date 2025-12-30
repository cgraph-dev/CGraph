import { create } from 'zustand';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(7);
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
    
    // Auto-remove after duration
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

// Toast helper functions
export const toast = {
  success: (title: string, message?: string) => 
    useToastStore.getState().addToast({ type: 'success', title, message }),
  error: (title: string, message?: string) => 
    useToastStore.getState().addToast({ type: 'error', title, message }),
  warning: (title: string, message?: string) => 
    useToastStore.getState().addToast({ type: 'warning', title, message }),
  info: (title: string, message?: string) => 
    useToastStore.getState().addToast({ type: 'info', title, message }),
};

const typeConfig = {
  success: {
    icon: CheckCircleIcon,
    bgColor: 'bg-green-600/10',
    borderColor: 'border-green-600/50',
    iconColor: 'text-green-500',
  },
  error: {
    icon: XCircleIcon,
    bgColor: 'bg-red-600/10',
    borderColor: 'border-red-600/50',
    iconColor: 'text-red-500',
  },
  warning: {
    icon: ExclamationTriangleIcon,
    bgColor: 'bg-yellow-600/10',
    borderColor: 'border-yellow-600/50',
    iconColor: 'text-yellow-500',
  },
  info: {
    icon: InformationCircleIcon,
    bgColor: 'bg-blue-600/10',
    borderColor: 'border-blue-600/50',
    iconColor: 'text-blue-500',
  },
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const config = typeConfig[toast.type];
  const Icon = config.icon;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`flex items-start gap-3 p-4 rounded-lg border ${config.bgColor} ${config.borderColor} shadow-lg animate-slide-in`}
    >
      <Icon className={`h-5 w-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{toast.title}</p>
        {toast.message && (
          <p className="text-sm text-gray-400 mt-1">{toast.message}</p>
        )}
      </div>
      <button
        onClick={onRemove}
        className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
        aria-label="Dismiss notification"
      >
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onRemove={() => removeToast(t.id)} />
        </div>
      ))}
    </div>
  );
}

export default ToastContainer;
