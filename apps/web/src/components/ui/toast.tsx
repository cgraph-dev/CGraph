/**
 * Toast notification component.
 * @module
 */
import { create } from 'zustand';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
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
    bgColor: 'bg-[rgba(15,19,40,0.85)]',
    borderColor: 'border-white/[0.12] border-l-2 border-l-emerald-500',
    iconColor: 'text-emerald-400',
  },
  error: {
    icon: XCircleIcon,
    bgColor: 'bg-[rgba(15,19,40,0.85)]',
    borderColor: 'border-white/[0.12] border-l-2 border-l-red-500',
    iconColor: 'text-red-400',
  },
  warning: {
    icon: ExclamationTriangleIcon,
    bgColor: 'bg-[rgba(15,19,40,0.85)]',
    borderColor: 'border-white/[0.12] border-l-2 border-l-amber-500',
    iconColor: 'text-amber-400',
  },
  info: {
    icon: InformationCircleIcon,
    bgColor: 'bg-[rgba(15,19,40,0.85)]',
    borderColor: 'border-white/[0.12] border-l-2 border-l-[var(--color-brand-purple)]',
    iconColor: 'text-[var(--color-brand-purple)]',
  },
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const config = typeConfig[toast.type];
  const Icon = config.icon;
  const prefersReducedMotion = useReducedMotion();

  const springTransition = prefersReducedMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 320, damping: 28 };

  return (
    <motion.div
      layout
      initial={prefersReducedMotion ? false : { opacity: 0, x: 60, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={
        prefersReducedMotion
          ? { opacity: 0 }
          : { opacity: 0, x: 60, scale: 0.9, height: 0, marginBottom: 0 }
      }
      transition={springTransition}
      role="alert"
      aria-live="assertive"
      className={`flex items-start gap-3 rounded-xl border p-4 backdrop-blur-xl ${config.bgColor} ${config.borderColor} shadow-card`}
    >
      <Icon className={`h-5 w-5 ${config.iconColor} mt-0.5 flex-shrink-0`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white">{toast.title}</p>
        {toast.message && <p className="mt-1 text-sm text-gray-400">{toast.message}</p>}
      </div>
      <button
        onClick={onRemove}
        className="flex-shrink-0 text-gray-400 transition-colors hover:text-white"
        aria-label="Dismiss notification"
      >
        <XMarkIcon className="h-5 w-5" />
      </button>
    </motion.div>
  );
}

/**
 * unknown for the ui module.
 */
/**
 * Toast Container wrapper component.
 */
export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div
      aria-label="Notifications"
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onRemove={() => removeToast(t.id)} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default ToastContainer;
