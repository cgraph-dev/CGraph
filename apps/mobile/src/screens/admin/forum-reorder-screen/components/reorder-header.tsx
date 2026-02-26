/**
 * Header bar and instructions card for the forum reorder screen.
 * @module screens/admin/forum-reorder-screen/components/reorder-header
 */
import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { styles } from '../styles';

interface ReorderHeaderProps {
  hasChanges: boolean;
  isSaving: boolean;
  onBack: () => void;
  onSave: () => void;
}

export function ReorderHeader({ hasChanges, isSaving, onBack, onSave }: ReorderHeaderProps) {
  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            HapticFeedback.light();
            onBack();
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Reorder Forums</Text>
          <Text style={styles.headerSubtitle}>Drag to rearrange</Text>
        </View>
        {hasChanges && (
          <TouchableOpacity style={styles.saveButton} onPress={onSave} disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <BlurView intensity={40} tint="dark" style={styles.instructionsCard}>
        <Ionicons name="information-circle" size={20} color="#6366f1" />
        <Text style={styles.instructionsText}>
          Use the arrows or drag the handle to reorder forums and categories
        </Text>
      </BlurView>
    </>
  );
}
