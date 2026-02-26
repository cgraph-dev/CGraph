/** PreviewCard — renders a live preview of a profile theme configuration. */
import { motion } from 'framer-motion';
import type { ProfileThemeConfig } from '@/data/profileThemes';
import { tweens, loop } from '@/lib/animation-presets';

interface PreviewCardProps {
  theme: ProfileThemeConfig;
}

/**
 * Preview Card display component.
 */
export default function PreviewCard({ theme }: PreviewCardProps) {
  return (
    <>
      {/* Center: Preview avatar */}
      <div className="flex flex-1 items-center justify-center">
        <motion.div
          className="flex h-16 w-16 items-center justify-center rounded-full border-2 bg-dark-900/80"
          style={{
            borderColor: theme.accentPrimary,
            boxShadow: theme.glowEnabled ? `0 0 20px ${theme.accentPrimary}60` : undefined,
          }}
          animate={
            theme.glowEnabled
              ? {
                  boxShadow: [
                    `0 0 10px ${theme.accentPrimary}40`,
                    `0 0 25px ${theme.accentPrimary}60`,
                    `0 0 10px ${theme.accentPrimary}40`,
                  ],
                }
              : {}
          }
          transition={loop(tweens.ambient)}
        >
          <span className="text-2xl">👤</span>
        </motion.div>
      </div>

      {/* Bottom: Theme name and description */}
      <div className="rounded-lg bg-black/40 p-2 backdrop-blur-sm">
        <h3 className="truncate text-sm font-bold" style={{ color: theme.textColor }}>
          {theme.name}
        </h3>
        <p className="truncate text-[10px] opacity-70" style={{ color: theme.textColor }}>
          {theme.description}
        </p>
      </div>
    </>
  );
}
