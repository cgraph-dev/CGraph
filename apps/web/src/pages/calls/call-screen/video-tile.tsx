/**
 * VideoTile component - displays a participant's video or avatar
 */

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import type { VideoTileProps, CallUser } from './types';

export function VideoTile({
  stream,
  user,
  isMuted = false,
  isLocal = false,
  isPinned = false,
  onPin,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const hasVideo = stream?.getVideoTracks().some((t) => t.enabled);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`relative overflow-hidden rounded-2xl bg-dark-800 ${isPinned ? 'col-span-2 row-span-2' : ''} ${isLocal ? 'ring-2 ring-primary-500/50' : ''}`}
      onClick={onPin}
    >
      {hasVideo && stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-dark-800 to-dark-900">
          {user?.avatarUrl ? (
            <ThemedAvatar
              src={user.avatarUrl}
              alt={user.displayName}
              size="xlarge"
              className="h-24 w-24 ring-4 ring-dark-700"
              avatarBorderId={
                (user as CallUser)?.avatarBorderId ?? (user as CallUser)?.avatar_border_id ?? null // safe downcast – structural boundary
              }
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-purple-600 text-3xl font-bold text-white">
              {user?.displayName?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
        </div>
      )}

      {/* User Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">
            {isLocal ? 'You' : user?.displayName || 'Unknown'}
          </span>
          {isMuted && (
            <div className="rounded-full bg-red-500/80 p-1">
              <svg
                className="h-3 w-3 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Pin Badge */}
      {isPinned && (
        <div className="absolute right-3 top-3 rounded-lg bg-primary-500/80 p-1.5">
          <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
        </div>
      )}

      {/* Local Badge */}
      {isLocal && (
        <div className="absolute left-3 top-3 rounded-lg bg-dark-800/80 px-2 py-1 text-xs text-gray-300">
          You
        </div>
      )}
    </motion.div>
  );
}
