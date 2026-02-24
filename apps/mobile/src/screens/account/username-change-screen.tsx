/**
 * Screen for changing the user's username with validation.
 * @module screens/account/username-change-screen
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useDebounce } from '@/hooks/useDebounce';
import { useThemeStore } from '@/stores';

interface Props {
  currentUsername: string;
  lastChangeDate?: Date | null;
  isPremium?: boolean;
  onSuccess?: (newUsername: string) => void;
}

interface UsernameHistory {
  id: string;
  oldUsername: string;
  newUsername: string;
  changedAt: Date;
}

const COOLDOWN_DAYS_STANDARD = 30;
const COOLDOWN_DAYS_PREMIUM = 7;

export function UsernameChangeScreen({
  currentUsername,
  lastChangeDate,
  isPremium = false,
  onSuccess,
}: Props): React.ReactElement {
  const navigation = useNavigation();
  const { colors } = useThemeStore();
  
  const [newUsername, setNewUsername] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [availabilityMessage, setAvailabilityMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<UsernameHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const debouncedUsername = useDebounce(newUsername, 500);
  const cooldownDays = isPremium ? COOLDOWN_DAYS_PREMIUM : COOLDOWN_DAYS_STANDARD;
  
  // Calculate remaining cooldown days
  const getRemainingDays = useCallback((): number => {
    if (!lastChangeDate) return 0;
    const now = new Date();
    const daysSinceChange = Math.floor(
      (now.getTime() - new Date(lastChangeDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.max(0, cooldownDays - daysSinceChange);
  }, [lastChangeDate, cooldownDays]);
  
  const remainingDays = getRemainingDays();
  const canChange = remainingDays === 0;
  
  // Username validation
  const isValidFormat = (username: string): boolean => {
    return /^[a-zA-Z0-9_-]{3,32}$/.test(username);
  };
  
  // Check username availability
  useEffect(() => {
    if (!debouncedUsername || debouncedUsername === currentUsername) {
      setIsAvailable(null);
      setAvailabilityMessage('');
      return;
    }
    
    if (!isValidFormat(debouncedUsername)) {
      setIsAvailable(false);
      setAvailabilityMessage('3-32 characters, letters, numbers, _ and - only');
      return;
    }
    
    const checkAvailability = async () => {
      setIsChecking(true);
      try {
        const response = await fetch(
          `/api/users/check-username?username=${encodeURIComponent(debouncedUsername)}`
        );
        const data = await response.json() as { available: boolean; reason?: string };
        setIsAvailable(data.available);
        setAvailabilityMessage(
          data.available ? 'Username is available!' : data.reason || 'Username is not available'
        );
        
        if (data.available) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
      } catch {
        setIsAvailable(false);
        setAvailabilityMessage('Unable to check availability');
      } finally {
        setIsChecking(false);
      }
    };
    
    checkAvailability();
  }, [debouncedUsername, currentUsername]);
  
  // Load history
  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await fetch('/api/users/me/username-history');
      const data = await response.json() as { history?: UsernameHistory[] };
      setHistory(data.history || []);
    } catch {
      console.error('Failed to load username history');
    } finally {
      setLoadingHistory(false);
    }
  };
  
  // Handle submit
  const handleSubmit = async () => {
    if (!canChange || !isAvailable) return;
    
    setIsSubmitting(true);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const response = await fetch('/api/users/me/change-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername }),
      });
      
      if (!response.ok) {
        const data = await response.json() as { message?: string };
        throw new Error(data.message || 'Failed to change username');
      }
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess?.(newUsername);
      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      marginRight: 16,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    premiumBadge: {
      backgroundColor: '#FFA500',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    premiumText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    content: {
      padding: 16,
    },
    cooldownAlert: {
      backgroundColor: colors.error + '20',
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
    },
    cooldownText: {
      color: colors.error,
      fontSize: 14,
    },
    cooldownSubtext: {
      color: colors.textSecondary,
      fontSize: 12,
      marginTop: 4,
    },
    section: {
      marginBottom: 20,
    },
    label: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    currentUsername: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.card,
    },
    inputAvailable: {
      borderColor: colors.success,
    },
    inputUnavailable: {
      borderColor: colors.error,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    checkingIndicator: {
      position: 'absolute',
      right: 12,
    },
    availabilityMessage: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 6,
    },
    availabilityText: {
      fontSize: 12,
      marginLeft: 4,
    },
    requirements: {
      backgroundColor: colors.card,
      borderRadius: 8,
      padding: 12,
    },
    requirementsTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 8,
    },
    requirementItem: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    errorAlert: {
      backgroundColor: colors.error + '20',
      borderRadius: 8,
      padding: 12,
      marginTop: 16,
    },
    errorText: {
      color: colors.error,
      fontSize: 14,
    },
    historyToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
    },
    historyToggleText: {
      color: colors.textSecondary,
      marginLeft: 8,
    },
    historyContainer: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      maxHeight: 200,
    },
    historyItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    historyItemLast: {
      borderBottomWidth: 0,
    },
    historyNames: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    historyOldName: {
      color: colors.textSecondary,
    },
    historyArrow: {
      color: colors.textSecondary,
      marginHorizontal: 8,
    },
    historyNewName: {
      fontWeight: '500',
      color: colors.text,
    },
    historyDate: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    emptyHistory: {
      textAlign: 'center',
      color: colors.textSecondary,
      paddingVertical: 16,
    },
    submitButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      padding: 16,
      alignItems: 'center',
      marginTop: 20,
    },
    submitButtonDisabled: {
      opacity: 0.5,
    },
    submitButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButton: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 16,
      alignItems: 'center',
      marginTop: 12,
    },
    cancelButtonText: {
      color: colors.text,
      fontSize: 16,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Username</Text>
        {isPremium && (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumText}>Premium</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.content}>
        {/* Cooldown Warning */}
        {!canChange && (
          <View style={styles.cooldownAlert}>
            <Text style={styles.cooldownText}>
              You can change your username again in {remainingDays} days.
            </Text>
            {!isPremium && (
              <Text style={styles.cooldownSubtext}>
                Premium users have a {COOLDOWN_DAYS_PREMIUM}-day cooldown instead of{' '}
                {COOLDOWN_DAYS_STANDARD} days.
              </Text>
            )}
          </View>
        )}

        {/* Current Username */}
        <View style={styles.section}>
          <Text style={styles.label}>Current Username</Text>
          <Text style={styles.currentUsername}>{currentUsername}</Text>
        </View>

        {/* New Username Input */}
        <View style={styles.section}>
          <Text style={styles.label}>New Username</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[
                styles.input,
                { flex: 1 },
                isAvailable === true && styles.inputAvailable,
                isAvailable === false && styles.inputUnavailable,
              ]}
              value={newUsername}
              onChangeText={setNewUsername}
              placeholder="Enter new username"
              placeholderTextColor={colors.textSecondary}
              editable={canChange && !isSubmitting}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {isChecking && (
              <View style={styles.checkingIndicator}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            )}
          </View>

          {/* Availability Feedback */}
          {availabilityMessage && !isChecking && newUsername.length > 0 && (
            <View style={styles.availabilityMessage}>
              <Ionicons
                name={isAvailable ? 'checkmark-circle' : 'close-circle'}
                size={16}
                color={isAvailable ? colors.success : colors.error}
              />
              <Text
                style={[
                  styles.availabilityText,
                  { color: isAvailable ? colors.success : colors.error },
                ]}
              >
                {availabilityMessage}
              </Text>
            </View>
          )}
        </View>

        {/* Requirements */}
        <View style={styles.requirements}>
          <Text style={styles.requirementsTitle}>Username Requirements:</Text>
          <Text style={styles.requirementItem}>• 3-32 characters</Text>
          <Text style={styles.requirementItem}>
            • Letters, numbers, underscores, and hyphens only
          </Text>
          <Text style={styles.requirementItem}>
            • Cannot be a recently released username
          </Text>
        </View>

        {/* Error */}
        {error && (
          <View style={styles.errorAlert}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* History Toggle */}
        <TouchableOpacity
          style={styles.historyToggle}
          onPress={() => {
            setShowHistory(!showHistory);
            if (!showHistory && history.length === 0) {
              loadHistory();
            }
          }}
        >
          <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.historyToggleText}>
            {showHistory ? 'Hide' : 'Show'} username history
          </Text>
        </TouchableOpacity>

        {/* History List */}
        {showHistory && (
          <View style={styles.historyContainer}>
            {loadingHistory ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : history.length === 0 ? (
              <Text style={styles.emptyHistory}>No username changes recorded</Text>
            ) : (
              history.map((item, index) => (
                <View
                  key={item.id}
                  style={[
                    styles.historyItem,
                    index === history.length - 1 && styles.historyItemLast,
                  ]}
                >
                  <View style={styles.historyNames}>
                    <Text style={styles.historyOldName}>{item.oldUsername}</Text>
                    <Text style={styles.historyArrow}>→</Text>
                    <Text style={styles.historyNewName}>{item.newUsername}</Text>
                  </View>
                  <Text style={styles.historyDate}>{formatDate(item.changedAt)}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* Buttons */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!canChange || !isAvailable || isSubmitting) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!canChange || !isAvailable || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Change Username</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={isSubmitting}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default UsernameChangeScreen;
