/**
 * EmojiPicker - Revolutionary Emoji Selection System
 * Features:
 * - 8 categories with icons
 * - Recent emojis tracking
 * - Search functionality
 * - Skin tone selector
 * - Animated selection feedback
 * - Virtual list for performance
 */

import { durations } from '@cgraph/animation-constants';
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Animated,
  Dimensions,
  Modal,
  Image,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

import { Colors, Typography, Spacing, BorderRadius } from '@/lib/design/design-system';
import { LottieRenderer, emojiToCodepoint, getWebPFallbackUrl, preloadAnimations } from '@/lib/lottie';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type EmojiCategory =
  | 'recent'
  | 'smileys'
  | 'people'
  | 'animals'
  | 'food'
  | 'activities'
  | 'travel'
  | 'objects'
  | 'symbols';

interface EmojiPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
  anchor?: 'top' | 'bottom';
}

const EMOJI_SIZE = (SCREEN_WIDTH - 48) / 8;
const RECENT_STORAGE_KEY = 'cgraph_recent_emojis';
const MAX_RECENT = 24;

const CATEGORIES: { key: EmojiCategory; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { key: 'recent', icon: 'time', label: 'Recent' },
  { key: 'smileys', icon: 'happy', label: 'Smileys' },
  { key: 'people', icon: 'people', label: 'People' },
  { key: 'animals', icon: 'paw', label: 'Animals' },
  { key: 'food', icon: 'fast-food', label: 'Food' },
  { key: 'activities', icon: 'basketball', label: 'Activities' },
  { key: 'travel', icon: 'airplane', label: 'Travel' },
  { key: 'objects', icon: 'bulb', label: 'Objects' },
  { key: 'symbols', icon: 'heart', label: 'Symbols' },
];

const EMOJIS: Record<EmojiCategory, string[]> = {
  recent: [],
  smileys: [
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
    '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '☺️', '😚',
    '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
    '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
    '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮',
    '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎',
    '🤓', '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳',
    '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖',
    '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬',
    '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽',
  ],
  people: [
    '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞',
    '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍',
    '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝',
    '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂',
    '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅',
    '👄', '👶', '🧒', '👦', '👧', '🧑', '👱', '👨', '🧔', '👩',
    '🧓', '👴', '👵', '🙍', '🙎', '🙅', '🙆', '💁', '🙋', '🧏',
    '🙇', '🤦', '🤷', '👮', '🕵️', '💂', '🥷', '👷', '🤴', '👸',
  ],
  animals: [
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨',
    '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊',
    '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉',
    '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌',
    '🐞', '🐜', '🪰', '🪲', '🪳', '🦟', '🦗', '🕷️', '🕸️', '🦂',
    '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀',
    '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🦭', '🐊', '🐅',
    '🐆', '🦓', '🦍', '🦧', '🦣', '🐘', '🦛', '🦏', '🐪', '🐫',
  ],
  food: [
    '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐',
    '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑',
    '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅',
    '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳',
    '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔',
    '🍟', '🍕', '🫓', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗',
    '🥘', '🫕', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪',
    '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧',
  ],
  activities: [
    '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
    '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳',
    '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷',
    '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '⛹️',
    '🤺', '🤾', '🏌️', '🏇', '⛳', '🧘', '🏄', '🏊', '🤽', '🚣',
    '🧗', '🚵', '🚴', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️',
    '🎗️', '🎫', '🎟️', '🎪', '🤹', '🎭', '🩰', '🎨', '🎬', '🎤',
    '🎧', '🎼', '🎹', '🥁', '🪘', '🎷', '🎺', '🪗', '🎸', '🪕',
  ],
  travel: [
    '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐',
    '🛻', '🚚', '🚛', '🚜', '🦯', '🦽', '🦼', '🛴', '🚲', '🛵',
    '🏍️', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟',
    '🚃', '🚋', '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇',
    '🚊', '🚉', '✈️', '🛫', '🛬', '🛩️', '💺', '🛰️', '🚀', '🛸',
    '🚁', '🛶', '⛵', '🚤', '🛥️', '🛳️', '⛴️', '🚢', '⚓', '🪝',
    '⛽', '🚧', '🚦', '🚥', '🚏', '🗺️', '🗿', '🗽', '🗼', '🏰',
    '🏯', '🏟️', '🎡', '🎢', '🎠', '⛲', '⛱️', '🏖️', '🏝️', '🏜️',
  ],
  objects: [
    '⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️',
    '🗜️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥',
    '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️',
    '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋',
    '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴',
    '💶', '💷', '🪙', '💰', '💳', '💎', '⚖️', '🪜', '🧰', '🪛',
    '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🪚', '🔩', '⚙️', '🪤', '🧱',
    '⛓️', '🧲', '🔫', '💣', '🧨', '🪓', '🔪', '🗡️', '⚔️', '🛡️',
  ],
  symbols: [
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
    '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
    '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐',
    '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐',
    '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳',
    '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️',
    '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️',
    '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️',
  ],
};

