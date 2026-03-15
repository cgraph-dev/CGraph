/**
 * DeviceProfiler - Device Capability Detection & Performance Profiling
 *
 * Features:
 * - Device tier detection (high, mid, low)
 * - CPU/GPU capability estimation
 * - RAM detection
 * - Platform version checks
 * - Feature availability detection
 * - Performance recommendations
 */

import { Platform, Dimensions, PixelRatio } from 'react-native';
import * as Device from 'expo-device';

// ============================================================================
// Types
// ============================================================================

export type DeviceTier = 'high' | 'mid' | 'low';

export interface DeviceCapabilities {
  tier: DeviceTier;
  platform: 'ios' | 'android' | 'web' | 'unknown';
  platformVersion: number;
  deviceModel: string | null;
  deviceBrand: string | null;
  isDevice: boolean;
  isEmulator: boolean;

  // Screen
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  fontScale: number;

  // Estimated specs
  estimatedRam: 'low' | 'medium' | 'high';
  estimatedGpu: 'low' | 'medium' | 'high';

  // Feature support
  supportsNativeBlur: boolean;
  supportsHaptics: boolean;
  supportsHighRefreshRate: boolean;
  supportsAdvancedAnimations: boolean;
  supportsParticles: boolean;
  supportsShaders: boolean;

  // Recommendations
  maxParticleCount: number;
  maxConcurrentAnimations: number;
  recommendedAnimationFPS: number;
  shouldReduceMotion: boolean;
  shouldUseLightEffects: boolean;
}

export interface PerformanceRecommendations {
  enableParticles: boolean;
  particleCount: number;
  enableBlur: boolean;
  blurQuality: 'low' | 'medium' | 'high';
  enableGlow: boolean;
  enableShadows: boolean;
  shadowQuality: 'low' | 'medium' | 'high';
  enableAnimations: boolean;
  animationQuality: 'low' | 'medium' | 'high';
  enableHaptics: boolean;
  enableScanlines: boolean;
  enableGradientAnimations: boolean;
}

// ============================================================================
// Constants
// ============================================================================

// Known high-end device patterns
const HIGH_END_PATTERNS = {
  ios: ['iPhone14', 'iPhone15', 'iPhone16', 'iPad Pro', 'iPad Air (5th', 'iPad Air (4th'],
  android: [
    'SM-S9',
    'SM-S8',
    'SM-S7', // Samsung S series
    'SM-N9',
    'SM-N8', // Samsung Note
    'SM-F9',
    'SM-F7', // Samsung Fold/Flip
    'Pixel 8',
    'Pixel 7',
    'Pixel 6',
    'OnePlus 11',
    'OnePlus 10',
    'OnePlus 9',
  ],
};

const MID_RANGE_PATTERNS = {
  ios: ['iPhone12', 'iPhone13', 'iPhoneX', 'iPhone11', 'iPad (9th', 'iPad (8th', 'iPad mini'],
  android: [
    'SM-A5',
    'SM-A7',
    'SM-M', // Samsung A/M series
    'Pixel 5',
    'Pixel 4',
    'OnePlus Nord',
    'OnePlus 8',
    'OnePlus 7',
  ],
};

// ============================================================================
// Device Profiler Class
// ============================================================================

class DeviceProfiler {
  private capabilities: DeviceCapabilities | null = null;
  private recommendations: PerformanceRecommendations | null = null;

