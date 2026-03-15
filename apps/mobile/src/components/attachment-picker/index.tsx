/**
 * AttachmentPicker - Media attachment picker
 *
 * Features:
 * - Gallery browsing with album selection
 * - Camera integration for photos/videos
 * - Document/file picker
 * - Contact sharing
 * - Multi-select with visual feedback
 */

import { durations } from '@cgraph/animation-constants';
import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  View,
  Modal,
  Animated,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as MediaLibrary from 'expo-media-library';
import * as Contacts from 'expo-contacts';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/stores';

import { Asset, SelectedAsset, TabType, AttachmentPickerProps } from './types';
import { styles } from './styles';
import {
  MediaTile,
  CameraTile,
  AlbumPicker,
  ContactPicker,
  TabBar,
  Header,
  FallbackView,
} from './components';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const AttachmentPicker = memo(
  ({ visible, onClose, onSelectAssets, maxSelection = 10 }: AttachmentPickerProps) => {
    const { colors, colorScheme } = useThemeStore();
    const isDark = colorScheme === 'dark';

    // State
    const [activeTab, setActiveTab] = useState<TabType>('gallery');
    const [assets, setAssets] = useState<Asset[]>([]);
    const [selectedAssets, setSelectedAssets] = useState<Map<string, Asset>>(new Map());
    const [_hasMediaPermission, setHasMediaPermission] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [useImagePickerFallback, setUseImagePickerFallback] = useState(false);
    const [showContactPicker, setShowContactPicker] = useState(false);
    const [contacts, setContacts] = useState<(Contacts.Contact & { id: string })[]>([]);
    const [contactSearchQuery, _setContactSearchQuery] = useState('');
    const [albums, setAlbums] = useState<MediaLibrary.Album[]>([]);
    const [selectedAlbum, setSelectedAlbum] = useState<MediaLibrary.Album | null>(null);
    const [showAlbumPicker, setShowAlbumPicker] = useState(false);

    // Animation refs
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const backdropAnim = useRef(new Animated.Value(0)).current;
    const contactCardAnim = useRef(new Animated.Value(0)).current;

    // Load media assets - defined before useEffect
    const loadMediaAssets = useCallback(
      async (album?: MediaLibrary.Album | null) => {
        setIsLoading(true);
        try {
          const { status } = await MediaLibrary.requestPermissionsAsync();
          setHasMediaPermission(status === 'granted');

          if (status === 'granted') {
            // Load albums in background
            if (albums.length === 0) {
              MediaLibrary.getAlbumsAsync()
                .then(setAlbums)
                .catch(() => {
                  /* Ignore album load errors */
                });
            }

            const mediaOptions: MediaLibrary.AssetsOptions = {
              mediaType: ['photo', 'video'],
              sortBy: ['creationTime'],
              first: 50,
            };

            if (album) {
              mediaOptions.album = album.id;
            }

            const media = await MediaLibrary.getAssetsAsync(mediaOptions);

            if (media.assets.length === 0) {
              setUseImagePickerFallback(true);
              setAssets([]);
              setIsLoading(false);
              return;
            }

            // Map assets
            const initialAssets: Asset[] = media.assets.map((asset) => ({
              id: asset.id,
              uri: asset.uri,
              mediaType: asset.mediaType === 'video' ? 'video' : 'photo',
              duration: asset.duration,
              filename: asset.filename,
              width: asset.width,
              height: asset.height,
            }));

            setAssets(initialAssets);
            setIsLoading(false);

            // Resolve local URIs in background
            const BATCH_SIZE = 10;
            const resolvedAssets = [...initialAssets];

            for (let i = 0; i < media.assets.length; i += BATCH_SIZE) {
              const batch = media.assets.slice(i, i + BATCH_SIZE);
              const batchPromises = batch.map(async (asset, batchIndex) => {
                try {
                  const assetInfo = await MediaLibrary.getAssetInfoAsync(asset.id);
                  if (assetInfo.localUri) {
                    resolvedAssets[i + batchIndex] = {
                      ...resolvedAssets[i + batchIndex],
                      uri: assetInfo.localUri,
                    };
                  }
                } catch {
                  /* Keep original URI */
                }
              });
              await Promise.all(batchPromises);
            }

            setAssets([...resolvedAssets]);
          } else {
            setUseImagePickerFallback(true);
          }
        } catch (error) {
          console.error('Error loading media:', error);
          setUseImagePickerFallback(true);
        } finally {
          setIsLoading(false);
        }
      },
      [albums.length]
    );

    // Animation when showing/hiding
    useEffect(() => {
      if (visible) {
        Animated.parallel([
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }),
          Animated.timing(backdropAnim, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start();
        loadMediaAssets();
      } else {
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: SCREEN_HEIGHT,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(backdropAnim, {
            toValue: 0,
            duration: durations.normal.ms,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }, [visible, loadMediaAssets, slideAnim, backdropAnim]);

    // Album selection
    const handleAlbumSelect = (album: MediaLibrary.Album | null) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedAlbum(album);
      setShowAlbumPicker(false);
      loadMediaAssets(album);
    };

    // Image picker fallback
    const openImagePicker = async () => {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onClose();
        await new Promise((resolve) => setTimeout(resolve, 300));

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images', 'videos'],
          allowsMultipleSelection: true,
          quality: 0.8,
          selectionLimit: maxSelection,
        });

        if (!result.canceled && result.assets.length > 0) {
          const selectedItems: SelectedAsset[] = result.assets.map((asset) => ({
            uri: asset.uri,
            type: asset.type === 'video' ? 'video' : 'image',
            name: asset.fileName || `media_${Date.now()}.${asset.type === 'video' ? 'mp4' : 'jpg'}`,
            mimeType: asset.mimeType,
            duration: asset.duration ? asset.duration / 1000 : undefined,
          }));
          onSelectAssets(selectedItems);
        }
      } catch (error) {
        console.error('ImagePicker error:', error);
      }
    };

    // Camera
    const openCamera = async () => {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onClose();
        await new Promise((resolve) => setTimeout(resolve, 300));

        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images', 'videos'],
          quality: 0.8,
          allowsEditing: false,
          videoMaxDuration: 60,
        });

        if (!result.canceled && result.assets.length > 0) {
          const asset = result.assets[0];
          const isVideo = asset.type === 'video' || asset.uri?.includes('.mp4');
          onSelectAssets([
            {
              uri: asset.uri,
              type: isVideo ? 'video' : 'image',
              name:
                asset.fileName || (isVideo ? `video_${Date.now()}.mp4` : `photo_${Date.now()}.jpg`),
              mimeType: asset.mimeType || (isVideo ? 'video/mp4' : 'image/jpeg'),
              duration: asset.duration ? asset.duration / 1000 : undefined,
            },
          ]);
        }
      } catch (error) {
        console.error('Camera error:', error);
        Alert.alert('Error', 'Failed to open camera');
      }
    };

    // Toggle selection
    const toggleAssetSelection = useCallback(
      (asset: Asset) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedAssets((prev) => {
          const newMap = new Map(prev);
          if (newMap.has(asset.id)) {
            newMap.delete(asset.id);
          } else {
            if (newMap.size >= maxSelection) {
              Alert.alert('Maximum Reached', `You can only select up to ${maxSelection} items.`);
              return prev;
            }
            newMap.set(asset.id, asset);
          }
          return newMap;
        });
      },
      [maxSelection]
    );

    // Send selection
    const handleSendSelection = useCallback(() => {
      if (selectedAssets.size === 0) return;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const assets: SelectedAsset[] = Array.from(selectedAssets.values()).map((asset) => ({
        uri: asset.uri,
        type: asset.mediaType === 'video' ? 'video' : 'image',
        name:
          asset.filename ||
          `${asset.mediaType}_${Date.now()}.${asset.mediaType === 'video' ? 'mp4' : 'jpg'}`,
        duration: asset.duration,
      }));

      onSelectAssets(assets);
      setSelectedAssets(new Map());
      onClose();
    }, [selectedAssets, onSelectAssets, onClose]);

    // File picker
    const handleFilePicker = async () => {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onClose();
        await new Promise((resolve) => setTimeout(resolve, 400));

        const result = await DocumentPicker.getDocumentAsync({
          type: '*/*',
          multiple: true,
          copyToCacheDirectory: true,
        });

        if (!result.canceled && result.assets?.length > 0) {
          const assets: SelectedAsset[] = result.assets.map((asset) => ({
            uri: asset.uri,
            type: 'file',
            name: asset.name,
            mimeType: asset.mimeType,
          }));
          onSelectAssets(assets);
        }
      } catch (error) {
        console.error('File picker error:', error);
      }
    };

    // Contact picker
    const handleContactPicker = async () => {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        const { status } = await Contacts.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Please allow access to contacts to share them.');
          return;
        }

        const { data } = await Contacts.getContactsAsync({
          fields: [
            Contacts.Fields.Name,
            Contacts.Fields.PhoneNumbers,
            Contacts.Fields.Emails,
            Contacts.Fields.Image,
          ],
        });

        if (data.length > 0) {
           
          setContacts(data as (Contacts.Contact & { id: string })[]);
          setShowContactPicker(true);
          Animated.spring(contactCardAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 50,
            friction: 9,
          }).start();
        } else {
          Alert.alert('No Contacts', 'No contacts found on this device.');
        }
      } catch (error) {
        console.error('Contact picker error:', error);
        Alert.alert('Error', 'Failed to load contacts');
      }
    };

    // Share contact
    const shareContact = (contact: Contacts.Contact & { id: string }) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const phoneNumber = contact.phoneNumbers?.[0]?.number || '';
      const email = contact.emails?.[0]?.email || '';

      onSelectAssets([
        {
          uri: `contact://${contact.id}`,
          type: 'file',
          name: `${contact.name || 'Contact'}.vcf`,
          mimeType: 'text/vcard',
          contactData: {
            name: contact.name || 'Unknown',
            phone: phoneNumber,
            email: email,
          },
        },
      ]);
      setShowContactPicker(false);
      onClose();
    };

    // Tab press handler
    const handleTabPress = (tab: TabType) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (tab === 'file') {
        handleFilePicker();
        return;
      }
      if (tab === 'location') {
        Alert.alert('Location Sharing', 'Location sharing is coming soon!');
        return;
      }
      if (tab === 'gift') {
        Alert.alert('Gifts', 'Gift feature is coming soon!');
        return;
      }
      if (tab === 'checklist') {
        Alert.alert('Checklist', 'Checklist feature is coming soon!');
        return;
      }
      if (tab === 'contact') {
        handleContactPicker();
        return;
      }

      setActiveTab(tab);
    };

    // Render media item
    const renderMediaItem = useCallback(
      ({ item }: { item: Asset }) => {
        const isSelected = selectedAssets.has(item.id);
        const selectionOrder = isSelected
          ? Array.from(selectedAssets.keys()).indexOf(item.id) + 1
          : 0;

        return (
          <MediaTile
            item={item}
            isSelected={isSelected}
            selectionOrder={selectionOrder}
            onPress={() => toggleAssetSelection(item)}
          />
        );
      },
      [selectedAssets, toggleAssetSelection]
    );

    // Camera tile renderer
    const renderCameraTile = () => (
      <CameraTile
        onPress={openCamera}
        surfaceColor={colors.surface}
        textSecondaryColor={colors.textSecondary}
      />
    );

    if (!visible) return null;

    return (
      <Modal
        visible={visible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={onClose}
      >
        <View style={styles.container}>
          {/* Backdrop */}
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: backdropAnim }]}>
            <BlurView
              intensity={Platform.OS === 'ios' ? 30 : 100}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
            <TouchableOpacity
              style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)' }]}
              activeOpacity={1}
              onPress={onClose}
            />
          </Animated.View>

          {/* Picker Sheet */}
          <Animated.View
            style={[
              styles.sheet,
              {
                backgroundColor: isDark ? '#1c1c1e' : '#fff',
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Header
              selectedAlbumTitle={selectedAlbum?.title || 'Recents'}
              selectedCount={selectedAssets.size}
              onClose={onClose}
              onAlbumPress={() => setShowAlbumPicker(true)}
              onSend={handleSendSelection}
              textColor={colors.text}
            />

            {/* Media Grid or Fallback */}
            {isLoading || useImagePickerFallback || assets.length === 0 ? (
              <FallbackView
                isLoading={isLoading}
                onOpenImagePicker={openImagePicker}
                onOpenCamera={openCamera}
                primaryColor={colors.primary}
                textColor={colors.text}
                textSecondaryColor={colors.textSecondary}
              />
            ) : (
              <FlatList
                data={assets}
                renderItem={renderMediaItem}
                keyExtractor={(item) => item.id}
                numColumns={3}
                contentContainerStyle={styles.gridContent}
                ListHeaderComponent={renderCameraTile}
                showsVerticalScrollIndicator={false}
                initialNumToRender={15}
                maxToRenderPerBatch={15}
                windowSize={5}
              />
            )}

            <TabBar
              activeTab={activeTab}
              onTabPress={handleTabPress}
              isDark={isDark}
              textSecondaryColor={colors.textSecondary}
            />
          </Animated.View>

          {/* Album Picker Modal */}
          <AlbumPicker
            visible={showAlbumPicker}
            albums={albums}
            selectedAlbum={selectedAlbum}
            onSelect={handleAlbumSelect}
            onClose={() => setShowAlbumPicker(false)}
            isDark={isDark}
            colors={colors}
          />

          {/* Contact Picker Modal */}
          <ContactPicker
            visible={showContactPicker}
            contacts={contacts}
            searchQuery={contactSearchQuery}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            animation={contactCardAnim as any}
            onShareContact={shareContact}
            onClose={() => setShowContactPicker(false)}
            isDark={isDark}
            colors={colors}
          />
        </View>
      </Modal>
    );
  }
);

export default AttachmentPicker;
export { AttachmentPicker };
export type { AttachmentPickerProps, SelectedAsset, Asset } from './types';
