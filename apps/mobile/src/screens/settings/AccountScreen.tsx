import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { SettingsStackParamList } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, 'Account'>;
};

export default function AccountScreen({ navigation: _navigation }: Props) {
  const { colors } = useTheme();
  const { user } = useAuth();
  
  const handleChangePassword = () => {
    Alert.alert('Change Password', 'This will send a password reset link to your email.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send Link',
        onPress: () => {
          // API call to send password reset email
          Alert.alert('Success', 'Password reset link sent to your email.');
        },
      },
    ]);
  };
  
  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Show confirmation
            Alert.alert('Confirm Delete', 'Type "DELETE" to confirm', [
              { text: 'Cancel', style: 'cancel' },
            ]);
          },
        },
      ]
    );
  };
  
  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Email Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Email</Text>
        <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={22} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.text }]}>{user?.email}</Text>
          </View>
        </View>
      </View>
      
      {/* Security Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Security</Text>
        <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
          <TouchableOpacity style={styles.settingsItem} onPress={handleChangePassword}>
            <Ionicons name="key-outline" size={22} color={colors.textSecondary} />
            <Text style={[styles.settingsItemText, { color: colors.text }]}>
              Change Password
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
          
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <TouchableOpacity style={styles.settingsItem}>
            <Ionicons name="phone-portrait-outline" size={22} color={colors.textSecondary} />
            <Text style={[styles.settingsItemText, { color: colors.text }]}>
              Two-Factor Authentication
            </Text>
            <View style={[styles.badge, { backgroundColor: colors.surfaceHover }]}>
              <Text style={[styles.badgeText, { color: colors.textSecondary }]}>Off</Text>
            </View>
          </TouchableOpacity>
          
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <TouchableOpacity style={styles.settingsItem}>
            <Ionicons name="desktop-outline" size={22} color={colors.textSecondary} />
            <Text style={[styles.settingsItemText, { color: colors.text }]}>
              Active Sessions
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Connected Accounts */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Connected Accounts
        </Text>
        <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
          <TouchableOpacity style={styles.settingsItem}>
            <Ionicons name="wallet-outline" size={22} color={colors.textSecondary} />
            <View style={styles.connectedInfo}>
              <Text style={[styles.settingsItemText, { color: colors.text }]}>
                Wallet
              </Text>
              {user?.wallet_address ? (
                <Text style={[styles.connectedValue, { color: colors.textSecondary }]}>
                  {user.wallet_address.slice(0, 6)}...{user.wallet_address.slice(-4)}
                </Text>
              ) : (
                <Text style={[styles.connectedValue, { color: colors.textTertiary }]}>
                  Not connected
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Danger Zone */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.error }]}>Danger Zone</Text>
        <TouchableOpacity
          style={[styles.dangerButton, { backgroundColor: colors.surface }]}
          onPress={handleDeleteAccount}
        >
          <Ionicons name="trash-outline" size={22} color={colors.error} />
          <Text style={[styles.dangerButtonText, { color: colors.error }]}>
            Delete Account
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionContent: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 16,
    marginLeft: 12,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingsItemText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  connectedInfo: {
    flex: 1,
    marginLeft: 12,
  },
  connectedValue: {
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 50,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
});
