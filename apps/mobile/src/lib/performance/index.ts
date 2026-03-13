/**
 * Performance Library
 *
 * Device profiling, optimization, and resource management.
 */

// ============================================================================
// Device Profiler
// ============================================================================

export {
  deviceProfiler,
  useDeviceCapabilities,
  usePerformanceRecommendations,
  default as DeviceProfiler,
} from './device-profiler';

export type { DeviceTier, DeviceCapabilities, PerformanceRecommendations } from './device-profiler';

// ============================================================================
// Default Export
// ============================================================================

const Performance = {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  DeviceProfiler: require('./device-profiler').default,
};

export default Performance;