  /**
   * Initialize and profile the device
   */
  async initialize(): Promise<DeviceCapabilities> {
    if (this.capabilities) {
      return this.capabilities;
    }

    const { width, height } = Dimensions.get('window');
    const pixelRatio = PixelRatio.get();
    const fontScale = PixelRatio.getFontScale();

    const platformVersion = this.getPlatformVersion();
    const deviceModel = Device.modelName;
    const deviceBrand = Device.brand;
    const isDevice = Device.isDevice;

    // Determine device tier
    const tier = this.determineDeviceTier(deviceModel, platformVersion);

    // Estimate hardware capabilities
    const estimatedRam = this.estimateRam(tier, deviceModel);
    const estimatedGpu = this.estimateGpu(tier, platformVersion);

    // Check feature support
    const supportsNativeBlur = this.checkNativeBlurSupport(platformVersion);
    const supportsHaptics = this.checkHapticsSupport();
    const supportsHighRefreshRate = this.checkHighRefreshRateSupport(deviceModel);
    const supportsAdvancedAnimations = tier !== 'low';
    const supportsParticles = tier !== 'low' || (tier === 'low' && estimatedGpu !== 'low');
    const supportsShaders = Platform.OS === 'ios' || platformVersion >= 12;

    // Calculate limits based on tier
    const { maxParticleCount, maxConcurrentAnimations, recommendedAnimationFPS } =
      this.calculateLimits(tier, estimatedRam, estimatedGpu);

    this.capabilities = {
      tier,

       
      platform: Platform.OS as 'ios' | 'android' | 'web' | 'unknown',
      platformVersion,
      deviceModel,
      deviceBrand,
      isDevice,
      isEmulator: !isDevice,

      screenWidth: width,
      screenHeight: height,
      pixelRatio,
      fontScale,

      estimatedRam,
      estimatedGpu,

      supportsNativeBlur,
      supportsHaptics,
      supportsHighRefreshRate,
      supportsAdvancedAnimations,
      supportsParticles,
      supportsShaders,

      maxParticleCount,
      maxConcurrentAnimations,
      recommendedAnimationFPS,
      shouldReduceMotion: tier === 'low',
      shouldUseLightEffects: tier === 'low',
    };

    // Generate recommendations
    this.recommendations = this.generateRecommendations(this.capabilities);

    return this.capabilities;
  }

  /**
   * Get device capabilities (must call initialize first)
   */
  getCapabilities(): DeviceCapabilities {
    if (!this.capabilities) {
      throw new Error('DeviceProfiler not initialized. Call initialize() first.');
    }
    return this.capabilities;
  }

  /**
   * Get performance recommendations
   */
  getRecommendations(): PerformanceRecommendations {
    if (!this.recommendations) {
      throw new Error('DeviceProfiler not initialized. Call initialize() first.');
    }
    return this.recommendations;
  }

  /**
   * Check if device can handle a specific feature
   */
  canHandle(feature: keyof DeviceCapabilities): boolean {
    if (!this.capabilities) return false;
    return Boolean(this.capabilities[feature]);
  }

