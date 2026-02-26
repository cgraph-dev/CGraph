/**
 * ProfilePhotoViewer - Fullscreen avatar viewer with morph animation
 * Tap any avatar to smoothly expand to fullscreen via layoutId transition
 * @module components/ui
 */
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import {
  createContext,
  use,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { tweens, springs } from '@/lib/animation-presets';

// ── Types ──────────────────────────────────────────────────
interface ProfilePhoto {
  id: string;
  src: string;
  alt: string;
  fallback?: string;
}

interface ProfilePhotoViewerContextValue {
  open: (photo: ProfilePhoto) => void;
  close: () => void;
  activeId: string | null;
}

// ── Context ────────────────────────────────────────────────
const ProfilePhotoViewerContext =
  createContext<ProfilePhotoViewerContextValue | null>(null);

/**
 * unknown for the ui module.
 */
/**
 * Hook for managing profile photo viewer.
 */
export function useProfilePhotoViewer() {
  const ctx = use(ProfilePhotoViewerContext);
  if (!ctx) {
    throw new Error(
      'useProfilePhotoViewer must be used within ProfilePhotoViewerProvider',
    );
  }
  return ctx;
}

// ── Provider ───────────────────────────────────────────────
/**
 * unknown for the ui module.
 */
/**
 * Profile Photo Viewer Provider — context provider wrapper.
 */
export function ProfilePhotoViewerProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [activePhoto, setActivePhoto] = useState<ProfilePhoto | null>(null);

  const open = useCallback((photo: ProfilePhoto) => {
    setActivePhoto(photo);
    HapticFeedback.medium();
  }, []);

  const close = useCallback(() => {
    setActivePhoto(null);
    HapticFeedback.light();
  }, []);

  return (
    <ProfilePhotoViewerContext.Provider
      value={{ open, close, activeId: activePhoto?.id ?? null }}
    >
      {children}

      {/* Fullscreen overlay */}
      <AnimatePresence>
        {activePhoto && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={tweens.fast}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
              onClick={close}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Close button */}
            <motion.button
              className="absolute right-4 top-4 z-10 rounded-full bg-dark-800/80 p-2.5 text-white transition-colors hover:bg-dark-700"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={close}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: 0.1 }}
            >
              <XMarkIcon className="h-6 w-6" />
            </motion.button>

            {/* Photo with layoutId morph from thumbnail to fullscreen */}
            <motion.div
              className="relative z-10"
              layoutId={`profile-photo-${activePhoto.id}`}
              transition={springs.bouncy}
              onClick={(e) => e.stopPropagation()}
            >
              {activePhoto.src ? (
                <motion.img
                  src={activePhoto.src}
                  alt={activePhoto.alt}
                  className="max-h-[80vh] max-w-[80vw] rounded-2xl object-cover shadow-2xl"
                  style={{ minWidth: 200, minHeight: 200 }}
                />
              ) : (
                <motion.div className="flex h-64 w-64 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-2xl">
                  <span className="text-7xl font-bold text-white">
                    {activePhoto.fallback ?? '?'}
                  </span>
                </motion.div>
              )}
            </motion.div>

            {/* Name label */}
            <motion.p
              className="absolute bottom-8 z-10 text-lg font-semibold text-white/90"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ delay: 0.15 }}
            >
              {activePhoto.alt}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </ProfilePhotoViewerContext.Provider>
  );
}

// ── Clickable Avatar Thumbnail ─────────────────────────────
interface ClickableAvatarProps {
  id: string;
  src?: string;
  alt: string;
  fallback?: string;
  size?: number;
  className?: string;
  children?: ReactNode;
}

/**
 * unknown for the ui module.
 */
/**
 * Clickable Avatar component.
 */
export function ClickableAvatar({
  id,
  src,
  alt,
  fallback,
  size = 40,
  className = '',
  children,
}: ClickableAvatarProps) {
  const { open, activeId } = useProfilePhotoViewer();

  const handleClick = () => {
    open({ id, src: src ?? '', alt, fallback });
  };

  return (
    <motion.div
      layoutId={activeId !== id ? `profile-photo-${id}` : undefined}
      className={`cursor-pointer ${className}`}
      onClick={handleClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={springs.snappy}
      style={{ width: size, height: size }}
    >
      {children ?? (
        src ? (
          <img
            src={src}
            alt={alt}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700">
            <span className="font-semibold text-white">
              {fallback ?? alt.charAt(0).toUpperCase()}
            </span>
          </div>
        )
      )}
    </motion.div>
  );
}
