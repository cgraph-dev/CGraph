/**
 * Calls Module Components
 *
 * Re-exports voice/video call components from centralized location.
 * Import from '@/modules/calls/components' for module-based organization.
 *
 * @module @modules/calls/components
 */

// Re-export all voice/video call components from legacy location
export { default as IncomingCallHandler } from '@/components/voice/IncomingCallHandler';
export { default as IncomingCallModal } from '@/components/voice/IncomingCallModal';
export { VideoCallModal } from '@/components/voice/VideoCallModal';
export { VoiceCallModal } from '@/components/voice/VoiceCallModal';
