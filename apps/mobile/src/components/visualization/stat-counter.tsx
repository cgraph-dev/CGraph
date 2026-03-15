/**
 * StatCounter - Animated Number Counter with Spring Physics
 *
 * Features:
 * - Smooth number counting animations
 * - Multiple format options (number, currency, percentage)
 * - Prefix/suffix support
 * - Spring physics for natural feel
 * - Comparison indicators (up/down arrows)
 * - Decimal precision control
 */

import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, ViewStyle, StyleProp, TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
  Easing,
  SharedValue,
} from 'react-native-reanimated';

import { SPRING_PRESETS } from '../../lib/animations/animation-library';

// ============================================================================
// Types
// ============================================================================

export type NumberFormat = 'number' | 'currency' | 'percentage' | 'compact';

export interface StatCounterProps {
  value: number;
  previousValue?: number;
  format?: NumberFormat;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  currency?: string;
  locale?: string;
  animated?: boolean;
  animationDuration?: number;
  springPreset?: keyof typeof SPRING_PRESETS;
  showChange?: boolean;
  changePosition?: 'inline' | 'below';
  label?: string;
  labelPosition?: 'above' | 'below';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  changeUpColor?: string;
  changeDownColor?: string;
  style?: StyleProp<ViewStyle>;
  valueStyle?: StyleProp<TextStyle>;
  labelStyle?: StyleProp<TextStyle>;
}

// ============================================================================
// Constants
// ============================================================================

const SIZE_CONFIG = {
  sm: { value: 20, label: 12, change: 12 },
  md: { value: 28, label: 14, change: 14 },
  lg: { value: 36, label: 16, change: 16 },
  xl: { value: 48, label: 18, change: 18 },
};

// ============================================================================
// Component
// ============================================================================

/**
 * Stat Counter component.
 *
 */
