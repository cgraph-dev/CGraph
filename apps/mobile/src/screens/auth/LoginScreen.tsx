import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { AuthStackParamList } from '../../types';
import { OAuthButtonGroup, AuthDivider } from '../../components/OAuthButtons';
import { MatrixAuthBackground } from '../../components/matrix';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { login } = useAuth();
  
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email/username and password');
      return;
    }
    
    setIsLoading(true);
    try {
      await login(identifier, password);
    } catch (error: unknown) {
      // Backend returns errors in multiple formats:
      // - {error: "message"} for simple errors
      // - {error: {message: "..."}} for complex errors  
      // - {error: "...", message: "...", details: {...}} for validation
      // - Network errors have no response
      const err = error as { 
        response?: { data?: { error?: string | { message?: string }; message?: string; details?: Record<string, string[]> } };
        message?: string;
      };
      
      let errorMessage = 'Invalid credentials';
      
      if (err.response?.data) {
        const data = err.response.data;
        // Check for validation details first (most specific)
        if (data.details && typeof data.details === 'object') {
          const firstField = Object.keys(data.details)[0];
          if (firstField && Array.isArray(data.details[firstField])) {
            errorMessage = `${firstField}: ${data.details[firstField][0]}`;
          }
        } else if (typeof data.error === 'object' && data.error?.message) {
          // Complex error object
          errorMessage = data.error.message;
        } else if (typeof data.error === 'string') {
          // Simple error string
          errorMessage = data.error;
        } else if (data.message) {
          // Fallback to message field
          errorMessage = data.message;
        }
      } else if (err.message?.includes('Network')) {
        // Network connectivity issue
        errorMessage = 'Unable to connect to server. Please check your internet connection.';
      }
      
      // Log for debugging in development
      if (__DEV__) {
        console.log('Login error:', JSON.stringify(err.response?.data || err.message, null, 2));
      }
      
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Matrix Background Effect */}
      <MatrixAuthBackground theme="matrix-green" />
      
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.logo, { color: colors.primary }]}>CGraph</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Welcome back
              </Text>
            </View>
            
            {/* Form Container with glassmorphism effect */}
            <View style={[styles.formContainer, { 
              backgroundColor: 'rgba(31, 41, 55, 0.85)', 
              borderColor: colors.border 
            }]}>
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Email or Username</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.input,
                        borderColor: colors.border,
                        color: colors.text,
                      },
                    ]}
                    placeholder="Enter email or username"
                    placeholderTextColor={colors.textTertiary}
                    value={identifier}
                    onChangeText={setIdentifier}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Password</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.input,
                        borderColor: colors.border,
                        color: colors.text,
                      },
                    ]}
                    placeholder="Enter your password"
                    placeholderTextColor={colors.textTertiary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>
                
                <TouchableOpacity
                  onPress={() => navigation.navigate('ForgotPassword')}
                >
                  <Text style={[styles.forgotPassword, { color: colors.primary }]}>
                    Forgot password?
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: colors.primary }]}
                  onPress={handleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Sign In</Text>
                  )}
                </TouchableOpacity>
                
                {/* OAuth Divider and Buttons */}
                <AuthDivider text="or sign in with" />
                
                <OAuthButtonGroup
                  variant="icon"
                  providers={['google', 'apple', 'facebook', 'tiktok']}
                  onSuccess={() => {
                    // Auth context will handle navigation
                  }}
                  onError={(error) => {
                    if (!error.message.includes('cancelled')) {
                      console.error('OAuth error:', error);
                    }
                  }}
                />
              </View>
            </View>
            
            {/* Footer */}
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                Don't have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={[styles.footerLink, { color: colors.primary }]}>
                  Sign up
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 8,
    textShadowColor: 'rgba(99, 102, 241, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 18,
  },
  formContainer: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  forgotPassword: {
    fontSize: 14,
    textAlign: 'right',
    fontWeight: '500',
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});
