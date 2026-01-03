/**
 * Matrix Cipher Background Animation - React Native Component
 * 
 * @description High-performance Matrix rain effect for React Native.
 * Uses React Native's Animated API for smooth 60fps animations.
 * Optimized for battery life on mobile devices.
 * 
 * @version 1.0.0
 * @since v0.6.3
 * @author CGraph Development Team
 * 
 * @example
 * ```tsx
 * import { MatrixBackground } from './components/matrix';
 * 
 * function App() {
 *   return (
 *     <View style={{ flex: 1 }}>
 *       <MatrixBackground theme="matrix-green" intensity="medium" />
 *       <YourContent />
 *     </View>
 *   );
 * }
 * ```
 */

import React, {
  forwardRef,
  useImperativeHandle,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  memo,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  AppState,
  AppStateStatus,
  LayoutChangeEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';

import type {
  MatrixBackgroundProps,
  MatrixBackgroundRef,
  MatrixColumnData,
  MatrixChar,
  MatrixMobileTheme,
  ThemePreset,
} from './types';
import { getTheme } from './themes';
import { createConfig, getCharacterSet, getRandomChar } from './config';

// =============================================================================
// CONSTANTS
// =============================================================================

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// =============================================================================
// MATRIX COLUMN COMPONENT
// =============================================================================

interface MatrixColumnProps {
  column: MatrixColumnData;
  theme: MatrixMobileTheme;
  fontSize: number;
  containerHeight: number;
}

/**
 * Individual falling column of characters
 */
const MatrixColumn = memo<MatrixColumnProps>(function MatrixColumn({
  column,
  theme,
  fontSize,
  containerHeight,
}) {
  const translateY = useSharedValue(column.y);
  
  // Animate the column falling
  useEffect(() => {
    if (!column.active) return;
    
    const columnHeight = column.length * fontSize;
    const distance = containerHeight + columnHeight;
    const duration = (distance / column.speed) * 50; // Convert speed to duration
    
    translateY.value = column.y;
    translateY.value = withTiming(containerHeight + columnHeight, {
      duration,
      easing: Easing.linear,
    });
    
    return () => {
      cancelAnimation(translateY);
    };
  }, [column.active, column.speed, column.y, containerHeight, fontSize, column.length]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  
  if (!column.active) return null;
  
  return (
    <Animated.View
      style={[
        styles.column,
        { left: column.x },
        animatedStyle,
      ]}
    >
      {column.chars.map((char, index) => {
        const isHead = index === 0;
        const normalizedPosition = index / column.length;
        
        // Calculate color based on position
        let color: string;
        let opacity: number;
        
        if (isHead) {
          color = theme.primaryColor;
          opacity = 1;
        } else if (normalizedPosition < 0.3) {
          color = theme.secondaryColor;
          opacity = 0.9 - normalizedPosition;
        } else {
          color = theme.tertiaryColor;
          opacity = 0.7 - normalizedPosition * 0.5;
        }
        
        return (
          <Text
            key={`${column.id}-${index}`}
            style={[
              styles.character,
              {
                fontSize,
                color,
                opacity: Math.max(0.1, opacity),
                textShadowColor: isHead ? theme.glowColor : 'transparent',
                textShadowRadius: isHead ? 4 : 0,
              },
            ]}
          >
            {char.value}
          </Text>
        );
      })}
    </Animated.View>
  );
});

// =============================================================================
// MAIN MATRIX BACKGROUND COMPONENT
// =============================================================================

/**
 * Matrix Background Component for React Native
 * 
 * Creates a falling digital rain effect inspired by The Matrix.
 * Optimized for mobile performance and battery life.
 */
export const MatrixBackground = memo(forwardRef<MatrixBackgroundRef, MatrixBackgroundProps>(
  function MatrixBackground(props, ref) {
    const {
      theme: themeProp = 'matrix-green',
      intensity = 'medium',
      config: configOverrides,
      style,
      autoStart = true,
      pauseInBackground = true,
      opacity = 1,
      onReady,
    } = props;
    
    // State
    const [isRunning, setIsRunning] = useState(autoStart);
    const [columns, setColumns] = useState<MatrixColumnData[]>([]);
    const [dimensions, setDimensions] = useState({ width: SCREEN_WIDTH, height: SCREEN_HEIGHT });
    
    // Refs
    const frameRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const columnsRef = useRef<MatrixColumnData[]>([]);
    const columnIdCounter = useRef(0);
    
    // Configuration
    const config = useMemo(
      () => createConfig(intensity, configOverrides),
      [intensity, configOverrides]
    );
    
    // Theme
    const theme: MatrixMobileTheme = useMemo(() => {
      if (typeof themeProp === 'string') {
        return getTheme(themeProp as ThemePreset);
      }
      return themeProp;
    }, [themeProp]);
    
    // Character set
    const characters = useMemo(
      () => getCharacterSet(config.characterSet),
      [config.characterSet]
    );
    
    // =========================================================================
    // COLUMN MANAGEMENT
    // =========================================================================
    
    /**
     * Create a new column
     */
    const createColumn = useCallback((x?: number): MatrixColumnData => {
      const id = `col-${++columnIdCounter.current}`;
      const columnX = x ?? Math.random() * dimensions.width;
      const length = Math.floor(
        config.minLength + Math.random() * (config.maxLength - config.minLength)
      );
      const speed = config.minSpeed + Math.random() * (config.maxSpeed - config.minSpeed);
      
      // Create characters
      const chars: MatrixChar[] = Array.from({ length }, (_, i) => ({
        value: getRandomChar(characters),
        opacity: 1 - (i / length),
        isHead: i === 0,
        changeCounter: Math.floor(Math.random() * 10),
      }));
      
      return {
        id,
        x: columnX,
        y: -length * config.fontSize,
        speed,
        chars,
        length,
        active: true,
        respawnDelay: 0,
      };
    }, [dimensions.width, config, characters]);
    
    /**
     * Initialize columns
     */
    const initializeColumns = useCallback(() => {
      const spacing = dimensions.width / config.columnCount;
      const newColumns: MatrixColumnData[] = [];
      
      for (let i = 0; i < config.columnCount; i++) {
        const x = i * spacing + Math.random() * spacing * 0.5;
        const column = createColumn(x);
        // Stagger start positions
        column.y = -Math.random() * dimensions.height;
        newColumns.push(column);
      }
      
      columnsRef.current = newColumns;
      setColumns([...newColumns]);
    }, [dimensions, config.columnCount, createColumn]);
    
    /**
     * Update columns each frame
     */
    const updateColumns = useCallback(() => {
      const columnHeight = config.maxLength * config.fontSize;
      const updatedColumns = columnsRef.current.map(column => {
        // Move column down
        const newY = column.y + column.speed;
        
        // Check if column is off screen
        if (newY > dimensions.height + columnHeight) {
          // Respawn at top
          return {
            ...column,
            y: -columnHeight * (1 + Math.random()),
            speed: config.minSpeed + Math.random() * (config.maxSpeed - config.minSpeed),
            chars: column.chars.map(char => ({
              ...char,
              value: getRandomChar(characters),
            })),
          };
        }
        
        // Update characters occasionally
        const updatedChars = column.chars.map(char => {
          if (Math.random() < config.changeFrequency) {
            return { ...char, value: getRandomChar(characters) };
          }
          return char;
        });
        
        return {
          ...column,
          y: newY,
          chars: updatedChars,
        };
      });
      
      columnsRef.current = updatedColumns;
      setColumns([...updatedColumns]);
    }, [dimensions.height, config, characters]);
    
    // =========================================================================
    // ANIMATION LOOP
    // =========================================================================
    
    /**
     * Start animation loop
     */
    const startLoop = useCallback(() => {
      if (frameRef.current) return;
      
      const loop = () => {
        updateColumns();
        frameRef.current = setTimeout(loop, config.frameInterval);
      };
      
      loop();
    }, [updateColumns, config.frameInterval]);
    
    /**
     * Stop animation loop
     */
    const stopLoop = useCallback(() => {
      if (frameRef.current) {
        clearTimeout(frameRef.current);
        frameRef.current = null;
      }
    }, []);
    
    // =========================================================================
    // PUBLIC API
    // =========================================================================
    
    const start = useCallback(() => {
      setIsRunning(true);
      initializeColumns();
      startLoop();
    }, [initializeColumns, startLoop]);
    
    const stop = useCallback(() => {
      setIsRunning(false);
      stopLoop();
      setColumns([]);
      columnsRef.current = [];
    }, [stopLoop]);
    
    const pause = useCallback(() => {
      setIsRunning(false);
      stopLoop();
    }, [stopLoop]);
    
    const resume = useCallback(() => {
      setIsRunning(true);
      startLoop();
    }, [startLoop]);
    
    const setThemeMethod = useCallback((_newTheme: ThemePreset) => {
      // Theme change is handled via props, this method is for ref API compatibility
    }, []);
    
    // Expose ref methods
    useImperativeHandle(ref, () => ({
      start,
      stop,
      pause,
      resume,
      setTheme: setThemeMethod,
    }), [start, stop, pause, resume, setThemeMethod]);
    
    // =========================================================================
    // LIFECYCLE
    // =========================================================================
    
    // Initialize on mount
    useEffect(() => {
      if (autoStart) {
        initializeColumns();
        startLoop();
        onReady?.();
      }
      
      return () => {
        stopLoop();
      };
    }, []);
    
    // Handle app state changes
    useEffect(() => {
      if (!pauseInBackground) return;
      
      const handleAppStateChange = (nextAppState: AppStateStatus) => {
        if (nextAppState === 'active' && isRunning) {
          startLoop();
        } else if (nextAppState === 'background' || nextAppState === 'inactive') {
          stopLoop();
        }
      };
      
      const subscription = AppState.addEventListener('change', handleAppStateChange);
      
      return () => {
        subscription.remove();
      };
    }, [pauseInBackground, isRunning, startLoop, stopLoop]);
    
    // Handle layout changes
    const handleLayout = useCallback((event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      if (width !== dimensions.width || height !== dimensions.height) {
        setDimensions({ width, height });
      }
    }, [dimensions]);
    
    // Reinitialize on dimension changes
    useEffect(() => {
      if (isRunning && dimensions.width > 0 && dimensions.height > 0) {
        initializeColumns();
      }
    }, [dimensions, isRunning]);
    
    // =========================================================================
    // RENDER
    // =========================================================================
    
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.backgroundColor, opacity },
          style,
        ]}
        onLayout={handleLayout}
        pointerEvents="none"
      >
        {columns.map(column => (
          <MatrixColumn
            key={column.id}
            column={column}
            theme={theme}
            fontSize={config.fontSize}
            containerHeight={dimensions.height}
          />
        ))}
      </View>
    );
  }
));

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  column: {
    position: 'absolute',
    top: 0,
  },
  character: {
    fontFamily: 'monospace',
    textAlign: 'center',
    lineHeight: undefined, // Use default
  },
});

// =============================================================================
// VARIANT COMPONENTS
// =============================================================================

/**
 * Auth background variant - subtle effect for login/register
 */
export const MatrixAuthBackground = memo(function MatrixAuthBackground(
  props: Omit<MatrixBackgroundProps, 'intensity' | 'opacity'>
) {
  return (
    <MatrixBackground
      {...props}
      intensity="low"
      opacity={0.3}
      theme={props.theme || 'matrix-green'}
    />
  );
});

/**
 * Ambient background - very subtle for general use
 */
export const MatrixAmbientBackground = memo(function MatrixAmbientBackground(
  props: Omit<MatrixBackgroundProps, 'intensity' | 'opacity'>
) {
  return (
    <MatrixBackground
      {...props}
      intensity="low"
      opacity={0.15}
      theme={props.theme || 'matrix-green'}
    />
  );
});

export default MatrixBackground;
