import { useThemeStore } from '@/stores/theme';
import { AVATAR_BORDERS, AVATAR_SIZE_LABELS } from './constants';
import type { AvatarSizeOption } from './types';

export function AvatarTab() {
  const { theme, setAvatarBorder, updateTheme } = useThemeStore();

  return (
    <div className="space-y-6">
      {/* Border Style */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <h3 className="mb-4 text-lg font-semibold">Border Style</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {AVATAR_BORDERS.map((border) => (
            <button
              key={border.type}
              onClick={() => setAvatarBorder(border.type)}
              className={`rounded-lg border p-3 transition-all ${
                theme.avatarBorder === border.type
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-gray-700 bg-gray-800/50 hover:bg-gray-800'
              }`}
            >
              <div className="text-sm font-medium">{border.name}</div>
              {border.premium && <span className="text-xs text-yellow-400">👑 Premium</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Avatar Size */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <h3 className="mb-4 text-lg font-semibold">Avatar Size</h3>
        <div className="flex gap-3">
          {(['sm', 'md', 'lg'] as const).map((size: AvatarSizeOption) => (
            <button
              key={size}
              onClick={() => updateTheme({ avatarSize: size })}
              className={`rounded-lg border px-4 py-2 capitalize transition-all ${
                theme.avatarSize === size
                  ? 'border-emerald-500 bg-emerald-500/10 text-white'
                  : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:bg-gray-800'
              }`}
            >
              {AVATAR_SIZE_LABELS[size]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
