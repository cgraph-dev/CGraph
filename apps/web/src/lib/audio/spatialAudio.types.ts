/**
 * Spatial Audio Type Definitions
 *
 * All interfaces and type definitions used across the spatial audio system.
 *
 * @version 3.0.0
 * @since v0.7.35
 */

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface Orientation3D {
  yaw: number; // Rotation around Y axis (left/right)
  pitch: number; // Rotation around X axis (up/down)
  roll: number; // Rotation around Z axis (tilt)
}

export interface AudioSource {
  id: string;
  userId?: string;
  position: Position3D;
  orientation?: Orientation3D;
  stream?: MediaStream;
  gainNode?: GainNode;
  pannerNode?: PannerNode;
  volume: number;
  muted: boolean;
  spatialEnabled: boolean;
}

export interface AudioZone {
  id: string;
  name: string;
  position: Position3D;
  radius: number;
  shape: 'sphere' | 'cube' | 'cylinder';
  reverb: ReverbConfig;
  occlusion: number; // 0-1, how much sound is blocked
  gainModifier: number; // Volume multiplier in zone
}

export interface ReverbConfig {
  enabled: boolean;
  type: 'room' | 'hall' | 'cathedral' | 'cave' | 'outdoor';
  decay: number; // 0.1-20 seconds
  wetDry: number; // 0-1, mix of reverb vs dry
  preDelay: number; // ms before reverb starts
}

export interface VoiceActivityState {
  isSpeaking: boolean;
  confidence: number;
  volume: number;
  frequency: number;
}

export interface SpatialAudioConfig {
  enabled: boolean;
  hrtfEnabled: boolean;
  maxDistance: number;
  rolloffFactor: number;
  distanceModel: 'linear' | 'inverse' | 'exponential';
  coneInnerAngle: number;
  coneOuterAngle: number;
  coneOuterGain: number;
  enableVAD: boolean;
  enableNoiseCancellation: boolean;
  enableAutoGainControl: boolean;
  enableEchoCancellation: boolean;
}

export interface AudioAnalysisResult {
  rms: number;
  peak: number;
  frequency: Float32Array;
  waveform: Float32Array;
  voiceActivity: VoiceActivityState;
}
