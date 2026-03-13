/**
 * Waveform visualization for voice recording.
 * @module components/voice-message-recorder/waveform-display
 */
import React from 'react';
import { View } from 'react-native';
import type { RecordingState } from './types';
import { styles } from './styles';

interface WaveformDisplayProps {
  state: RecordingState;
  waveformBarHeights: number[];
  waveformData: number[];
  previewStatus: { duration?: number; currentTime?: number } | null;
  errorColor: string;
  primaryColor: string;
  textSecondaryColor: string;
}

/** Description. */
/** Waveform Display component. */
export function WaveformDisplay({
  state,
  waveformBarHeights,
  waveformData,
  previewStatus,
  errorColor,
  primaryColor,
  textSecondaryColor,
}: WaveformDisplayProps) {
  const barWidth = 3;
  const barGap = 2;
  const maxHeight = 40;

  if (state === 'recording') {
    return (
      <View style={styles.waveformContainer}>
        {waveformBarHeights.map((barHeight, index) => (
          <View
            key={index}
            style={[
              styles.waveformBar,
              {
                height: 4 + barHeight * (maxHeight - 4),
                backgroundColor: errorColor,
                width: barWidth,
                marginHorizontal: barGap / 2,
              },
            ]}
          />
        ))}
      </View>
    );
  }

  const bars = waveformData.length > 0 ? waveformData : Array(30).fill(0.1);
  const displayBars = bars.slice(-30);

  while (displayBars.length < 30) {
    displayBars.unshift(0.1);
  }

  let progressRatio = 0;
  if (state === 'preview' && previewStatus?.duration && previewStatus.duration > 0) {
    progressRatio = (previewStatus.currentTime || 0) / previewStatus.duration;
  }
  const progressIndex = Math.floor(progressRatio * displayBars.length);

  return (
    <View style={styles.waveformContainer}>
      {displayBars.map((amplitude, index) => {
        let barColor = primaryColor;
        if (state === 'preview') {
          barColor = index <= progressIndex ? primaryColor : textSecondaryColor;
        }
        return (
          <View
            key={index}
            style={[
              styles.waveformBar,
              {
                height: Math.max(4, amplitude * maxHeight),
                backgroundColor: barColor,
                width: barWidth,
                marginHorizontal: barGap / 2,
              },
            ]}
          />
        );
      })}
    </View>
  );
}
