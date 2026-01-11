import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Text,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../lib/api';
import { Input, Button, Header } from '../../components';

export default function AddFriendScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSendRequest = async () => {
    const input = searchInput.trim();
    if (!input) {
      setError('Please enter a username, email, or user ID');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Determine the type of identifier
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
      const isUid = /^#?\d+$/.test(input); // UID format like #0001 or 0001
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input);
      
      let payload: { user_id?: string; username?: string; email?: string; uid?: string };
      if (isUuid) {
        payload = { user_id: input };
      } else if (isEmail) {
        payload = { email: input };
      } else if (isUid) {
        // Remove # prefix if present
        payload = { uid: input.replace('#', '').trim() };
      } else {
        payload = { username: input };
      }
      
      await api.post('/api/v1/friends', payload);
      setSuccess(true);
      setSearchInput('');
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } | string } } };
      const errorMessage = typeof error.response?.data?.error === 'object' 
        ? error.response?.data?.error?.message 
        : error.response?.data?.error;
      setError(errorMessage || 'Failed to send friend request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Add Friend"
        showBack
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.content}
      >
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            Add a Friend
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Enter your friend's username, email, or user ID (like #0001) to send them a friend request.
          </Text>

          <Input
            label="Username, Email, or User ID"
            placeholder="e.g. john_doe, john@example.com, or #0001"
            value={searchInput}
            onChangeText={(text) => {
              setSearchInput(text);
              setError('');
              setSuccess(false);
            }}
            autoCapitalize="none"
            autoCorrect={false}
            error={error}
            leftIcon="person-outline"
          />

          {success && (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>
                ✅ Friend request sent successfully!
              </Text>
            </View>
          )}

          <Button
            onPress={handleSendRequest}
            loading={loading}
            disabled={!searchInput.trim()}
            fullWidth
          >
            📨 Send Friend Request
          </Button>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>
            How to find friends
          </Text>
          <View style={styles.infoItem}>
            <Text style={[styles.infoNumber, { color: colors.primary }]}>1</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Username: Enter their @username
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={[styles.infoNumber, { color: colors.primary }]}>2</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              User ID: Enter their ID like #0001
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={[styles.infoNumber, { color: colors.primary }]}>3</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Email: Enter their email address
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    marginBottom: 24,
  },
  successContainer: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  successText: {
    color: '#22c55e',
    fontSize: 14,
    textAlign: 'center',
  },
  infoCard: {
    borderRadius: 16,
    padding: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoNumber: {
    fontSize: 16,
    fontWeight: '700',
    width: 24,
    height: 24,
    textAlign: 'center',
    lineHeight: 24,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 12,
    marginRight: 12,
  },
  infoText: {
    fontSize: 14,
    flex: 1,
  },
});