const SKIN_TONES = ['👋', '👋🏻', '👋🏼', '👋🏽', '👋🏾', '👋🏿'];

/**
 *
 */
export default function EmojiPicker({
  visible,
  onClose,
  onSelectEmoji,
  anchor = 'bottom',
}: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState<EmojiCategory>('smileys');
  const [searchQuery, setSearchQuery] = useState('');
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const [skinTone, setSkinTone] = useState(0);
  const [showSkinTones, setShowSkinTones] = useState(false);

  const [longPressEmoji, setLongPressEmoji] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(anchor === 'bottom' ? 300 : -300)).current;

  // Load recent emojis
  useEffect(() => {
    loadRecentEmojis();
  }, []);

  // Animation
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: durations.normal.ms,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: durations.fast.ms,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: anchor === 'bottom' ? 300 : -300,
          duration: durations.fast.ms,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, anchor]);

  const loadRecentEmojis = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_STORAGE_KEY);
      if (stored) {
        setRecentEmojis(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load recent emojis:', error);
    }
  };

  const saveRecentEmoji = async (emoji: string) => {
    try {
      const updated = [emoji, ...recentEmojis.filter(e => e !== emoji)].slice(0, MAX_RECENT);
      setRecentEmojis(updated);
      await AsyncStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save recent emoji:', error);
    }
  };

  const handleSelectEmoji = useCallback(
    (emoji: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      saveRecentEmoji(emoji);
      onSelectEmoji(emoji);
    },
    [onSelectEmoji]
  );

  const handleCategoryChange = useCallback((category: EmojiCategory) => {
    Haptics.selectionAsync();
    setActiveCategory(category);
    setSearchQuery('');
  }, []);

  /** Long-press to preview Lottie animation */
  const handleLongPress = useCallback((emoji: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLongPressEmoji(emoji);
  }, []);

  /** Preload first visible emojis on open */
  useEffect(() => {
    if (visible && filteredEmojis.length > 0) {
      const first30 = filteredEmojis.slice(0, 30);
      const codepoints = first30.map((e) => emojiToCodepoint(e)).filter(Boolean);
      preloadAnimations(codepoints);
    }
  }, [visible, activeCategory]);

  const filteredEmojis = useMemo(() => {
    let emojis = activeCategory === 'recent' ? recentEmojis : EMOJIS[activeCategory];

    if (searchQuery) {
      // Search across all categories
      emojis = Object.values(EMOJIS)
        .flat()
        .filter(emoji => emoji.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    return emojis;
  }, [activeCategory, searchQuery, recentEmojis]);

  const renderEmoji = useCallback(
    ({ item }: { item: string }) => {
      const cp = emojiToCodepoint(item);
      return (
        <TouchableOpacity
          style={styles.emojiButton}
          onPress={() => handleSelectEmoji(item)}
          onLongPress={() => handleLongPress(item)}
          delayLongPress={350}
          activeOpacity={0.6}
        >
          <Image
            source={{ uri: getWebPFallbackUrl(cp, 512) }}
            style={{ width: 28, height: 28 }}
            resizeMode="contain"
            defaultSource={{ uri: '' }}
          />
        </TouchableOpacity>
      );
    },
    [handleSelectEmoji, handleLongPress]
  );

  const renderCategory = useCallback(
    (category: typeof CATEGORIES[0]) => {
      const isActive = activeCategory === category.key;
      return (
        <TouchableOpacity
          key={category.key}
          style={[styles.categoryButton, isActive && styles.categoryButtonActive]}
          onPress={() => handleCategoryChange(category.key)}
        >
          <Ionicons
            name={category.icon}
            size={22}
            color={isActive ? Colors.primary[500] : Colors.dark[400]}
          />
          {isActive && <View style={styles.categoryIndicator} />}
        </TouchableOpacity>
      );
    },
    [activeCategory, handleCategoryChange]
  );

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <Animated.View
          style={[
            styles.container,
            anchor === 'top' && styles.containerTop,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity activeOpacity={1}>
            <BlurView intensity={80} tint="dark" style={styles.blurView}>
              {/* Header with search */}
              <View style={styles.header}>
                <View style={styles.searchContainer}>
                  <Ionicons name="search" size={18} color={Colors.dark[400]} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search emojis..."
                    placeholderTextColor={Colors.dark[500]}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <Ionicons name="close-circle" size={18} color={Colors.dark[400]} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Skin tone selector */}
                <TouchableOpacity
                  style={styles.skinToneButton}
                  onPress={() => setShowSkinTones(!showSkinTones)}
                >
                  <Text style={styles.skinToneEmoji}>{SKIN_TONES[skinTone]}</Text>
                </TouchableOpacity>
              </View>

              {/* Skin tone popup */}
              {showSkinTones && (
                <View style={styles.skinTonePopup}>
                  {SKIN_TONES.map((tone, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.skinToneOption, skinTone === index && styles.skinToneOptionActive]}
                      onPress={() => {
                        setSkinTone(index);
                        setShowSkinTones(false);
                        Haptics.selectionAsync();
                      }}
                    >
                      <Text style={styles.skinToneEmoji}>{tone}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Category tabs */}
              <View style={styles.categoryBar}>{CATEGORIES.map(renderCategory)}</View>

              {/* Category label */}
              <Text style={styles.categoryLabel}>
                {CATEGORIES.find(c => c.key === activeCategory)?.label || 'Emojis'}
              </Text>

              {/* Emoji grid */}
              <FlatList
                data={filteredEmojis}
                renderItem={renderEmoji}
                keyExtractor={(item, index) => `${item}-${index}`}
                numColumns={8}
                style={styles.emojiGrid}
                contentContainerStyle={styles.emojiGridContent}
                showsVerticalScrollIndicator={false}
                initialNumToRender={40}
                maxToRenderPerBatch={40}
                windowSize={5}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>
                      {activeCategory === 'recent' ? 'No recent emojis' : 'No emojis found'}
                    </Text>
                  </View>
                }
              />
            </BlurView>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>

      {/* Lottie long-press preview overlay */}
      {longPressEmoji && (
        <TouchableOpacity
          style={styles.lottiePreviewOverlay}
          activeOpacity={1}
          onPress={() => setLongPressEmoji(null)}
        >
          <View style={styles.lottiePreviewCard}>
            <LottieRenderer
              emoji={longPressEmoji}
              size={120}
              autoplay
              loop
            />
            <Text style={styles.lottiePreviewEmoji}>{longPressEmoji}</Text>
          </View>
        </TouchableOpacity>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    maxHeight: SCREEN_HEIGHT * 0.5,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    overflow: 'hidden',
  },
  containerTop: {
    justifyContent: 'flex-start',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: BorderRadius['2xl'],
    borderBottomRightRadius: BorderRadius['2xl'],
  },
  blurView: {
    paddingBottom: Spacing[4],
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[2],
    gap: Spacing[3],
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark[800],
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    gap: Spacing[2],
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.dark[50],
    paddingVertical: 0,
  },
  skinToneButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark[800],
    alignItems: 'center',
    justifyContent: 'center',
  },
  skinToneEmoji: {
    fontSize: 22,
  },

  // Skin tone popup
  skinTonePopup: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing[2],
    paddingVertical: Spacing[2],
    marginHorizontal: Spacing[4],
    backgroundColor: Colors.dark[800],
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing[2],
  },
  skinToneOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skinToneOptionActive: {
    backgroundColor: Colors.primary[500] + '30',
  },

  // Category bar
  categoryBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark[700],
  },
  categoryButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing[2],
    position: 'relative',
  },
  categoryButtonActive: {},
  categoryIndicator: {
    position: 'absolute',
    bottom: -2,
    width: 24,
    height: 2,
    backgroundColor: Colors.primary[500],
    borderRadius: 1,
  },

  // Category label
  categoryLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.dark[400],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Emoji grid
  emojiGrid: {
    maxHeight: SCREEN_HEIGHT * 0.35,
  },
  emojiGridContent: {
    paddingHorizontal: Spacing[3],
    paddingBottom: Spacing[4],
  },
  emojiButton: {
    width: EMOJI_SIZE,
    height: EMOJI_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 28,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[8],
  },
  emptyText: {
    fontSize: Typography.fontSize.base,
    color: Colors.dark[500],
  },

  // Lottie preview overlay
  lottiePreviewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  lottiePreviewCard: {
    backgroundColor: Colors.dark[800],
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[6],
    alignItems: 'center',
    gap: Spacing[3],
  },
  lottiePreviewEmoji: {
    fontSize: 14,
    color: Colors.dark[400],
  },
});
