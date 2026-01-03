import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  TextInput,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { SettingsStackParamList } from '../../types';
import api from '../../lib/api';
import {
  getBiometricStatus,
  getBiometricName,
  isBiometricLockEnabled,
  setBiometricLockEnabled,
  type BiometricStatus,
} from '../../lib/biometrics';

type Props = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, 'Account'>;
};

export default function AccountScreen({ navigation: _navigation }: Props) {
  const { colors } = useTheme();
  const { user, logout } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Biometric authentication state
  const [biometricStatus, setBiometricStatus] = useState<BiometricStatus | null>(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [isTogglingBiometric, setIsTogglingBiometric] = useState(false);
  
  // Load biometric status on mount
  useEffect(() => {
    const loadBiometricStatus = async () => {
      const status = await getBiometricStatus();
      setBiometricStatus(status);
      if (status.isAvailable && status.isEnrolled) {
        const enabled = await isBiometricLockEnabled();
        setBiometricEnabled(enabled);
      }
    };
    loadBiometricStatus();
  }, []);
  
  // Handle biometric toggle
  const handleBiometricToggle = useCallback(async (value: boolean) => {
    if (!biometricStatus?.isAvailable) {
      Alert.alert('Not Available', 'Biometric authentication is not available on this device.');
      return;
    }
    
    if (!biometricStatus?.isEnrolled) {
      Alert.alert(
        'Setup Required',
        `Please set up ${getBiometricName(biometricStatus.biometricType)} in your device settings first.`
      );
      return;
    }
    
    setIsTogglingBiometric(true);
    try {
      const success = await setBiometricLockEnabled(value);
      if (success) {
        setBiometricEnabled(value);
        Alert.alert(
          'Success',
          value
            ? `${getBiometricName(biometricStatus.biometricType)} lock enabled.`
            : 'Biometric lock disabled.'
        );
      } else {
        Alert.alert('Cancelled', 'Biometric authentication was cancelled.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update biometric settings.');
    } finally {
      setIsTogglingBiometric(false);
    }
  }, [biometricStatus]);
  
  const handleChangePassword = () => {
    Alert.alert('Change Password', 'This will send a password reset link to your email.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send Link',
        onPress: async () => {
          try {
            await api.post('/api/v1/auth/forgot-password', { email: user?.email });
            Alert.alert('Success', 'Password reset link sent to your email.');
          } catch {
            Alert.alert('Error', 'Failed to send password reset link. Please try again.');
          }
        },
      },
    ]);
  };

  // GDPR Data Export - Required for app store compliance
  const handleExportData = async () => {
    Alert.alert(
      'Export Your Data',
      'We will prepare a download of all your personal data. This may take a few minutes.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: async () => {
            setIsExporting(true);
            try {
              const response = await api.get('/api/v1/me/data-export');
              const data = response.data.data || response.data;
              // In a real app, you'd save this to a file or send via email
              Alert.alert(
                'Export Complete',
                `Your data export is ready. It includes ${Object.keys(data).length} data categories.`,
                [{ text: 'OK' }]
              );
            } catch {
              Alert.alert('Error', 'Failed to export data. Please try again later.');
            } finally {
              setIsExporting(false);
            }
          },
        },
      ]
    );
  };
  
  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => setShowDeleteConfirm(true),
        },
      ]
    );
  };

  const confirmDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      Alert.alert('Error', 'Please type DELETE to confirm account deletion.');
      return;
    }

    setIsDeleting(true);
    try {
      await api.delete('/api/v1/me');
      Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
      await logout();
    } catch {
      Alert.alert('Error', 'Failed to delete account. Please contact support.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
    }
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://cgraph.org/privacy');
  };

  const openTermsOfService = () => {
    Linking.openURL('https://cgraph.org/terms');
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
          
          {/* Biometric Authentication */}
          {biometricStatus && biometricStatus.isAvailable && (
            <>
              <View style={styles.settingsItemRow}>
                <Ionicons 
                  name={biometricStatus.biometricType === 'facial' ? 'scan-outline' : 'finger-print-outline'} 
                  size={22} 
                  color={colors.textSecondary} 
                />
                <View style={styles.settingsItemContent}>
                  <Text style={[styles.settingsItemText, { color: colors.text }]}>
                    {getBiometricName(biometricStatus.biometricType)}
                  </Text>
                  <Text style={[styles.settingsItemSubtext, { color: colors.textTertiary }]}>
                    {biometricStatus.isEnrolled 
                      ? 'Require biometric to access app'
                      : 'Set up in device settings first'}
                  </Text>
                </View>
                {isTogglingBiometric ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Switch
                    value={biometricEnabled}
                    onValueChange={handleBiometricToggle}
                    trackColor={{ false: colors.surfaceHover, true: colors.primary }}
                    thumbColor="#fff"
                    disabled={!biometricStatus.isEnrolled}
                  />
                )}
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
            </>
          )}
          
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

      {/* Data & Privacy - Required for App Store compliance */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Data & Privacy</Text>
        <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
          <TouchableOpacity style={styles.settingsItem} onPress={handleExportData} disabled={isExporting}>
            {isExporting ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="download-outline" size={22} color={colors.textSecondary} />
            )}
            <Text style={[styles.settingsItemText, { color: colors.text }]}>
              Export My Data
            </Text>
            <Text style={[styles.settingsItemHint, { color: colors.textTertiary }]}>GDPR</Text>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <TouchableOpacity style={styles.settingsItem} onPress={openPrivacyPolicy}>
            <Ionicons name="shield-outline" size={22} color={colors.textSecondary} />
            <Text style={[styles.settingsItemText, { color: colors.text }]}>
              Privacy Policy
            </Text>
            <Ionicons name="open-outline" size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <TouchableOpacity style={styles.settingsItem} onPress={openTermsOfService}>
            <Ionicons name="document-text-outline" size={22} color={colors.textSecondary} />
            <Text style={[styles.settingsItemText, { color: colors.text }]}>
              Terms of Service
            </Text>
            <Ionicons name="open-outline" size={18} color={colors.textTertiary} />
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Confirm Deletion</Text>
            <Text style={[styles.modalText, { color: colors.textSecondary }]}>
              This will permanently delete your account and all associated data. 
              Type DELETE to confirm.
            </Text>
            <TextInput
              style={[styles.confirmInput, { 
                backgroundColor: colors.background, 
                color: colors.text,
                borderColor: colors.border 
              }]}
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              placeholder="Type DELETE"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="characters"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.background }]}
                onPress={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText('');
                }}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.error }]}
                onPress={confirmDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[styles.modalButtonText, { color: '#fff' }]}>Delete Forever</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
  settingsItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingsItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  settingsItemText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  settingsItemSubtext: {
    fontSize: 12,
    marginTop: 2,
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
  settingsItemHint: {
    fontSize: 11,
    fontWeight: '600',
    marginRight: 4,
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
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  confirmInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
