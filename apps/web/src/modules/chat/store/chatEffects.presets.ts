/**
 * Chat Effects Presets & Constants
 *
 * All preset configurations, sound library, and list data for the chat effects system.
 */

import type {
  MessageEffect,
  MessageEffectConfig,
  BubbleStyle,
  BubbleStyleConfig,
  TypingIndicator,
  TypingIndicatorConfig,
  ChatSoundEffect,
  MessageEffectItem,
  BubbleStyleItem,
  TypingIndicatorItem,
} from './chatEffects.types';

// ==================== EFFECT PRESETS ====================

export const MESSAGE_EFFECT_PRESETS: Record<MessageEffect, Omit<MessageEffectConfig, 'effect'>> = {
  none: { intensity: 'low', duration: 0 },
  confetti: { intensity: 'high', duration: 3000, particleCount: 50 },
  fireworks: { intensity: 'high', duration: 2500, particleCount: 30 },
  sparkle: { intensity: 'medium', duration: 1500, particleCount: 20, color: '#ffd700' },
  rainbow: { intensity: 'medium', duration: 2000 },
  hearts: { intensity: 'medium', duration: 2000, particleCount: 15, color: '#ff69b4' },
  stars: { intensity: 'medium', duration: 1800, particleCount: 25, color: '#ffff00' },
  snow: { intensity: 'low', duration: 4000, particleCount: 40 },
  fire: { intensity: 'high', duration: 2000, particleCount: 35, color: '#ff4500' },
  electric: { intensity: 'high', duration: 1500, particleCount: 20, color: '#00ffff' },
  glitch: { intensity: 'high', duration: 1000 },
  matrix: { intensity: 'medium', duration: 3000, color: '#00ff00' },
  bubble: { intensity: 'low', duration: 2500, particleCount: 10 },
  shake: { intensity: 'medium', duration: 500 },
  bounce: { intensity: 'low', duration: 800 },
  'fade-in': { intensity: 'low', duration: 400 },
  'slide-in': { intensity: 'low', duration: 300 },
  zoom: { intensity: 'medium', duration: 400 },
  flip: { intensity: 'medium', duration: 600 },
  typewriter: { intensity: 'low', duration: 1500 },
  'neon-glow': { intensity: 'medium', duration: 2000, color: '#ff00ff' },
  holographic: { intensity: 'high', duration: 3000 },
  plasma: { intensity: 'high', duration: 2500, color: '#9400d3' },
  aurora: { intensity: 'medium', duration: 4000 },
  cosmic: { intensity: 'high', duration: 3500, particleCount: 30 },
  sakura: { intensity: 'low', duration: 5000, particleCount: 25, color: '#ffb7c5' },
  rain: { intensity: 'low', duration: 4000, particleCount: 50 },
  thunder: { intensity: 'high', duration: 1000, sound: true },
  explosion: { intensity: 'high', duration: 1500, particleCount: 60, sound: true },
  portal: { intensity: 'high', duration: 2000, color: '#7c3aed' },
};

export const BUBBLE_STYLE_PRESETS: Record<BubbleStyle, Omit<BubbleStyleConfig, 'style'>> = {
  default: {
    backgroundColor: '#1a1a2e',
    textColor: '#ffffff',
    borderRadius: '1rem',
  },
  rounded: {
    backgroundColor: '#2d2d44',
    textColor: '#ffffff',
    borderRadius: '2rem',
  },
  square: {
    backgroundColor: '#1a1a2e',
    textColor: '#ffffff',
    borderRadius: '0.25rem',
  },
  cloud: {
    backgroundColor: '#3d3d5c',
    textColor: '#ffffff',
    borderRadius: '1.5rem 1.5rem 1.5rem 0.25rem',
  },
  thought: {
    backgroundColor: '#2a2a40',
    textColor: '#ffffff',
    borderRadius: '2rem',
    borderColor: '#4a4a6a',
    borderWidth: 2,
  },
  comic: {
    backgroundColor: '#ffff00',
    textColor: '#000000',
    borderColor: '#000000',
    borderWidth: 3,
    borderRadius: '0.5rem',
  },
  neon: {
    backgroundColor: 'transparent',
    textColor: '#00ff00',
    borderColor: '#00ff00',
    borderWidth: 2,
    borderRadius: '1rem',
    glow: { color: '#00ff00', blur: 10 },
  },
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    textColor: '#ffffff',
    borderRadius: '1rem',
    shadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  },
  gradient: {
    backgroundColor: 'transparent',
    textColor: '#ffffff',
    borderRadius: '1rem',
    gradient: { from: '#667eea', to: '#764ba2', angle: 135 },
  },
  outlined: {
    backgroundColor: 'transparent',
    textColor: '#22c55e',
    borderColor: '#22c55e',
    borderWidth: 2,
    borderRadius: '1rem',
  },
  shadowed: {
    backgroundColor: '#1a1a2e',
    textColor: '#ffffff',
    borderRadius: '1rem',
    shadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
  },
  retro: {
    backgroundColor: '#2d1b69',
    textColor: '#ff6ad5',
    borderRadius: '0',
    borderColor: '#ff6ad5',
    borderWidth: 4,
  },
  pixel: {
    backgroundColor: '#222222',
    textColor: '#00ff00',
    borderRadius: '0',
    borderColor: '#00ff00',
    borderWidth: 2,
  },
  futuristic: {
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    textColor: '#00ffff',
    borderRadius: '0 1rem 0 1rem',
    borderColor: '#00ffff',
    borderWidth: 1,
    glow: { color: '#00ffff', blur: 8 },
  },
  organic: {
    backgroundColor: '#2d4a3e',
    textColor: '#90ee90',
    borderRadius: '40% 60% 60% 40% / 60% 40% 60% 40%',
  },
};

