/**
 * Enhanced Components Demo Page
 * 
 * Showcases all v2.0 enhanced components in one place
 * for testing and demonstration purposes.
 * 
 * @version 2.0.0
 * @since v0.7.33
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';

// Import all enhanced components
import GlassCard, { GlassCardNeon, GlassCardHolographic, GlassCardCrystal } from '@/components/ui/GlassCard';
import { AnimatedMessageWrapper } from '@/components/conversation/AnimatedMessageWrapper';
import { AnimatedReactionBubble, ReactionPicker } from '@/components/conversation/AnimatedReactionBubble';
import Matrix3DEnvironment from '@/components/three/Matrix3DEnvironment';
import ShaderBackground from '@/components/shaders/ShaderBackground';
import AdvancedVoiceVisualizer from '@/components/audio/AdvancedVoiceVisualizer';
import { themeEngine } from '@/lib/ai/ThemeEngine';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';

// Demo sections
type DemoSection = 'glasscards' | 'messages' | 'reactions' | 'matrix3d' | 'shaders' | 'voice' | 'theme';

export default function EnhancedDemo() {
  const [activeSection, setActiveSection] = useState<DemoSection>('glasscards');
  const [showBackground, setShowBackground] = useState(true);
  const [backgroundType, setBackgroundType] = useState<'matrix3d' | 'shader'>('shader');
  const [shaderVariant, setShaderVariant] = useState<'fluid' | 'particles' | 'waves' | 'neural' | 'matrix'>('matrix');
  const [matrixTheme, setMatrixTheme] = useState<'matrix-green' | 'cyber-blue' | 'purple-haze' | 'amber-glow'>('matrix-green');

  const sections: { id: DemoSection; label: string }[] = [
    { id: 'glasscards', label: '🃏 Glass Cards' },
    { id: 'messages', label: '💬 Messages' },
    { id: 'reactions', label: '🎉 Reactions' },
    { id: 'matrix3d', label: '🌐 Matrix 3D' },
    { id: 'shaders', label: '🎨 Shaders' },
    { id: 'voice', label: '🎤 Voice' },
    { id: 'theme', label: '🎭 AI Theme' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Dynamic Background */}
      {showBackground && backgroundType === 'shader' && (
        <ShaderBackground
          variant={shaderVariant}
          color1="#00ff41"
          color2="#003b00"
          color3="#39ff14"
          speed={0.8}
          intensity={0.6}
          interactive
        />
      )}
      {showBackground && backgroundType === 'matrix3d' && (
        <Matrix3DEnvironment
          theme={matrixTheme}
          intensity="medium"
          interactive
        />
      )}

      {/* Fallback dark background */}
      {!showBackground && (
        <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 -z-10" />
      )}

      {/* Header */}
      <header className="relative z-20 p-6 border-b border-white/10 backdrop-blur-md bg-black/30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              ✨ Enhanced Components v2.0
            </h1>
            <p className="text-gray-400 mt-1">Interactive demo of all new v0.7.33 components</p>
          </div>
          <Link 
            to="/login" 
            className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors"
          >
            ← Back to App
          </Link>
        </div>
      </header>

      {/* Background Controls */}
      <div className="relative z-20 p-4 border-b border-white/10 backdrop-blur-md bg-black/20">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-white">
            <input
              type="checkbox"
              checked={showBackground}
              onChange={(e) => setShowBackground(e.target.checked)}
              className="rounded"
            />
            Show Background
          </label>

          {showBackground && (
            <>
              <select
                value={backgroundType}
                onChange={(e) => setBackgroundType(e.target.value as 'matrix3d' | 'shader')}
                className="px-3 py-1.5 bg-black/50 border border-white/20 rounded text-white"
              >
                <option value="shader">WebGL Shader</option>
                <option value="matrix3d">Matrix 3D</option>
              </select>

              {backgroundType === 'shader' && (
                <select
                  value={shaderVariant}
                  onChange={(e) => setShaderVariant(e.target.value as typeof shaderVariant)}
                  className="px-3 py-1.5 bg-black/50 border border-white/20 rounded text-white"
                >
                  <option value="matrix">Matrix</option>
                  <option value="fluid">Fluid</option>
                  <option value="particles">Particles</option>
                  <option value="waves">Waves</option>
                  <option value="neural">Neural</option>
                </select>
              )}

              {backgroundType === 'matrix3d' && (
                <select
                  value={matrixTheme}
                  onChange={(e) => setMatrixTheme(e.target.value as typeof matrixTheme)}
                  className="px-3 py-1.5 bg-black/50 border border-white/20 rounded text-white"
                >
                  <option value="matrix-green">Matrix Green</option>
                  <option value="cyber-blue">Cyber Blue</option>
                  <option value="purple-haze">Purple Haze</option>
                  <option value="amber-glow">Amber Glow</option>
                </select>
              )}
            </>
          )}
        </div>
      </div>

      {/* Section Navigation */}
      <nav className="relative z-20 p-4 border-b border-white/10 backdrop-blur-md bg-black/20">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => {
                setActiveSection(section.id);
                HapticFeedback.light();
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeSection === section.id
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto">
          {activeSection === 'glasscards' && <GlassCardsDemo />}
          {activeSection === 'messages' && <MessagesDemo />}
          {activeSection === 'reactions' && <ReactionsDemo />}
          {activeSection === 'matrix3d' && <Matrix3DDemo />}
          {activeSection === 'shaders' && <ShadersDemo />}
          {activeSection === 'voice' && <VoiceDemo />}
          {activeSection === 'theme' && <ThemeDemo />}
        </div>
      </main>
    </div>
  );
}

