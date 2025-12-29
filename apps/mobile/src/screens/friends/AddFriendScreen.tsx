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
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSendRequest = async () => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await api.post('/api/v1/friends', { user_id: username.trim() });
      setSuccess(true);
      setUsername('');
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to send friend request');
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
            Enter your friend's username to send them a friend request.
          </Text>

          <Input
            label="Username"
            placeholder="Enter username"
            value={username}
            onChangeText={(text) => {
              setUsername(text);
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
                Friend request sent successfully!
              </Text>
            </View>
          )}

          <Button
            onPress={handleSendRequest}
            loading={loading}
            disabled={!username.trim()}
            fullWidth
          >
            Send Friend Request
          </Button>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>
            How it works
          </Text>
          <View style={styles.infoItem}>
            <Text style={[styles.infoNumber, { color: colors.primary }]}>1</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Enter your friend's username
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={[styles.infoNumber, { color: colors.primary }]}>2</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              They'll receive a friend request notification
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={[styles.infoNumber, { color: colors.primary }]}>3</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Once accepted, you can start chatting!
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
