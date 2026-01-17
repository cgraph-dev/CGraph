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
} from './DeviceProfiler';

export type {
  DeviceTier,
  DeviceCapabilities,
  PerformanceRecommendations,
} from './DeviceProfiler';

// ============================================================================
// Default Export
// ============================================================================

const Performance = {
  DeviceProfiler: require('./DeviceProfiler').default,
};

export default Performance;