  /**
   * Get optimized value for a setting based on device tier
   */
  getOptimizedValue<T>(highValue: T, midValue: T, lowValue: T): T {
    if (!this.capabilities) return midValue;

    switch (this.capabilities.tier) {
      case 'high':
        return highValue;
      case 'mid':
        return midValue;
      case 'low':
        return lowValue;
      default:
        return midValue;
    }
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private getPlatformVersion(): number {
    const version = Platform.Version;
    if (typeof version === 'string') {
      return parseFloat(version);
    }
    return version;
  }

  private determineDeviceTier(deviceModel: string | null, platformVersion: number): DeviceTier {
    if (!deviceModel) {
      // Fallback based on platform version
      if (Platform.OS === 'ios') {
        return platformVersion >= 16 ? 'high' : platformVersion >= 14 ? 'mid' : 'low';
      } else {
        return platformVersion >= 12 ? 'mid' : 'low';
      }
    }

    // Check high-end patterns
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    const highEndPatterns = HIGH_END_PATTERNS[platform] || [];
    const midRangePatterns = MID_RANGE_PATTERNS[platform] || [];

    if (highEndPatterns.some((pattern) => deviceModel.includes(pattern))) {
      return 'high';
    }

    if (midRangePatterns.some((pattern) => deviceModel.includes(pattern))) {
      return 'mid';
    }

    // iOS devices are generally higher tier
    if (Platform.OS === 'ios') {
      return platformVersion >= 15 ? 'mid' : 'low';
    }

    return 'low';
  }

  private estimateRam(tier: DeviceTier, _deviceModel: string | null): 'low' | 'medium' | 'high' {
    switch (tier) {
      case 'high':
        return 'high';
      case 'mid':
        return 'medium';
      default:
        return 'low';
    }
  }

  private estimateGpu(tier: DeviceTier, platformVersion: number): 'low' | 'medium' | 'high' {
    if (Platform.OS === 'ios') {
      // iOS generally has good GPU performance
      return tier === 'low' ? 'medium' : 'high';
    }

    // Android varies more
    switch (tier) {
      case 'high':
        return 'high';
      case 'mid':
        return platformVersion >= 11 ? 'medium' : 'low';
      default:
        return 'low';
    }
  }

  private checkNativeBlurSupport(platformVersion: number): boolean {
    if (Platform.OS === 'ios') {
      return platformVersion >= 13;
    }
    // Android native blur requires API 31+ (Android 12)
    return platformVersion >= 31 || platformVersion >= 12;
  }

  private checkHapticsSupport(): boolean {
    // Haptics available on iOS and most Android devices
    return Platform.OS === 'ios' || Platform.OS === 'android';
  }

  private checkHighRefreshRateSupport(deviceModel: string | null): boolean {
    if (!deviceModel) return false;

    // Known devices with high refresh rate
    const highRefreshDevices = [
      'iPhone13',
      'iPhone14',
      'iPhone15',
      'iPhone16',
      'iPad Pro',
      'SM-S2',
      'SM-S9',
      'SM-S8', // Samsung S21+, S22+, S23+
      'Pixel 6',
      'Pixel 7',
      'Pixel 8',
      'OnePlus',
    ];

    return highRefreshDevices.some((pattern) => deviceModel.includes(pattern));
  }

  private calculateLimits(
    tier: DeviceTier,
    _ram: 'low' | 'medium' | 'high',
    _gpu: 'low' | 'medium' | 'high'
  ): {
    maxParticleCount: number;
    maxConcurrentAnimations: number;
    recommendedAnimationFPS: number;
  } {
    switch (tier) {
      case 'high':
        return {
          maxParticleCount: 500,
          maxConcurrentAnimations: 20,
          recommendedAnimationFPS: 60,
        };
      case 'mid':
        return {
          maxParticleCount: 200,
          maxConcurrentAnimations: 10,
          recommendedAnimationFPS: 60,
        };
      case 'low':
        return {
          maxParticleCount: 50,
          maxConcurrentAnimations: 5,
          recommendedAnimationFPS: 30,
        };
      default:
        return {
          maxParticleCount: 100,
          maxConcurrentAnimations: 8,
          recommendedAnimationFPS: 60,
        };
    }
  }

  private generateRecommendations(capabilities: DeviceCapabilities): PerformanceRecommendations {
    const { tier, supportsNativeBlur, supportsHaptics, supportsParticles, supportsShaders } =
      capabilities;

    switch (tier) {
      case 'high':
        return {
          enableParticles: true,
          particleCount: 500,
          enableBlur: supportsNativeBlur,
          blurQuality: 'high',
          enableGlow: true,
          enableShadows: true,
          shadowQuality: 'high',
          enableAnimations: true,
          animationQuality: 'high',
          enableHaptics: supportsHaptics,
          enableScanlines: supportsShaders,
          enableGradientAnimations: true,
        };

      case 'mid':
        return {
          enableParticles: supportsParticles,
          particleCount: 200,
          enableBlur: supportsNativeBlur,
          blurQuality: 'medium',
          enableGlow: true,
          enableShadows: true,
          shadowQuality: 'medium',
          enableAnimations: true,
          animationQuality: 'medium',
          enableHaptics: supportsHaptics,
          enableScanlines: supportsShaders,
          enableGradientAnimations: true,
        };

      case 'low':
      default:
        return {
          enableParticles: false,
          particleCount: 0,
          enableBlur: false,
          blurQuality: 'low',
          enableGlow: false,
          enableShadows: false,
          shadowQuality: 'low',
          enableAnimations: true,
          animationQuality: 'low',
          enableHaptics: supportsHaptics,
          enableScanlines: false,
          enableGradientAnimations: false,
        };
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const deviceProfiler = new DeviceProfiler();

// ============================================================================
// React Hook
// ============================================================================

import { useState, useEffect } from 'react';

/**
 * Hook for device capabilities.
 *
 */
export function useDeviceCapabilities(): DeviceCapabilities | null {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities | null>(null);

  useEffect(() => {
    deviceProfiler.initialize().then(setCapabilities);
  }, []);

  return capabilities;
}

/**
 * Hook for performance recommendations.
 *
 */
export function usePerformanceRecommendations(): PerformanceRecommendations | null {
  const [recommendations, setRecommendations] = useState<PerformanceRecommendations | null>(null);

  useEffect(() => {
    deviceProfiler.initialize().then(() => {
      setRecommendations(deviceProfiler.getRecommendations());
    });
  }, []);

  return recommendations;
}

// ============================================================================
// Default Export
// ============================================================================

export default deviceProfiler;
