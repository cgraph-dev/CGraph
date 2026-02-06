import { useThemeStore } from '@/stores/theme';
import { BUBBLE_STYLES } from './constants';

export function ChatTab() {
  const { theme, setChatBubbleStyle, updateTheme } = useThemeStore();

  return (
    <div className="space-y-6">
      {/* Bubble Style */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <h3 className="mb-4 text-lg font-semibold">Bubble Style</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {BUBBLE_STYLES.map((style) => (
            <button
              key={style.type}
              onClick={() => setChatBubbleStyle(style.type)}
              className={`rounded-lg border p-3 transition-all ${
                theme.chatBubbleStyle === style.type
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-gray-700 bg-gray-800/50 hover:bg-gray-800'
              }`}
            >
              {style.name}
            </button>
          ))}
        </div>
      </div>

      {/* Border Radius */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <h3 className="mb-4 text-lg font-semibold">Border Radius: {theme.bubbleBorderRadius}px</h3>
        <input
          type="range"
          min="0"
          max="50"
          value={theme.bubbleBorderRadius}
          onChange={(e) => updateTheme({ bubbleBorderRadius: parseInt(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Shadow Intensity */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <h3 className="mb-4 text-lg font-semibold">
          Shadow Intensity: {theme.bubbleShadowIntensity}%
        </h3>
        <input
          type="range"
          min="0"
          max="100"
          value={theme.bubbleShadowIntensity}
          onChange={(e) => updateTheme({ bubbleShadowIntensity: parseInt(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Options */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <h3 className="mb-4 text-lg font-semibold">Options</h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3">
            <span>Show Tail</span>
            <input
              type="checkbox"
              checked={theme.bubbleShowTail ?? true}
              onChange={(e) => updateTheme({ bubbleShowTail: e.target.checked })}
              className="h-5 w-5"
            />
          </label>
          <label className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3">
            <span>Glass Effect</span>
            <input
              type="checkbox"
              checked={theme.bubbleGlassEffect}
              onChange={(e) => updateTheme({ bubbleGlassEffect: e.target.checked })}
              className="h-5 w-5"
            />
          </label>
          <label className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3">
            <span>Hover Effect</span>
            <input
              type="checkbox"
              checked={theme.bubbleHoverEffect ?? true}
              onChange={(e) => updateTheme({ bubbleHoverEffect: e.target.checked })}
              className="h-5 w-5"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