// =============================================================================
// DEMO SECTIONS
// =============================================================================

function GlassCardsDemo() {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-white mb-6">Glass Card Variants</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlassCard variant="default" hover3D glow>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white">Default</h3>
            <p className="text-gray-400 mt-2">Standard glass effect with subtle blur</p>
          </div>
        </GlassCard>

        <GlassCard variant="frosted" hover3D shimmer>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white">Frosted</h3>
            <p className="text-gray-400 mt-2">Heavy blur with shimmer effect</p>
          </div>
        </GlassCard>

        <GlassCardCrystal hover3D glow borderGradient>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-emerald-400">Crystal</h3>
            <p className="text-gray-400 mt-2">Emerald-tinted crystal glass</p>
          </div>
        </GlassCardCrystal>

        <GlassCardNeon hover3D glow particles>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-pink-400">Neon</h3>
            <p className="text-gray-400 mt-2">Vibrant neon with particles</p>
          </div>
        </GlassCardNeon>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <GlassCardHolographic hover3D shimmer borderGradient className="col-span-1">
          <div className="p-8">
            <h3 className="text-xl font-semibold text-white">Holographic</h3>
            <p className="text-gray-400 mt-2">
              Multi-color gradient with holographic shimmer effect.
              Move your mouse over the card to see the 3D tilt effect.
            </p>
          </div>
        </GlassCardHolographic>

        <GlassCard 
          variant="crystal" 
          hover3D 
          glow 
          glowColor="rgba(139, 92, 246, 0.5)"
          shimmer
        >
          <div className="p-8">
            <h3 className="text-xl font-semibold text-violet-400">Custom Glow</h3>
            <p className="text-gray-400 mt-2">
              Cards can have custom glow colors. This one uses violet.
              Combine with shimmer for extra sparkle.
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function MessagesDemo() {
  const [messages] = useState([
    { id: '1', text: 'Hey! Check out these new animations 🚀', isOwn: false },
    { id: '2', text: 'Wow, these look amazing! The spring physics feel so smooth', isOwn: true },
    { id: '3', text: 'Try swiping on a message to reply!', isOwn: false },
    { id: '4', text: 'And long press for more options 👀', isOwn: true },
  ]);

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-white mb-6">Animated Messages</h2>
      <p className="text-gray-400 mb-4">Messages with spring physics, swipe gestures, and particle effects</p>

      <GlassCard variant="frosted" className="max-w-lg mx-auto">
        <div className="p-4 space-y-3">
          {messages.map((msg, index) => (
            <AnimatedMessageWrapper
              key={msg.id}
              isOwnMessage={msg.isOwn}
              index={index}
              isNew={index >= 2}
              messageId={msg.id}
              onSwipeReply={() => console.log('Reply to:', msg.id)}
              onLongPress={() => console.log('Long press:', msg.id)}
              enableGestures
            >
              <div
                className={`max-w-[80%] p-3 rounded-2xl ${
                  msg.isOwn
                    ? 'bg-primary-600 text-white ml-auto'
                    : 'bg-gray-700 text-white'
                }`}
              >
                {msg.text}
              </div>
            </AnimatedMessageWrapper>
          ))}
        </div>
      </GlassCard>

      <p className="text-center text-gray-500 text-sm">
        💡 Drag left/right to swipe • Long press for context menu
      </p>
    </div>
  );
}