export const TYPING_INDICATOR_PRESETS: Record<
  TypingIndicator,
  Omit<TypingIndicatorConfig, 'style'>
> = {
  dots: { color: '#888888', speed: 'normal', size: 'md' },
  wave: { color: '#22c55e', speed: 'normal', size: 'md' },
  bounce: { color: '#3b82f6', speed: 'fast', size: 'sm' },
  pulse: { color: '#8b5cf6', speed: 'slow', size: 'md' },
  'typing-text': { color: '#ffffff', speed: 'normal', size: 'sm' },
  pencil: { color: '#f59e0b', speed: 'normal', size: 'md' },
  'speech-bubble': { color: '#ffffff', speed: 'normal', size: 'lg' },
  custom: { color: '#22c55e', speed: 'normal', size: 'md' },
};

export const SOUND_EFFECT_LIBRARY: ChatSoundEffect[] = [
  { id: 'message-sent', name: 'Message Sent', url: '/sounds/send.mp3', volume: 0.5, enabled: true },
  {
    id: 'message-received',
    name: 'Message Received',
    url: '/sounds/receive.mp3',
    volume: 0.5,
    enabled: true,
  },
  {
    id: 'notification',
    name: 'Notification',
    url: '/sounds/notification.mp3',
    volume: 0.7,
    enabled: true,
  },
  { id: 'mention', name: 'Mention', url: '/sounds/mention.mp3', volume: 0.8, enabled: true },
  { id: 'typing', name: 'Typing', url: '/sounds/typing.mp3', volume: 0.3, enabled: false },
  { id: 'reaction', name: 'Reaction', url: '/sounds/pop.mp3', volume: 0.4, enabled: true },
  { id: 'join', name: 'User Join', url: '/sounds/join.mp3', volume: 0.5, enabled: true },
  { id: 'leave', name: 'User Leave', url: '/sounds/leave.mp3', volume: 0.4, enabled: true },
  { id: 'call-ring', name: 'Call Ring', url: '/sounds/ring.mp3', volume: 0.8, enabled: true },
  { id: 'call-end', name: 'Call End', url: '/sounds/end-call.mp3', volume: 0.6, enabled: true },
];

// ==================== LIST DATA ====================

export const MESSAGE_EFFECTS_LIST: MessageEffectItem[] = [
  { id: 'none', name: 'None', icon: '🚫', description: 'No effect' },
  { id: 'confetti', name: 'Confetti', icon: '🎊', description: 'Celebration confetti' },
  { id: 'fireworks', name: 'Fireworks', icon: '🎆', description: 'Explosive fireworks' },
  { id: 'sparkle', name: 'Sparkle', icon: '✨', description: 'Magical sparkles' },
  { id: 'rainbow', name: 'Rainbow', icon: '🌈', description: 'Rainbow trail' },
  { id: 'hearts', name: 'Hearts', icon: '💕', description: 'Floating hearts' },
  { id: 'stars', name: 'Stars', icon: '⭐', description: 'Star burst' },
  { id: 'snow', name: 'Snow', icon: '❄️', description: 'Falling snowflakes' },
  { id: 'fire', name: 'Fire', icon: '🔥', description: 'Burning flames' },
  { id: 'electric', name: 'Electric', icon: '⚡', description: 'Electric sparks' },
  { id: 'glitch', name: 'Glitch', icon: '📺', description: 'Digital glitch' },
  { id: 'matrix', name: 'Matrix', icon: '💚', description: 'Matrix code rain' },
  { id: 'bubble', name: 'Bubble', icon: '🫧', description: 'Rising bubbles' },
  { id: 'fade-in', name: 'Fade In', icon: '👻', description: 'Smooth fade' },
  { id: 'neon-glow', name: 'Neon Glow', icon: '💡', description: 'Neon lighting' },
];

export const BUBBLE_STYLES_LIST: BubbleStyleItem[] = [
  { id: 'default', name: 'Default', borderRadius: 16 },
  { id: 'rounded', name: 'Rounded', borderRadius: 32 },
  { id: 'square', name: 'Square', borderRadius: 4 },
  { id: 'cloud', name: 'Cloud', borderRadius: '24px 24px 24px 4px' },
  { id: 'neon', name: 'Neon', borderRadius: 16, glowColor: '#00ff00' },
  { id: 'glass', name: 'Glass', borderRadius: 16, gradient: 'rgba(255,255,255,0.1)' },
  {
    id: 'gradient',
    name: 'Gradient',
    borderRadius: 16,
    gradient: 'linear-gradient(135deg, #667eea, #764ba2)',
  },
  { id: 'comic', name: 'Comic', borderRadius: 8 },
  { id: 'retro', name: 'Retro', borderRadius: 0 },
  { id: 'futuristic', name: 'Futuristic', borderRadius: '0 16px 0 16px', glowColor: '#00ffff' },
];

export const TYPING_INDICATORS_LIST: TypingIndicatorItem[] = [
  { id: 'dots', name: 'Bouncing Dots' },
  { id: 'wave', name: 'Wave Animation' },
  { id: 'bounce', name: 'Bounce' },
  { id: 'pulse', name: 'Pulse' },
  { id: 'typing-text', name: 'Typing Text' },
  { id: 'pencil', name: 'Pencil Icon' },
  { id: 'speech-bubble', name: 'Speech Bubble' },
];
