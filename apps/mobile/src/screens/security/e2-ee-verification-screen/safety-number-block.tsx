/**
 * Safety number block display component.
 * @module screens/security/e2-ee-verification-screen/safety-number-block
 */
import React from 'react';
import { View, Text } from 'react-native';
import { styles } from './styles';

interface SafetyNumberBlockProps {
  number: string;
}

/** Description. */
/** Safety Number Block component. */
export function SafetyNumberBlock({ number }: SafetyNumberBlockProps) {
  const blocks = number.match(/.{1,5}/g) || [];
  const rows = [];

  for (let i = 0; i < blocks.length; i += 4) {
    rows.push(blocks.slice(i, i + 4));
  }

  return (
    <View style={styles.safetyNumberContainer}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.safetyNumberRow}>
          {row.map((block, blockIndex) => (
            <View key={blockIndex} style={styles.safetyNumberBlock}>
              <Text style={styles.safetyNumberText}>{block}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}