function ReactionsDemo() {
  const [reactions, setReactions] = useState([
    { emoji: '👍', count: 12, hasReacted: false },
    { emoji: '❤️', count: 8, hasReacted: true },
    { emoji: '😂', count: 5, hasReacted: false },
    { emoji: '🔥', count: 3, hasReacted: false },
  ]);
  const [showPicker, setShowPicker] = useState(false);

  const handleReact = (emoji: string) => {
    setReactions(prev => {
      const existing = prev.find(r => r.emoji === emoji);
      if (existing) {
        return prev.map(r => 
          r.emoji === emoji 
            ? { ...r, count: r.hasReacted ? r.count - 1 : r.count + 1, hasReacted: !r.hasReacted }
            : r
        );
      }
      return [...prev, { emoji, count: 1, hasReacted: true }];
    });
    setShowPicker(false);
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-white mb-6">Reaction System</h2>
      <p className="text-gray-400 mb-4">Animated reactions with spring physics and particle effects</p>

      <GlassCard variant="frosted" className="max-w-lg mx-auto p-6">
        <div className="bg-gray-700 rounded-2xl p-4 mb-4">
          <p className="text-white">This message has reactions! Click to toggle them.</p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {reactions.map((reaction) => (
            <AnimatedReactionBubble
              key={reaction.emoji}
              reaction={reaction}
              isOwnMessage={false}
              onPress={() => handleReact(reaction.emoji)}
            />
          ))}
          
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="w-8 h-8 rounded-full bg-gray-600 hover:bg-gray-500 flex items-center justify-center text-gray-300 hover:text-white transition-colors"
          >
            +
          </button>
        </div>

        {showPicker && (
          <div className="mt-4">
            <ReactionPicker
              onSelect={handleReact}
              onClose={() => setShowPicker(false)}
            />
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function Matrix3DDemo() {
  const [theme, setTheme] = useState<'matrix-green' | 'cyber-blue' | 'purple-haze' | 'amber-glow'>('matrix-green');
  const [intensity, setIntensity] = useState<'low' | 'medium' | 'high'>('medium');

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-white mb-6">Matrix 3D Environment</h2>
      <p className="text-gray-400 mb-4">
        Immersive Three.js environment with post-processing effects
      </p>

      <div className="flex flex-wrap gap-4 mb-6">
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value as typeof theme)}
          className="px-4 py-2 bg-black/50 border border-white/20 rounded-lg text-white"
        >
          <option value="matrix-green">Matrix Green</option>
          <option value="cyber-blue">Cyber Blue</option>
          <option value="purple-haze">Purple Haze</option>
          <option value="amber-glow">Amber Glow</option>
        </select>

        <select
          value={intensity}
          onChange={(e) => setIntensity(e.target.value as typeof intensity)}
          className="px-4 py-2 bg-black/50 border border-white/20 rounded-lg text-white"
        >
          <option value="low">Low (50 columns)</option>
          <option value="medium">Medium (100 columns)</option>
          <option value="high">High (200 columns)</option>
        </select>
      </div>

      <div className="relative h-[400px] rounded-2xl overflow-hidden border border-white/10">
        <Matrix3DEnvironment
          theme={theme}
          intensity={intensity}
          interactive
          className="!relative !z-0"
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <GlassCard variant="frosted" className="pointer-events-auto">
            <div className="p-6 text-center">
              <h3 className="text-xl font-bold text-white">Embedded Content</h3>
              <p className="text-gray-400 mt-2">UI overlays the 3D scene</p>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function ShadersDemo() {
  const [variant, setVariant] = useState<'fluid' | 'particles' | 'waves' | 'neural' | 'matrix'>('fluid');

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-white mb-6">WebGL Shader Backgrounds</h2>
      <p className="text-gray-400 mb-4">
        High-performance animated backgrounds using custom GLSL shaders
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {(['fluid', 'particles', 'waves', 'neural', 'matrix'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setVariant(v)}
            className={`px-4 py-2 rounded-lg capitalize ${
              variant === v
                ? 'bg-primary-600 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      <div className="relative h-[400px] rounded-2xl overflow-hidden border border-white/10">
        <ShaderBackground
          variant={variant}
          color1="#00ff41"
          color2="#003b00"
          color3="#39ff14"
          speed={1}
          intensity={1}
          interactive
          className="!relative"
        />
      </div>
    </div>
  );
}

function VoiceDemo() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [variant, setVariant] = useState<'waveform' | 'spectrum' | 'circular' | 'particles'>('spectrum');

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-white mb-6">Voice Visualizer</h2>
      <p className="text-gray-400 mb-4">
        Audio visualization using Web Audio API and Canvas
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {(['waveform', 'spectrum', 'circular', 'particles'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setVariant(v)}
            className={`px-4 py-2 rounded-lg capitalize ${
              variant === v
                ? 'bg-primary-600 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      <GlassCard variant="frosted" className="p-6">
        <div className="text-center mb-4">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-6 py-3 rounded-full font-medium transition-all ${
              isPlaying
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-primary-600 hover:bg-primary-500 text-white'
            }`}
          >
            {isPlaying ? '⏹ Stop' : '🎤 Start Microphone'}
          </button>
        </div>

        <div className="h-[200px] bg-black/50 rounded-lg overflow-hidden">
          <AdvancedVoiceVisualizer
            variant={variant}
            theme="matrix-green"
            height={200}
            isPlaying={isPlaying}
          />
        </div>

        <p className="text-center text-gray-500 text-sm mt-4">
          Note: Requires microphone permission when started
        </p>
      </GlassCard>
    </div>
  );
}

function ThemeDemo() {
  const [generatedTheme, setGeneratedTheme] = useState<ReturnType<typeof themeEngine.getRecommendedTheme> | null>(null);

  const generateTheme = () => {
    const theme = themeEngine.getRecommendedTheme();
    setGeneratedTheme(theme);
    themeEngine.applyTheme(theme);
    HapticFeedback.medium();
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-white mb-6">AI Theme Engine</h2>
      <p className="text-gray-400 mb-4">
        Generates adaptive color themes based on time, user preferences, and activity
      </p>

      <div className="flex gap-4 mb-6">
        <button
          onClick={generateTheme}
          className="px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-medium transition-colors"
        >
          🎨 Generate Theme
        </button>
      </div>

      {generatedTheme && (
        <GlassCard variant="frosted" className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Generated Theme</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(generatedTheme.colors).slice(0, 8).map(([name, color]) => (
              <div key={name} className="text-center">
                <div
                  className="w-full h-16 rounded-lg mb-2 border border-white/10"
                  style={{ background: color as string }}
                />
                <p className="text-xs text-gray-400 capitalize">{name}</p>
                <p className="text-xs text-gray-500 font-mono">{color as string}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-black/30 rounded-lg">
            <p className="text-sm text-gray-400">
              <strong>Mood:</strong> {generatedTheme.metadata.mood}
            </p>
            <p className="text-sm text-gray-400">
              <strong>Name:</strong> {generatedTheme.metadata.name}
            </p>
            <p className="text-sm text-gray-400">
              <strong>Contrast Ratio:</strong> {generatedTheme.metadata.contrastRatio.toFixed(2)}
            </p>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
