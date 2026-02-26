import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Animated, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';

interface Props {
  email: string;
  setEmail: (text: string) => void;
  username: string;
  setUsername: (text: string) => void;
  password: string;
  setPassword: (text: string) => void;
  confirmPassword: string;
  setConfirmPassword: (text: string) => void;
  agreedToTerms: boolean;
  setAgreedToTerms: (v: boolean) => void;
  focusedField: string | null;
  setFocusedField: (f: string | null) => void;
  fadeAnims: Animated.Value[];
  translateYAnims: Animated.Value[];
}

export function RegisterFormFields({
  email, setEmail, username, setUsername,
  password, setPassword, confirmPassword, setConfirmPassword,
  agreedToTerms, setAgreedToTerms, focusedField, setFocusedField,
  fadeAnims, translateYAnims,
}: Props) {
  const gradientColors = (field: string): [string, string] =>
    focusedField === field
      ? ['rgba(17, 24, 39, 0.9)', 'rgba(5, 46, 22, 0.4)']
      : ['rgba(17, 24, 39, 0.9)', 'rgba(5, 46, 22, 0.2)'];

  return (
    <>
      {/* Email */}
      <Animated.View style={[styles.inputGroup, { opacity: fadeAnims[1], transform: [{ translateY: translateYAnims[1] }] }]}>
        <Text style={styles.label}>Email</Text>
        <LinearGradient colors={gradientColors('email')} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[styles.inputGradient, focusedField === 'email' && styles.inputFocused]}>
          <TextInput style={styles.input} placeholder="you@example.com" placeholderTextColor="#6b7280"
            value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"
            autoCorrect={false} onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)} />
        </LinearGradient>
      </Animated.View>

      {/* Username */}
      <Animated.View style={[styles.inputGroup, { opacity: fadeAnims[2], transform: [{ translateY: translateYAnims[2] }] }]}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Username</Text>
          <Text style={styles.labelHint}>(Optional)</Text>
        </View>
        <LinearGradient colors={gradientColors('username')} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[styles.inputGradient, focusedField === 'username' && styles.inputFocused]}>
          <TextInput style={styles.input} placeholder="Choose a username" placeholderTextColor="#6b7280"
            value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} maxLength={30}
            onFocus={() => setFocusedField('username')} onBlur={() => setFocusedField(null)} />
        </LinearGradient>
        <Text style={styles.inputHint}>You can set this later. Can be changed every 14 days.</Text>
      </Animated.View>

      {/* Password */}
      <Animated.View style={[styles.inputGroup, { opacity: fadeAnims[3], transform: [{ translateY: translateYAnims[3] }] }]}>
        <Text style={styles.label}>Password</Text>
        <LinearGradient colors={gradientColors('password')} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[styles.inputGradient, focusedField === 'password' && styles.inputFocused]}>
          <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor="#6b7280"
            value={password} onChangeText={setPassword} secureTextEntry
            onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)} />
        </LinearGradient>
        <Text style={styles.inputHint}>Min 8 characters with uppercase, lowercase, number, and special character</Text>
      </Animated.View>

      {/* Confirm Password */}
      <Animated.View style={[styles.inputGroup, { opacity: fadeAnims[4], transform: [{ translateY: translateYAnims[4] }] }]}>
        <Text style={styles.label}>Confirm Password</Text>
        <LinearGradient colors={gradientColors('confirm')} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[styles.inputGradient, focusedField === 'confirm' && styles.inputFocused]}>
          <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor="#6b7280"
            value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry
            onFocus={() => setFocusedField('confirm')} onBlur={() => setFocusedField(null)} />
        </LinearGradient>
      </Animated.View>

      {/* Terms */}
      <Animated.View style={[styles.termsRow, { opacity: fadeAnims[5], transform: [{ translateY: translateYAnims[5] }] }]}>
        <TouchableOpacity style={styles.termsRowInner} onPress={() => setAgreedToTerms(!agreedToTerms)} activeOpacity={0.7}>
          <View style={[styles.checkbox, {
            borderColor: agreedToTerms ? '#10b981' : 'rgba(55, 65, 81, 0.8)',
            backgroundColor: agreedToTerms ? '#10b981' : 'transparent',
          }]}>
            {agreedToTerms && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
          <Text style={styles.termsText}>
            I agree to the{' '}
            <Text style={styles.termsLink} onPress={() => Linking.openURL('https://cgraph.org/terms')}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={styles.termsLink} onPress={() => Linking.openURL('https://cgraph.org/privacy')}>Privacy Policy</Text>
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </>
  );
}