export function StatCounter({
  value,
  previousValue,
  format = 'number',
  prefix = '',
  suffix = '',
  decimals = 0,
  currency = 'USD',
  locale = 'en-US',
  animated = true,
  animationDuration = 1000,
  springPreset = 'bouncy',
  showChange = false,
  changePosition = 'inline',
  label,
  labelPosition = 'below',
  size = 'md',
  color = '#ffffff',
  changeUpColor = '#10b981',
  changeDownColor = '#ef4444',
  style,
  valueStyle,
  labelStyle,
}: StatCounterProps) {
  const animatedValue = useSharedValue(0);
  const scale = useSharedValue(1);

  const sizeConfig = SIZE_CONFIG[size];
  const springConfig = SPRING_PRESETS[springPreset];

  // Calculate change
  const change = useMemo(() => {
    if (previousValue === undefined) return null;
    const diff = value - previousValue;
    const percentage = previousValue !== 0 ? (diff / previousValue) * 100 : 0;
    return {
      diff,
      percentage,
      isPositive: diff >= 0,
    };
  }, [value, previousValue]);

  // Animate value
  useEffect(() => {
    if (animated) {
      // Scale animation for emphasis
      scale.value = withSpring(1.05, { damping: 10 }, () => {
        scale.value = withSpring(1, springConfig);
      });

      // Value animation
      animatedValue.value = withTiming(value, {
        duration: animationDuration,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      animatedValue.value = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, animated, animationDuration]);

  // Format number
  const formatNumber = useMemo(() => {
    return (num: number): string => {
      switch (format) {
        case 'currency':
          return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency,
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          }).format(num);

        case 'percentage':
          return `${num.toFixed(decimals)}%`;

        case 'compact':
          if (num >= 1000000000) {
            return `${(num / 1000000000).toFixed(1)}B`;
          } else if (num >= 1000000) {
            return `${(num / 1000000).toFixed(1)}M`;
          } else if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}K`;
          }
          return num.toFixed(decimals);

        default:
          return new Intl.NumberFormat(locale, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          }).format(num);
      }
    };
  }, [format, locale, currency, decimals]);

  // Animated scale style
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Render change indicator
  const renderChange = () => {
    if (!showChange || !change) return null;

    const changeColor = change.isPositive ? changeUpColor : changeDownColor;
    const arrow = change.isPositive ? '↑' : '↓';

    return (
      <View
        style={[styles.changeContainer, changePosition === 'below' && styles.changeBelowContainer]}
      >
        <Animated.Text
          style={[styles.changeText, { color: changeColor, fontSize: sizeConfig.change }]}
        >
          {arrow} {Math.abs(change.percentage).toFixed(1)}%
        </Animated.Text>
      </View>
    );
  };

  // Render label
  const renderLabel = () => {
    if (!label) return null;

    return (
      <Animated.Text style={[styles.label, { fontSize: sizeConfig.label }, labelStyle]}>
        {label}
      </Animated.Text>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {labelPosition === 'above' && renderLabel()}

      <Animated.View style={[styles.valueContainer, animatedStyle]}>
        <AnimatedNumber
          value={animatedValue}
          format={formatNumber}
          prefix={prefix}
          suffix={suffix}
          fontSize={sizeConfig.value}
          color={color}
          style={valueStyle}
        />

        {changePosition === 'inline' && renderChange()}
      </Animated.View>

      {changePosition === 'below' && renderChange()}
      {labelPosition === 'below' && renderLabel()}
    </View>
  );
}

// ============================================================================
// Animated Number Component
// ============================================================================

interface AnimatedNumberProps {
  value: SharedValue<number>;
  format: (num: number) => string;
  prefix: string;
  suffix: string;
  fontSize: number;
  color: string;
  style?: StyleProp<TextStyle>;
}

function AnimatedNumber({
  value,
  format,
  prefix,
  suffix,
  fontSize,
  color,
  style,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = React.useState('0');

  useDerivedValue(() => {
    runOnJS(setDisplayValue)(format(value.value));
  }, [value]);

  return (
    <Animated.Text style={[styles.value, { fontSize, color }, style]}>
      {prefix}
      {displayValue}
      {suffix}
    </Animated.Text>
  );
}

// ============================================================================
// Stat Group Component
// ============================================================================

export interface StatGroupProps {
  stats: Array<{
    value: number;
    previousValue?: number;
    label: string;
    format?: NumberFormat;
    prefix?: string;
    suffix?: string;
    color?: string;
  }>;
  columns?: 2 | 3 | 4;
  animated?: boolean;
  staggerDelay?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Stat Group component.
 *
 */
export function StatGroup({
  stats,
  columns = 2,
  animated = true,
  staggerDelay = 100,
  style,
}: StatGroupProps) {
  return (
    <View style={[styles.statGroup, style]}>
      {stats.map((stat, index) => (
        <View key={`stat-${index}`} style={[styles.statGroupItem, { width: `${100 / columns}%` }]}>
          <DelayedStatCounter
            {...stat}
            animated={animated}
            showChange={stat.previousValue !== undefined}
            delay={index * staggerDelay}
            size="md"
          />
        </View>
      ))}
    </View>
  );
}

interface DelayedStatCounterProps extends StatCounterProps {
  delay?: number;
}

function DelayedStatCounter({ delay = 0, ...props }: DelayedStatCounterProps) {
  const [show, setShow] = React.useState(!props.animated);

  useEffect(() => {
    if (props.animated) {
      const timer = setTimeout(() => setShow(true), delay);
      return () => clearTimeout(timer);
    }
  }, [delay, props.animated]);

  if (!show) {
    return (
      <View style={styles.placeholder}>
        <Animated.Text style={[styles.value, { opacity: 0.3 }]}>0</Animated.Text>
      </View>
    );
  }

  return <StatCounter {...props} />;
}

// ============================================================================
// Comparison Stat Component
// ============================================================================

export interface ComparisonStatProps {
  currentValue: number;
  previousValue: number;
  currentLabel?: string;
  previousLabel?: string;
  format?: NumberFormat;
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Comparison Stat component.
 *
 */
export function ComparisonStat({
  currentValue,
  previousValue,
  currentLabel = 'Current',
  previousLabel = 'Previous',
  format = 'number',
  animated = true,
  style,
}: ComparisonStatProps) {
  const change = currentValue - previousValue;
  const percentage = previousValue !== 0 ? (change / previousValue) * 100 : 0;
  const isPositive = change >= 0;

  return (
    <View style={[styles.comparisonContainer, style]}>
      <View style={styles.comparisonStat}>
        <Animated.Text style={styles.comparisonLabel}>{currentLabel}</Animated.Text>
        <StatCounter value={currentValue} format={format} animated={animated} size="lg" />
      </View>

      <View style={styles.comparisonArrow}>
        <Animated.Text
          style={[styles.comparisonChange, { color: isPositive ? '#10b981' : '#ef4444' }]}
        >
          {isPositive ? '↑' : '↓'} {Math.abs(percentage).toFixed(1)}%
        </Animated.Text>
      </View>

      <View style={styles.comparisonStat}>
        <Animated.Text style={styles.comparisonLabel}>{previousLabel}</Animated.Text>
        <StatCounter
          value={previousValue}
          format={format}
          animated={animated}
          size="md"
          color="#9ca3af"
        />
      </View>
    </View>
  );
}

// ============================================================================
// Countdown Component
// ============================================================================

export interface CountdownProps {
  targetDate: Date;
  onComplete?: () => void;
  showDays?: boolean;
  showHours?: boolean;
  showMinutes?: boolean;
  showSeconds?: boolean;
  separator?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Countdown component.
 *
 */
export function Countdown({
  targetDate,
  onComplete,
  showDays = true,
  showHours = true,
  showMinutes = true,
  showSeconds = true,
  separator = ':',
  size = 'lg',
  color = '#ffffff',
  style,
}: CountdownProps) {
  const [timeLeft, setTimeLeft] = React.useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference <= 0) {
        onComplete?.();
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  const sizeConfig = SIZE_CONFIG[size];
  const segments: string[] = [];

  if (showDays && timeLeft.days > 0) {
    segments.push(timeLeft.days.toString().padStart(2, '0'));
  }
  if (showHours) {
    segments.push(timeLeft.hours.toString().padStart(2, '0'));
  }
  if (showMinutes) {
    segments.push(timeLeft.minutes.toString().padStart(2, '0'));
  }
  if (showSeconds) {
    segments.push(timeLeft.seconds.toString().padStart(2, '0'));
  }

  return (
    <View style={[styles.countdownContainer, style]}>
      {segments.map((segment, index) => (
        <React.Fragment key={`segment-${index}`}>
          <CountdownSegment value={segment} fontSize={sizeConfig.value} color={color} />
          {index < segments.length - 1 && (
            <Animated.Text style={[styles.separator, { fontSize: sizeConfig.value, color }]}>
              {separator}
            </Animated.Text>
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

interface CountdownSegmentProps {
  value: string;
  fontSize: number;
  color: string;
}

function CountdownSegment({ value, fontSize, color }: CountdownSegmentProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(1.1, { damping: 10 }, () => {
      scale.value = withSpring(1, { damping: 15 });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.countdownSegment, animatedStyle]}>
      <Animated.Text style={[styles.countdownValue, { fontSize, color }]}>{value}</Animated.Text>
    </Animated.View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  value: {
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  label: {
    color: '#9ca3af',
    marginTop: 4,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeBelowContainer: {
    marginTop: 4,
  },
  changeText: {
    fontWeight: '600',
  },
  statGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statGroupItem: {
    padding: 12,
    alignItems: 'center',
  },
  placeholder: {
    alignItems: 'center',
  },
  comparisonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  comparisonStat: {
    alignItems: 'center',
    flex: 1,
  },
  comparisonLabel: {
    color: '#9ca3af',
    fontSize: 12,
    marginBottom: 4,
  },
  comparisonArrow: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  comparisonChange: {
    fontSize: 14,
    fontWeight: '600',
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countdownSegment: {
    backgroundColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 50,
    alignItems: 'center',
  },
  countdownValue: {
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  separator: {
    marginHorizontal: 4,
    fontWeight: '700',
  },
});

export default StatCounter;
