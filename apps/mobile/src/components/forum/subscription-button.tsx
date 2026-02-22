import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/theme-context';

type SubscriptionType = 'forum' | 'board' | 'thread';

interface SubscriptionButtonProps {
  type: SubscriptionType;
  targetId: string;
  isSubscribed: boolean;
  onToggle: () => Promise<void>;
  compact?: boolean;
  showLabel?: boolean;
}

export function SubscriptionButton({
  type,
  isSubscribed,
  onToggle,
  compact = false,
  showLabel = true,
}: SubscriptionButtonProps): React.ReactElement | null {
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = React.useState(false);

  const getLabel = () => {
    if (!showLabel) return null;
    switch (type) {
      case 'forum':
        return isSubscribed ? 'Watching Forum' : 'Watch Forum';
      case 'board':
        return isSubscribed ? 'Watching Board' : 'Watch Board';
      case 'thread':
        return isSubscribed ? 'Watching' : 'Watch';
    }
  };

  const handlePress = async () => {
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await onToggle();
      Haptics.notificationAsync(
        isSubscribed
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Success
      );
    } finally {
      setIsLoading(false);
    }
  };

  const styles = StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: compact ? 8 : 12,
      paddingVertical: compact ? 6 : 8,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: isSubscribed ? colors.primary : colors.border,
      backgroundColor: isSubscribed ? colors.primary + '15' : 'transparent',
    },
    label: {
      marginLeft: showLabel ? 6 : 0,
      fontSize: compact ? 12 : 14,
      fontWeight: '500',
      color: isSubscribed ? colors.primary : colors.text,
    },
  });

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handlePress}
      disabled={isLoading}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <>
          <Ionicons
            name={isSubscribed ? 'notifications' : 'notifications-outline'}
            size={compact ? 16 : 18}
            color={isSubscribed ? colors.primary : colors.textSecondary}
          />
          {showLabel && <Text style={styles.label}>{getLabel()}</Text>}
        </>
      )}
    </TouchableOpacity>
  );
};

export default SubscriptionButton;
