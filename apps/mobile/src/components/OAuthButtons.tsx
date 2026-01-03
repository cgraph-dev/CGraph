/**
 * OAuth Button Components for React Native
 * Social login buttons for Google, Apple, Facebook, and TikTok
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { Svg, Path, Circle, G } from 'react-native-svg';
import {
  OAuthProvider,
  signInWithOAuth,
  OAuthConfig,
  providerInfo,
  OAuthResult,
} from '../lib/oauth';
import { useTheme } from '../contexts/ThemeContext';

// OAuth configuration - should be loaded from environment/config
const oauthConfig: OAuthConfig = {
  google: {
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '',
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  },
  apple: {
    enabled: Platform.OS === 'ios',
  },
  facebook: {
    appId: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || '',
  },
  tiktok: {
    clientKey: process.env.EXPO_PUBLIC_TIKTOK_CLIENT_KEY || '',
  },
};

// Google Icon
const GoogleIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <Path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <Path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <Path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </Svg>
);

// Apple Icon
const AppleIcon = ({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </Svg>
);

// Facebook Icon
const FacebookIcon = ({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </Svg>
);

// TikTok Icon
const TikTokIcon = ({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </Svg>
);

const providerIcons: Record<OAuthProvider, React.FC<{ size?: number; color?: string }>> = {
  google: GoogleIcon,
  apple: AppleIcon,
  facebook: FacebookIcon,
  tiktok: TikTokIcon,
};

interface OAuthButtonProps {
  provider: OAuthProvider;
  onSuccess?: (result: OAuthResult) => void;
  onError?: (error: Error) => void;
  variant?: 'full' | 'icon';
  style?: object;
}

/**
 * Individual OAuth login button
 */
export function OAuthButton({
  provider,
  onSuccess,
  onError,
  variant = 'full',
  style,
}: OAuthButtonProps) {
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  
  const info = providerInfo[provider];
  const Icon = providerIcons[provider];
  
  // Skip Apple on non-iOS platforms
  if (provider === 'apple' && Platform.OS !== 'ios') {
    return null;
  }
  
  const handlePress = async () => {
    setIsLoading(true);
    
    try {
      const result = await signInWithOAuth(provider, oauthConfig);
      onSuccess?.(result);
    } catch (error) {
      console.error(`OAuth ${provider} error:`, error);
      const err = error instanceof Error ? error : new Error('OAuth failed');
      
      if (!err.message.includes('cancelled')) {
        Alert.alert('Sign In Failed', err.message);
      }
      
      onError?.(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (variant === 'icon') {
    return (
      <TouchableOpacity
        style={[
          styles.iconButton,
          {
            backgroundColor: info.color,
            borderColor: provider === 'google' ? colors.border : 'transparent',
            borderWidth: provider === 'google' ? 1 : 0,
          },
          style,
        ]}
        onPress={handlePress}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={info.textColor} />
        ) : (
          <Icon size={24} color={info.textColor} />
        )}
      </TouchableOpacity>
    );
  }
  
  return (
    <TouchableOpacity
      style={[
        styles.fullButton,
        {
          backgroundColor: info.color,
          borderColor: provider === 'google' ? colors.border : 'transparent',
          borderWidth: provider === 'google' ? 1 : 0,
        },
        style,
      ]}
      onPress={handlePress}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={info.textColor} />
      ) : (
        <>
          <Icon size={20} color={info.textColor} />
          <Text style={[styles.buttonText, { color: info.textColor }]}>
            Continue with {info.name}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

interface OAuthButtonGroupProps {
  onSuccess?: (result: OAuthResult) => void;
  onError?: (error: Error) => void;
  providers?: OAuthProvider[];
  variant?: 'full' | 'icon';
  style?: object;
}

/**
 * Group of OAuth buttons
 */
export function OAuthButtonGroup({
  onSuccess,
  onError,
  providers = ['google', 'apple', 'facebook', 'tiktok'],
  variant = 'full',
  style,
}: OAuthButtonGroupProps) {
  // Filter out Apple on non-iOS
  const filteredProviders = providers.filter(
    (p) => p !== 'apple' || Platform.OS === 'ios'
  );
  
  if (variant === 'icon') {
    return (
      <View style={[styles.iconGroup, style]}>
        {filteredProviders.map((provider) => (
          <OAuthButton
            key={provider}
            provider={provider}
            variant="icon"
            onSuccess={onSuccess}
            onError={onError}
          />
        ))}
      </View>
    );
  }
  
  return (
    <View style={[styles.fullGroup, style]}>
      {filteredProviders.map((provider) => (
        <OAuthButton
          key={provider}
          provider={provider}
          variant="full"
          onSuccess={onSuccess}
          onError={onError}
        />
      ))}
    </View>
  );
}

/**
 * Divider with "or" text
 */
export function AuthDivider({ text = 'or continue with' }: { text?: string }) {
  const { colors } = useTheme();
  
  return (
    <View style={styles.divider}>
      <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
      <Text style={[styles.dividerText, { color: colors.textSecondary }]}>
        {text}
      </Text>
      <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  iconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  fullGroup: {
    gap: 12,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
  },
});

export default OAuthButtonGroup;
