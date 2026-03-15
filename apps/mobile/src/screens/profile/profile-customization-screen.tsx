/**
 * ProfileCustomizationScreen — single screen that wires ALL 6 customization categories
 * plus text fields & image pickers into a staged-save workflow with live preview.
 *
 * Rows (scroll):
 *   1. Display Name — TextInput
 *   2. Display Name Styles — opens NameStylePicker
 *   3. Pronouns — TextInput
 *   4. Profile Widgets — stub button → navigates to widget screen
 *   5. Avatar — Change / Remove via expo-image-picker
 *   6. Avatar Decoration — opens BorderPickerModal
 *   7. Nameplate — opens NameplatePicker
 *   8. Profile Effect — opens ProfileEffectPicker
 *   9. Profile Banner — Change / Remove via expo-image-picker
 *  10. Profile Theme — swatches + opens ProfileThemePicker
 *  11. Bio — multiline, 190 char limit
 *
 * Preview: tablet = pinned right panel · phone = floating FAB → modal
 * Save: single "Save" button, calls API for changed fields only.
 * Back navigation: "Discard changes?" prompt when dirty.
 *
 * @module screens/profile/ProfileCustomizationScreen
 */

import React, { useReducer, useCallback, useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Modal,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  Alert,
  ActivityIndicator,
  BackHandler,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { useThemeStore, useAuthStore } from '@/stores';
import api from '@/lib/api';
import {
  DEFAULT_DISPLAY_NAME_STYLE,
  type NameFont,
  type NameEffect,
} from '@cgraph/animation-constants/src/registries/displayNameStyles';
import {
  DEFAULT_PROFILE_THEME,
  type ProfileTheme,
} from '@cgraph/animation-constants/src/registries/profileThemes';

// ─── Components ──────────────────────────────────────────────────────────────

import { ProfileCard, type Badge } from '../../modules/profile/components/profile-card';
import { BottomSheet } from '@/components';

// Pickers (open as bottom sheets)
import { NameStylePicker } from '../../modules/profile/pickers/name-style-picker';
import { NameplatePicker } from '../../modules/profile/pickers/nameplate-picker';
import { ProfileEffectPicker } from '../../modules/profile/pickers/profile-effect-picker';
import { ProfileThemePicker } from '../../modules/profile/pickers/profile-theme-picker';

// Existing border picker modal (already full-screen modal)
import { BorderPickerModal } from './border-picker-modal';

// ─── State types ─────────────────────────────────────────────────────────────

interface CustomizationState {
  displayName: string;
  nameFont: NameFont;
  nameEffect: NameEffect;
  nameColor: string;
  nameSecondaryColor: string | undefined;
  pronouns: string;
  avatarUrl: string | null;
  avatarChanged: boolean;
  avatarFormData: FormData | null;
  equippedBorderId: string | undefined;
  equippedNameplateId: string | undefined;
  equippedProfileEffectId: string | undefined;
  bannerUrl: string | null;
  bannerChanged: boolean;
  bannerFormData: FormData | null;
  profileTheme: ProfileTheme;
  bio: string;
}

type Action =
  | { type: 'SET_DISPLAY_NAME'; value: string }
  | {
      type: 'SET_NAME_STYLE';
      font: NameFont;
      effect: NameEffect;
      color: string;
      secondaryColor?: string;
    }
  | { type: 'SET_PRONOUNS'; value: string }
  | { type: 'SET_AVATAR'; url: string; formData: FormData }
  | { type: 'REMOVE_AVATAR' }
  | { type: 'SET_BORDER'; id: string }
  | { type: 'SET_NAMEPLATE'; id: string }
  | { type: 'SET_PROFILE_EFFECT'; id: string }
  | { type: 'SET_BANNER'; url: string; formData: FormData }
  | { type: 'REMOVE_BANNER' }
  | { type: 'SET_THEME'; theme: ProfileTheme }
  | { type: 'SET_BIO'; value: string };

function reducer(state: CustomizationState, action: Action): CustomizationState {
  switch (action.type) {
    case 'SET_DISPLAY_NAME':
      return { ...state, displayName: action.value };
    case 'SET_NAME_STYLE':
      return {
        ...state,
        nameFont: action.font,
        nameEffect: action.effect,
        nameColor: action.color,
        nameSecondaryColor: action.secondaryColor,
      };
    case 'SET_PRONOUNS':
      return { ...state, pronouns: action.value };
    case 'SET_AVATAR':
      return {
        ...state,
        avatarUrl: action.url,
        avatarChanged: true,
        avatarFormData: action.formData,
      };
    case 'REMOVE_AVATAR':
      return { ...state, avatarUrl: null, avatarChanged: true, avatarFormData: null };
    case 'SET_BORDER':
      return { ...state, equippedBorderId: action.id };
    case 'SET_NAMEPLATE':
      return { ...state, equippedNameplateId: action.id };
    case 'SET_PROFILE_EFFECT':
      return { ...state, equippedProfileEffectId: action.id };
    case 'SET_BANNER':
      return {
        ...state,
        bannerUrl: action.url,
        bannerChanged: true,
        bannerFormData: action.formData,
      };
    case 'REMOVE_BANNER':
      return { ...state, bannerUrl: null, bannerChanged: true, bannerFormData: null };
    case 'SET_THEME':
      return { ...state, profileTheme: action.theme };
    case 'SET_BIO':
      return { ...state, bio: action.value };
    default:
      return state;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const BIO_LIMIT = 190;

/** Pick an image from the library. Returns { uri, formData } or null. */
async function pickImage(fieldName: string, aspect: [number, number] = [1, 1]) {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect,
    quality: 0.8,
  });
  if (result.canceled || !result.assets[0]) return null;

  const { uri } = result.assets[0];
  const filename = uri.split('/').pop() ?? `${fieldName}.jpg`;
  const formData = new FormData();
   
  formData.append(fieldName, { uri, name: filename, type: 'image/jpeg' } as unknown as Blob);
  return { uri, formData };
}

// ─── Screen ──────────────────────────────────────────────────────────────────
/** Profile cosmetics customization screen with staged-save workflow. */ export default function ProfileCustomizationScreen() {
  const { colors } = useThemeStore();
  const { user, updateUser } = useAuthStore();
  const navigation = useNavigation();
  const { width: screenWidth } = useWindowDimensions();
  const isTablet = screenWidth >= 768;

  // ── Initial state from current user ──────────────────────────────────────

  const initialState = useMemo<CustomizationState>(
    () => ({
      displayName: user?.display_name ?? user?.displayName ?? '',
      nameFont: DEFAULT_DISPLAY_NAME_STYLE.font,
      nameEffect: DEFAULT_DISPLAY_NAME_STYLE.effect,
      nameColor: DEFAULT_DISPLAY_NAME_STYLE.color,
      nameSecondaryColor: DEFAULT_DISPLAY_NAME_STYLE.secondaryColor,
      pronouns: '',
      avatarUrl: user?.avatar_url ?? user?.avatarUrl ?? null,
      avatarChanged: false,
      avatarFormData: null,
      equippedBorderId: user?.avatar_border_id ?? undefined,
      equippedNameplateId: undefined,
      equippedProfileEffectId: undefined,
      bannerUrl: null,
      bannerChanged: false,
      bannerFormData: null,
      profileTheme: { ...DEFAULT_PROFILE_THEME },
      bio: user?.bio ?? '',
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.id]
  );

  const [state, dispatch] = useReducer(reducer, initialState);
  const [isSaving, setIsSaving] = useState(false);

  // ── Dirty detection ──────────────────────────────────────────────────────

  const isDirty =
    state.displayName !== initialState.displayName ||
    state.nameFont !== initialState.nameFont ||
    state.nameEffect !== initialState.nameEffect ||
    state.nameColor !== initialState.nameColor ||
    state.pronouns !== initialState.pronouns ||
    state.avatarChanged ||
    state.equippedBorderId !== initialState.equippedBorderId ||
    state.equippedNameplateId !== initialState.equippedNameplateId ||
    state.equippedProfileEffectId !== initialState.equippedProfileEffectId ||
    state.bannerChanged ||
    state.profileTheme.primary !== initialState.profileTheme.primary ||
    state.profileTheme.accent !== initialState.profileTheme.accent ||
    state.bio !== initialState.bio;

  // ── Back-nav guard ───────────────────────────────────────────────────────

  useEffect(() => {
    const onBack = () => {
      if (!isDirty) return false;
      Alert.alert('Discard changes?', 'You have unsaved changes. Are you sure you want to leave?', [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
      ]);
      return true; // prevent default back
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [isDirty, navigation]);

  // ── Modal visibility ─────────────────────────────────────────────────────

  const [showPreview, setShowPreview] = useState(false);
  const [showNameStylePicker, setShowNameStylePicker] = useState(false);
  const [showBorderPicker, setShowBorderPicker] = useState(false);
  const [showNameplatePicker, setShowNameplatePicker] = useState(false);
  const [showEffectPicker, setShowEffectPicker] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handlePickAvatar = useCallback(async () => {
    const result = await pickImage('avatar', [1, 1]);
    if (result) dispatch({ type: 'SET_AVATAR', url: result.uri, formData: result.formData });
  }, []);

  const handlePickBanner = useCallback(async () => {
    const result = await pickImage('banner', [16, 9]);
    if (result) dispatch({ type: 'SET_BANNER', url: result.uri, formData: result.formData });
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      // 1. Profile text fields + cosmetic IDs
      const profilePayload: Record<string, unknown> = {};
      if (state.displayName !== initialState.displayName) {
        profilePayload.display_name = state.displayName.trim();
      }
      if (state.bio !== initialState.bio) {
        profilePayload.bio = state.bio.trim();
      }
      if (state.pronouns !== initialState.pronouns) {
        profilePayload.pronouns = state.pronouns.trim();
      }
      if (state.equippedBorderId !== initialState.equippedBorderId) {
        profilePayload.avatar_border_id = state.equippedBorderId ?? null;
      }
      if (state.equippedNameplateId !== initialState.equippedNameplateId) {
        profilePayload.equipped_nameplate_id = state.equippedNameplateId ?? null;
      }
      if (state.equippedProfileEffectId !== initialState.equippedProfileEffectId) {
        profilePayload.equipped_profile_effect_id = state.equippedProfileEffectId ?? null;
      }
      if (
        state.profileTheme.primary !== initialState.profileTheme.primary ||
        state.profileTheme.accent !== initialState.profileTheme.accent
      ) {
        profilePayload.profile_theme_primary = state.profileTheme.primary;
        profilePayload.profile_theme_accent = state.profileTheme.accent;
      }
      if (
        state.nameFont !== initialState.nameFont ||
        state.nameEffect !== initialState.nameEffect ||
        state.nameColor !== initialState.nameColor
      ) {
        profilePayload.name_font = state.nameFont;
        profilePayload.name_effect = state.nameEffect;
        profilePayload.name_color = state.nameColor;
        profilePayload.name_secondary_color = state.nameSecondaryColor ?? null;
      }

      if (Object.keys(profilePayload).length > 0) {
        const response = await api.put('/api/v1/me', profilePayload);
        updateUser(response.data.data ?? response.data);
      }

      // 2. Avatar upload / remove
      if (state.avatarChanged && state.avatarFormData) {
        const avatarRes = await api.post('/api/v1/me/avatar', state.avatarFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        updateUser(avatarRes.data.data ?? avatarRes.data);
      } else if (state.avatarChanged && !state.avatarFormData) {
        await api.delete('/api/v1/me/avatar');
      }

      // 3. Banner upload / remove
      if (state.bannerChanged && state.bannerFormData) {
        const bannerRes = await api.post('/api/v1/me/banner', state.bannerFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        updateUser(bannerRes.data.data ?? bannerRes.data);
      } else if (state.bannerChanged && !state.bannerFormData) {
        await api.delete('/api/v1/me/banner');
      }

      Alert.alert('Saved', 'Profile customization updated.');
    } catch {
      Alert.alert('Error', 'Failed to save customization. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [state, initialState, updateUser]);

  // ── Unlocked sets (stubs — in production these come from API) ────────────

  const unlockedNameplates = new Set(['plate_none', 'plate_simple_dark']);
  const unlockedEffects = new Set(['effect_none']);

  // ── Live preview ─────────────────────────────────────────────────────────

   
  const previewBadges: Badge[] = user?.badges ? (user.badges as Badge[]) : [];

  const profilePreview = (
    <View style={styles.previewWrap}>
      <ProfileCard
        user={{
          id: user?.id ?? '',
          username: user?.username ?? null,
          display_name: state.displayName || user?.display_name || user?.displayName || '',
          avatar_url: state.avatarUrl ?? undefined,
          bio: state.bio || undefined,
          status: user?.status ?? 'online',
          badges: previewBadges,
        }}
        equippedBorderId={state.equippedBorderId}
        equippedNameplateId={state.equippedNameplateId}
        equippedProfileEffectId={state.equippedProfileEffectId}
        equippedBannerUrl={state.bannerUrl ?? undefined}
        profileTheme={state.profileTheme}
        isPreview={false}
      />
    </View>
  );

  // ── Row helpers ──────────────────────────────────────────────────────────

  const renderRow = (
    icon: keyof typeof Ionicons.glyphMap,
    label: string,
    children: React.ReactNode
  ) => (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.text }]}>
        <Ionicons name={icon} size={14} color={colors.textSecondary} /> {label}
      </Text>
      {children}
    </View>
  );

  const renderActionButton = (
    icon: keyof typeof Ionicons.glyphMap,
    label: string,
    onPress: () => void,
    disabled = false
  ) => (
    <Pressable
      style={[
        styles.actionButton,
        { backgroundColor: colors.surface, borderColor: colors.border },
        disabled && { opacity: 0.5 },
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={18} color={disabled ? colors.textSecondary : colors.primary} />
      <Text
        style={[styles.actionButtonText, { color: disabled ? colors.textSecondary : colors.text }]}
      >
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
    </Pressable>
  );

  // ── Form ─────────────────────────────────────────────────────────────────

  const formContent = (
    <ScrollView
      style={styles.formScroll}
      contentContainerStyle={styles.formContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* 1 — Display Name */}
      {renderRow(
        'person-outline',
        'Display Name',
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.input, borderColor: colors.border, color: colors.text },
          ]}
          value={state.displayName}
          onChangeText={(v) => dispatch({ type: 'SET_DISPLAY_NAME', value: v })}
          placeholder="Display name"
          placeholderTextColor={colors.textTertiary}
          maxLength={50}
        />
      )}

      {/* 2 — Display Name Styles */}
      {renderRow(
        'text-outline',
        'Display Name Style',
        <View style={styles.rowButtons}>
          {renderActionButton('color-wand-outline', 'Change Style', () =>
            setShowNameStylePicker(true)
          )}
          {/* Preview swatch of current font+color */}
          <View style={[styles.stylePreview, { borderColor: colors.border }]}>
            <Text style={{ color: state.nameColor, fontSize: 13, fontWeight: '600' }}>
              {state.nameFont} / {state.nameEffect}
            </Text>
          </View>
        </View>
      )}

      {/* 3 — Pronouns */}
      {renderRow(
        'transgender-outline',
        'Pronouns',
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.input, borderColor: colors.border, color: colors.text },
          ]}
          value={state.pronouns}
          onChangeText={(v) => dispatch({ type: 'SET_PRONOUNS', value: v })}
          placeholder="e.g. they/them"
          placeholderTextColor={colors.textTertiary}
          maxLength={30}
        />
      )}

      {/* 4 — Profile Widgets (stub) */}
      {renderRow(
        'grid-outline',
        'Profile Widgets',
        renderActionButton('add-circle-outline', 'Add Widgets', () => {
          Alert.alert('Coming Soon', 'Widget editor is not yet available.');
        })
      )}

      {/* 5 — Avatar */}
      {renderRow(
        'person-circle-outline',
        'Avatar',
        <View style={styles.rowButtons}>
          {state.avatarUrl ? (
            <Image
              source={{ uri: state.avatarUrl }}
              style={[styles.avatarThumb, { borderColor: colors.border }]}
            />
          ) : null}
          {renderActionButton('camera-outline', 'Change Avatar', handlePickAvatar)}
          {state.avatarUrl ? (
            <Pressable
              style={[styles.removeButton, { borderColor: colors.error }]}
              onPress={() => dispatch({ type: 'REMOVE_AVATAR' })}
              accessibilityRole="button"
              accessibilityLabel="Remove Avatar"
            >
              <Text style={[styles.removeButtonText, { color: colors.error }]}>Remove</Text>
            </Pressable>
          ) : null}
        </View>
      )}

      {/* 6 — Avatar Decoration (Border) */}
      {renderRow(
        'ellipse-outline',
        'Avatar Decoration',
        renderActionButton(
          'color-palette-outline',
          state.equippedBorderId ? 'Change Border' : 'Choose Border',
          () => setShowBorderPicker(true)
        )
      )}

      {/* 7 — Nameplate */}
      {renderRow(
        'ribbon-outline',
        'Nameplate',
        renderActionButton(
          'pricetag-outline',
          state.equippedNameplateId ? 'Change Nameplate' : 'Choose Nameplate',
          () => setShowNameplatePicker(true)
        )
      )}

      {/* 8 — Profile Effect */}
      {renderRow(
        'sparkles-outline',
        'Profile Effect',
        renderActionButton(
          'sparkles',
          state.equippedProfileEffectId ? 'Change Effect' : 'Choose Effect',
          () => setShowEffectPicker(true)
        )
      )}

      {/* 9 — Profile Banner */}
      {renderRow(
        'image-outline',
        'Profile Banner',
        <View style={styles.rowButtons}>
          {state.bannerUrl ? (
            <Image
              source={{ uri: state.bannerUrl }}
              style={[styles.bannerThumb, { borderColor: colors.border }]}
            />
          ) : null}
          {renderActionButton('images-outline', 'Change Banner', handlePickBanner)}
          {state.bannerUrl ? (
            <Pressable
              style={[styles.removeButton, { borderColor: colors.error }]}
              onPress={() => dispatch({ type: 'REMOVE_BANNER' })}
              accessibilityRole="button"
              accessibilityLabel="Remove Banner"
            >
              <Text style={[styles.removeButtonText, { color: colors.error }]}>Remove</Text>
            </Pressable>
          ) : null}
        </View>
      )}

      {/* 10 — Profile Theme */}
      {renderRow(
        'color-fill-outline',
        'Profile Theme',
        <Pressable
          style={[styles.themeRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setShowThemePicker(true)}
          accessibilityRole="button"
          accessibilityLabel="Change profile theme"
        >
          <View style={styles.themeSwatches}>
            <View style={[styles.themeDot, { backgroundColor: state.profileTheme.primary }]} />
            <View style={[styles.themeDot, { backgroundColor: state.profileTheme.accent }]} />
          </View>
          <View style={styles.themeLabels}>
            <Text style={[styles.themeLabel, { color: colors.textSecondary }]}>
              Primary: {state.profileTheme.primary}
            </Text>
            <Text style={[styles.themeLabel, { color: colors.textSecondary }]}>
              Accent: {state.profileTheme.accent}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
        </Pressable>
      )}

      {/* 11 — Bio */}
      {renderRow(
        'document-text-outline',
        'Bio',
        <View>
          <TextInput
            style={[
              styles.input,
              styles.bioInput,
              { backgroundColor: colors.input, borderColor: colors.border, color: colors.text },
            ]}
            value={state.bio}
            onChangeText={(v) => {
              if (v.length <= BIO_LIMIT) dispatch({ type: 'SET_BIO', value: v });
            }}
            placeholder="Tell us about yourself"
            placeholderTextColor={colors.textTertiary}
            multiline
            maxLength={BIO_LIMIT}
            textAlignVertical="top"
          />
          <Text style={[styles.charCount, { color: colors.textTertiary }]}>
            {state.bio.length}/{BIO_LIMIT}
          </Text>
        </View>
      )}

      {/* Save Button */}
      <Pressable
        style={[styles.saveButton, { backgroundColor: isDirty ? colors.primary : colors.surface }]}
        onPress={handleSave}
        disabled={!isDirty || isSaving}
        accessibilityRole="button"
        accessibilityLabel="Save changes"
      >
        {isSaving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={[styles.saveButtonText, { opacity: isDirty ? 1 : 0.5 }]}>Save Changes</Text>
        )}
      </Pressable>

      {/* Navigate to Badge & Title screens */}
      <View style={styles.extraNav}>
        {renderActionButton('shield-checkmark-outline', 'Manage Badges', () => {
           
          (navigation as { navigate: (screen: string) => void }).navigate('BadgeSelection');
        })}
        {renderActionButton('trophy-outline', 'Manage Titles', () => {
           
          (navigation as { navigate: (screen: string) => void }).navigate('TitleSelection');
        })}
      </View>

      {/* Bottom spacer */}
      <View style={{ height: 60 }} />
    </ScrollView>
  );

  // ── Layout ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable
            onPress={() => {
              if (isDirty) {
                Alert.alert('Discard changes?', 'You have unsaved changes.', [
                  { text: 'Keep Editing', style: 'cancel' },
                  { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
                ]);
              } else {
                navigation.goBack();
              }
            }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Profile Cosmetics</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Body */}
        {isTablet ? (
          <View style={styles.tabletLayout}>
            <View style={styles.tabletForm}>{formContent}</View>
            <View style={[styles.tabletPreview, { borderLeftColor: colors.border }]}>
              <Text style={[styles.previewTitle, { color: colors.textSecondary }]}>
                LIVE PREVIEW
              </Text>
              {profilePreview}
            </View>
          </View>
        ) : (
          <View style={styles.flex}>
            {formContent}
            {/* FAB */}
            <Pressable
              style={[styles.previewFab, { backgroundColor: colors.primary }]}
              onPress={() => setShowPreview(true)}
              accessibilityRole="button"
              accessibilityLabel="Open preview"
            >
              <Ionicons name="eye" size={24} color="#fff" />
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* ── Modals / Bottom Sheets ─────────────────────────────────────────── */}

      {/* Phone preview */}
      {!isTablet && (
        <Modal visible={showPreview} animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={[styles.modalRoot, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalHeaderTitle, { color: colors.text }]}>Preview</Text>
              <Pressable onPress={() => setShowPreview(false)} accessibilityRole="button">
                <Text style={[styles.modalDone, { color: colors.primary }]}>Done</Text>
              </Pressable>
            </View>
            <View style={styles.previewCenter}>{profilePreview}</View>
          </SafeAreaView>
        </Modal>
      )}

      {/* Name Style Picker */}
      <BottomSheet
        visible={showNameStylePicker}
        onClose={() => setShowNameStylePicker(false)}
        snapPoint="full"
        title="Display Name Style"
      >
        <NameStylePicker
          displayName={state.displayName || 'Username'}
          equippedFont={state.nameFont}
          equippedEffect={state.nameEffect}
          equippedColor={state.nameColor}
          equippedSecondaryColor={state.nameSecondaryColor}
          onApply={(font, effect, color, sec) => {
            dispatch({ type: 'SET_NAME_STYLE', font, effect, color, secondaryColor: sec });
            setShowNameStylePicker(false);
          }}
          onClose={() => setShowNameStylePicker(false)}
        />
      </BottomSheet>

      {/* Border Picker (already a Modal) */}
      <BorderPickerModal
        visible={showBorderPicker}
        currentBorderId={state.equippedBorderId}
        onSelect={(id) => {
          dispatch({ type: 'SET_BORDER', id });
          setShowBorderPicker(false);
        }}
        onClose={() => setShowBorderPicker(false)}
      />

      {/* Nameplate Picker */}
      <BottomSheet
        visible={showNameplatePicker}
        onClose={() => setShowNameplatePicker(false)}
        snapPoint="full"
        title="Nameplate"
      >
        <NameplatePicker
          displayName={state.displayName || 'Username'}
          equippedNameplateId={state.equippedNameplateId ?? null}
          unlockedNameplateIds={unlockedNameplates}
          onApply={(id) => {
            dispatch({ type: 'SET_NAMEPLATE', id });
            setShowNameplatePicker(false);
          }}
          onGoToShop={() => {
            setShowNameplatePicker(false);
            Alert.alert('Shop', 'The shop is not yet available.');
          }}
          onClose={() => setShowNameplatePicker(false)}
        />
      </BottomSheet>

      {/* Profile Effect Picker */}
      <BottomSheet
        visible={showEffectPicker}
        onClose={() => setShowEffectPicker(false)}
        snapPoint="full"
        title="Profile Effect"
      >
        <ProfileEffectPicker
          equippedEffectId={state.equippedProfileEffectId ?? null}
          unlockedEffectIds={unlockedEffects}
          onApply={(id) => {
            dispatch({ type: 'SET_PROFILE_EFFECT', id });
            setShowEffectPicker(false);
          }}
          onGoToShop={() => {
            setShowEffectPicker(false);
            Alert.alert('Shop', 'The shop is not yet available.');
          }}
          onClose={() => setShowEffectPicker(false)}
        />
      </BottomSheet>

      {/* Profile Theme Picker */}
      <BottomSheet
        visible={showThemePicker}
        onClose={() => setShowThemePicker(false)}
        snapPoint="full"
        title="Profile Theme"
      >
        <ProfileThemePicker
          current={state.profileTheme}
          onApply={(theme) => {
            dispatch({ type: 'SET_THEME', theme });
            setShowThemePicker(false);
          }}
          onClose={() => setShowThemePicker(false)}
        />
      </BottomSheet>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },

  // Form
  formScroll: { flex: 1 },
  formContent: { padding: 16, gap: 20, paddingBottom: 100 },

  // Field rows
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15 },
  bioInput: { minHeight: 80, maxHeight: 140 },
  charCount: { fontSize: 11, textAlign: 'right', marginTop: 4 },

  // Action buttons
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionButtonText: { flex: 1, fontSize: 14, fontWeight: '500' },
  rowButtons: { gap: 8 },
  removeButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  removeButtonText: { fontSize: 13, fontWeight: '600' },

  // Name style preview
  stylePreview: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginTop: 4,
  },

  // Avatar / banner thumbnails
  avatarThumb: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, marginBottom: 4 },
  bannerThumb: {
    width: '100%',
    height: 80,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 4,
  },

  // Theme row
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  themeSwatches: { flexDirection: 'row', gap: 6 },
  themeDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  themeLabels: { flex: 1, gap: 2 },
  themeLabel: { fontSize: 11, fontFamily: 'monospace' },

  // Extra nav (badges / titles)
  extraNav: { gap: 8, marginTop: 8 },

  // Tablet layout
  tabletLayout: { flex: 1, flexDirection: 'row' },
  tabletForm: { flex: 1 },
  tabletPreview: {
    width: 380,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 16,
    borderLeftWidth: 1,
  },
  previewTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  previewWrap: { alignItems: 'center' },

  // Phone FAB
  previewFab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  // Modals
  modalRoot: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalHeaderTitle: { fontSize: 18, fontWeight: '700' },
  modalDone: { fontSize: 16, fontWeight: '600' },
  previewCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },

  // Save button
  saveButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
