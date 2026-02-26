/**
 * Action buttons (Preview / Export) for export wizard.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface ExportActionsProps {
  selectedFormat: string;
  isExporting: boolean;
  isPreviewing: boolean;
  onPreview: () => void;
  onExport: () => void;
}

export function ExportActions({
  selectedFormat,
  isExporting,
  isPreviewing,
  onPreview,
  onExport,
}: ExportActionsProps) {
  return (
    <>
      {/* Info Card */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={20} color="#6366f1" />
        <Text style={styles.infoText}>
          Tap "Preview" to see how your export will look before generating the file.
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.previewButton}
          onPress={onPreview}
          disabled={isPreviewing}
        >
          {isPreviewing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="eye-outline" size={20} color="#fff" />
              <Text style={styles.previewButtonText}>Preview</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.exportButton}
          onPress={onExport}
          disabled={isExporting}
        >
          <LinearGradient colors={['#10b981', '#059669']} style={styles.exportButtonGradient}>
            {isExporting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="download-outline" size={20} color="#fff" />
                <Text style={styles.exportButtonText}>
                  Export {selectedFormat.toUpperCase()}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  infoCard: {
    flexDirection: 'row', backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 12, padding: 14, marginBottom: 24, gap: 12,
  },
  infoText: { flex: 1, fontSize: 13, color: '#9ca3af', lineHeight: 19 },
  actions: { gap: 12 },
  previewButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, gap: 8,
  },
  previewButtonText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  exportButton: { borderRadius: 12, overflow: 'hidden' },
  exportButtonGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, gap: 8,
  },
  exportButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
