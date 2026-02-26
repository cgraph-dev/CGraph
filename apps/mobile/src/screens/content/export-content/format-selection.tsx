/**
 * Format and paper-size selection for export wizard.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { ExportFormat, ExportOptions } from './export-types';

interface FormatSelectionProps {
  selectedFormat: ExportFormat;
  paperSize: ExportOptions['paperSize'];
  onFormatChange: (format: ExportFormat) => void;
  onPaperSizeChange: (size: ExportOptions['paperSize']) => void;
}

export function FormatSelection({
  selectedFormat,
  paperSize,
  onFormatChange,
  onPaperSizeChange,
}: FormatSelectionProps) {
  return (
    <>
      {/* Format Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Export Format</Text>
        <View style={styles.formatOptions}>
          <TouchableOpacity
            style={[styles.formatOption, selectedFormat === 'pdf' && styles.formatOptionSelected]}
            onPress={() => {
              HapticFeedback.light();
              onFormatChange('pdf');
            }}
          >
            <Ionicons
              name="document"
              size={32}
              color={selectedFormat === 'pdf' ? '#10b981' : '#6b7280'}
            />
            <Text style={[styles.formatLabel, selectedFormat === 'pdf' && styles.formatLabelSelected]}>
              PDF
            </Text>
            <Text style={styles.formatDescription}>Best for printing</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.formatOption, selectedFormat === 'html' && styles.formatOptionSelected]}
            onPress={() => {
              HapticFeedback.light();
              onFormatChange('html');
            }}
          >
            <Ionicons
              name="code-slash"
              size={32}
              color={selectedFormat === 'html' ? '#10b981' : '#6b7280'}
            />
            <Text style={[styles.formatLabel, selectedFormat === 'html' && styles.formatLabelSelected]}>
              HTML
            </Text>
            <Text style={styles.formatDescription}>Best for archiving</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Paper Size */}
      {selectedFormat === 'pdf' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paper Size</Text>
          <View style={styles.paperOptions}>
            <TouchableOpacity
              style={[styles.paperOption, paperSize === 'a4' && styles.paperOptionSelected]}
              onPress={() => {
                HapticFeedback.light();
                onPaperSizeChange('a4');
              }}
            >
              <Text style={[styles.paperLabel, paperSize === 'a4' && styles.paperLabelSelected]}>
                A4
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.paperOption, paperSize === 'letter' && styles.paperOptionSelected]}
              onPress={() => {
                HapticFeedback.light();
                onPaperSizeChange('letter');
              }}
            >
              <Text style={[styles.paperLabel, paperSize === 'letter' && styles.paperLabelSelected]}>
                Letter
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 12 },
  formatOptions: { flexDirection: 'row', gap: 12 },
  formatOption: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12,
    padding: 20, alignItems: 'center', borderWidth: 2, borderColor: 'transparent',
  },
  formatOptionSelected: {
    borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  formatLabel: { fontSize: 16, fontWeight: '600', color: '#9ca3af', marginTop: 8 },
  formatLabelSelected: { color: '#10b981' },
  formatDescription: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  paperOptions: { flexDirection: 'row', gap: 10 },
  paperOption: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10,
    paddingVertical: 14, alignItems: 'center', borderWidth: 2, borderColor: 'transparent',
  },
  paperOptionSelected: {
    borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  paperLabel: { fontSize: 15, fontWeight: '600', color: '#9ca3af' },
  paperLabelSelected: { color: '#10b981' },
});
