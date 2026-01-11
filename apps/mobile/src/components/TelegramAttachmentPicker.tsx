import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  Image,
  FlatList,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as MediaLibrary from 'expo-media-library';
import * as Contacts from 'expo-contacts';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TILE_SIZE = (SCREEN_WIDTH - 4) / 3;

interface Asset {
  id: string;
  uri: string;
  mediaType: 'photo' | 'video';
  duration?: number;
  filename?: string;
  width?: number;
  height?: number;
}

interface SelectedAsset {
  uri: string;
  type: 'image' | 'video' | 'file';
  name?: string;
  mimeType?: string;
  duration?: number;
}

type TabType = 'gallery' | 'gift' | 'file' | 'location' | 'checklist' | 'contact';

interface TelegramAttachmentPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectAssets: (assets: SelectedAsset[]) => void;
  maxSelection?: number;
}

const TelegramAttachmentPicker = memo(({
  visible,
  onClose,
  onSelectAssets,
  maxSelection = 10,
}: TelegramAttachmentPickerProps) => {
  const { colors, colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  
  const [activeTab, setActiveTab] = useState<TabType>('gallery');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<Map<string, Asset>>(new Map());
  const [hasMediaPermission, setHasMediaPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [useImagePickerFallback, setUseImagePickerFallback] = useState(false);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [contacts, setContacts] = useState<(Contacts.Contact & { id: string })[]>([]);
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [albums, setAlbums] = useState<MediaLibrary.Album[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<MediaLibrary.Album | null>(null);
  const [showAlbumPicker, setShowAlbumPicker] = useState(false);
  
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const contactCardAnim = useRef(new Animated.Value(0)).current;
  
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
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);
  
  // Load media assets from gallery with proper URI resolution for Android
  const loadMediaAssets = async (album?: MediaLibrary.Album | null) => {
    setIsLoading(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setHasMediaPermission(status === 'granted');
      
      if (status === 'granted') {
        // Load albums list in background (don't await)
        if (albums.length === 0) {
          MediaLibrary.getAlbumsAsync().then(albumsList => {
            setAlbums(albumsList);
          }).catch(e => console.log('Could not load albums:', e));
        }
        
        const mediaOptions: MediaLibrary.AssetsOptions = {
          mediaType: ['photo', 'video'],
          sortBy: ['creationTime'],
          first: 50, // Reduced for faster loading
        };
        
        // If album is specified, get assets from that album
        if (album) {
          mediaOptions.album = album.id;
        }
        
        const media = await MediaLibrary.getAssetsAsync(mediaOptions);
        
        // Check if we got any assets - if not, we might be in limited mode
        if (media.assets.length === 0) {
          console.log('No media assets found, enabling ImagePicker fallback');
          setUseImagePickerFallback(true);
          setAssets([]);
          setIsLoading(false);
          return;
        }
        
        // First, show assets immediately with original URIs for fast display
        const initialAssets: Asset[] = media.assets.map(asset => ({
          id: asset.id,
          uri: asset.uri,
          mediaType: asset.mediaType === 'video' ? 'video' as const : 'photo' as const,
          duration: asset.duration,
          filename: asset.filename,
          width: asset.width,
          height: asset.height,
        }));
        
        setAssets(initialAssets);
        setIsLoading(false);
        
        // Then resolve localUris in parallel batches for uploads (in background)
        const BATCH_SIZE = 10;
        const resolvedAssets: Asset[] = [...initialAssets];
        
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
            } catch (e) {
              // Keep original URI
            }
          });
          await Promise.all(batchPromises);
        }
        
        // Update with resolved URIs
        setAssets([...resolvedAssets]);
      } else {
        // Permission not granted, use ImagePicker fallback
        setUseImagePickerFallback(true);
      }
    } catch (error) {
      console.error('Error loading media:', error);
      setUseImagePickerFallback(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle album selection
  const handleAlbumSelect = (album: MediaLibrary.Album | null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAlbum(album);
    setShowAlbumPicker(false);
    loadMediaAssets(album);
  };
  
  // Open ImagePicker directly (fallback for Expo Go)
  const openImagePicker = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onClose();
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: maxSelection,
      });
      
      if (!result.canceled && result.assets.length > 0) {
        const selectedItems: SelectedAsset[] = result.assets.map(asset => ({
          uri: asset.uri,
          type: asset.type === 'video' ? 'video' as const : 'image' as const,
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
  
  // Toggle asset selection
  const toggleAssetSelection = useCallback((asset: Asset) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    setSelectedAssets(prev => {
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
  }, [maxSelection]);
  
  // Handle send selection
  const handleSendSelection = useCallback(() => {
    if (selectedAssets.size === 0) return;
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    const assets: SelectedAsset[] = Array.from(selectedAssets.values()).map(asset => ({
      uri: asset.uri,
      type: asset.mediaType === 'video' ? 'video' : 'image',
      name: asset.filename || `${asset.mediaType}_${Date.now()}.${asset.mediaType === 'video' ? 'mp4' : 'jpg'}`,
      duration: asset.duration,
    }));
    
    onSelectAssets(assets);
    setSelectedAssets(new Map());
    onClose();
  }, [selectedAssets, onSelectAssets, onClose]);
  
  // Handle file picker
  const handleFilePicker = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onClose(); // Close picker first to avoid modal conflicts
      
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: true,
        copyToCacheDirectory: true,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const assets: SelectedAsset[] = result.assets.map(asset => ({
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
  
  // Open native camera for photos
  const openCameraPhoto = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onClose();
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
      });
      
      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        onSelectAssets([{
          uri: asset.uri,
          type: 'image',
          name: asset.fileName || `photo_${Date.now()}.jpg`,
          mimeType: asset.mimeType || 'image/jpeg',
        }]);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to open camera');
    }
  };
  
  // Open native camera for video
  const openCameraVideo = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onClose();
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['videos'],
        videoMaxDuration: 60,
        quality: 0.8,
        allowsEditing: false,
      });
      
      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        onSelectAssets([{
          uri: asset.uri,
          type: 'video',
          name: asset.fileName || `video_${Date.now()}.mp4`,
          mimeType: asset.mimeType || 'video/mp4',
          duration: asset.duration ? asset.duration / 1000 : undefined,
        }]);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to open camera');
    }
  };
  
  // Open native camera for both photo and video
  const openCamera = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onClose();
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images', 'videos'],
        quality: 0.8,
        allowsEditing: false,
        videoMaxDuration: 60,
      });
      
      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        const isVideo = asset.type === 'video' || (asset.uri && asset.uri.includes('.mp4'));
        onSelectAssets([{
          uri: asset.uri,
          type: isVideo ? 'video' : 'image',
          name: asset.fileName || (isVideo ? `video_${Date.now()}.mp4` : `photo_${Date.now()}.jpg`),
          mimeType: asset.mimeType || (isVideo ? 'video/mp4' : 'image/jpeg'),
          duration: asset.duration ? asset.duration / 1000 : undefined,
        }]);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to open camera');
    }
  };
  
  // Render camera tile - opens native camera directly
  const renderCameraTile = () => (
    <TouchableOpacity
      style={styles.cameraTile}
      onPress={openCamera}
      activeOpacity={0.8}
    >
      <View style={styles.cameraPreviewContainer}>
        <View style={[styles.cameraPlaceholder, { backgroundColor: colors.surface }]}>
          <Ionicons name="camera" size={40} color={colors.textSecondary} />
        </View>
        <View style={styles.cameraOverlay}>
          <View style={styles.cameraIconCircle}>
            <Ionicons name="camera" size={28} color="#fff" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
  
  // Render media item
  const renderMediaItem = useCallback(({ item, index }: { item: Asset; index: number }) => {
    const isSelected = selectedAssets.has(item.id);
    const selectionOrder = isSelected ? Array.from(selectedAssets.keys()).indexOf(item.id) + 1 : 0;
    
    return (
      <TouchableOpacity
        style={styles.mediaTile}
        onPress={() => toggleAssetSelection(item)}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: item.uri }}
          style={styles.mediaImage}
          resizeMode="cover"
        />
        
        {/* Video duration badge */}
        {item.mediaType === 'video' && item.duration && (
          <View style={styles.videoDurationBadge}>
            <Ionicons name="play" size={10} color="#fff" />
            <Text style={styles.videoDurationText}>
              {Math.floor(item.duration / 60)}:{String(Math.floor(item.duration % 60)).padStart(2, '0')}
            </Text>
          </View>
        )}
        
        {/* Selection indicator */}
        <View style={[
          styles.selectionCircle,
          isSelected && styles.selectionCircleSelected,
        ]}>
          {isSelected && (
            <Text style={styles.selectionNumber}>{selectionOrder}</Text>
          )}
        </View>
        
        {/* Selected overlay */}
        {isSelected && (
          <View style={styles.selectedOverlay} />
        )}
      </TouchableOpacity>
    );
  }, [selectedAssets, toggleAssetSelection]);
  
  // Tab bar items
  const tabItems: { id: TabType; icon: string; label: string }[] = [
    { id: 'gallery', icon: 'images', label: 'Gallery' },
    { id: 'gift', icon: 'gift', label: 'Gift' },
    { id: 'file', icon: 'document', label: 'File' },
    { id: 'location', icon: 'location', label: 'Location' },
    { id: 'checklist', icon: 'checkbox', label: 'Checklist' },
    { id: 'contact', icon: 'person', label: 'Contact' },
  ];
  
  // Handle tab press
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
  
  // Handle contact picker
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
  
  // Share selected contact
  const shareContact = (contact: Contacts.Contact & { id: string }) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    const phoneNumber = contact.phoneNumbers?.[0]?.number || '';
    const email = contact.emails?.[0]?.email || '';
    
    // Create contact card message content
    const contactInfo = {
      uri: `contact://${contact.id}`,
      type: 'file' as const,
      name: `${contact.name || 'Contact'}.vcf`,
      mimeType: 'text/vcard',
      contactData: {
        name: contact.name || 'Unknown',
        phone: phoneNumber,
        email: email,
      },
    };
    
    onSelectAssets([contactInfo]);
    setShowContactPicker(false);
    onClose();
  };
  
  // Filter contacts by search query
  const filteredContacts = contacts.filter(contact => 
    contact.name?.toLowerCase().includes(contactSearchQuery.toLowerCase()) ||
    contact.phoneNumbers?.some((p: Contacts.PhoneNumber) => p.number?.includes(contactSearchQuery))
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
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { opacity: backdropAnim },
          ]}
        >
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
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.albumSelector}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowAlbumPicker(true);
              }}
            >
              <Text style={[styles.albumTitle, { color: colors.text }]}>
                {selectedAlbum ? selectedAlbum.title : 'Recents'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.text} />
            </TouchableOpacity>
            
            {selectedAssets.size > 0 && (
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSendSelection}
              >
                <Text style={styles.sendButtonText}>
                  {selectedAssets.size}
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
          
          {/* Media Grid with fallback */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading media...</Text>
            </View>
          ) : useImagePickerFallback || assets.length === 0 ? (
            <View style={styles.fallbackContainer}>
              <View style={styles.fallbackIconContainer}>
                <Ionicons name="images-outline" size={64} color={colors.textSecondary} />
              </View>
              <Text style={[styles.fallbackTitle, { color: colors.text }]}>
                Open Gallery
              </Text>
              <Text style={[styles.fallbackSubtitle, { color: colors.textSecondary }]}>
                Tap below to select photos and videos from your device
              </Text>
              <TouchableOpacity
                style={[styles.fallbackButton, { backgroundColor: colors.primary }]}
                onPress={openImagePicker}
              >
                <Ionicons name="folder-open" size={24} color="#fff" />
                <Text style={styles.fallbackButtonText}>Browse Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.fallbackCameraButton, { borderColor: colors.primary }]}
                onPress={openCamera}
              >
                <Ionicons name="camera" size={24} color={colors.primary} />
                <Text style={[styles.fallbackCameraButtonText, { color: colors.primary }]}>Take Photo/Video</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={assets}
              renderItem={renderMediaItem}
              keyExtractor={item => item.id}
              numColumns={3}
              contentContainerStyle={styles.gridContent}
              ListHeaderComponent={renderCameraTile}
              showsVerticalScrollIndicator={false}
              initialNumToRender={15}
              maxToRenderPerBatch={15}
              windowSize={5}
            />
          )}
          
          {/* Bottom Tab Bar */}
          <View style={[
            styles.tabBar,
            { 
              backgroundColor: isDark ? '#1c1c1e' : '#fff',
              borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            },
          ]}>
            {tabItems.map(tab => (
              <TouchableOpacity
                key={tab.id}
                style={styles.tabItem}
                onPress={() => handleTabPress(tab.id)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.tabIconContainer,
                  activeTab === tab.id && styles.tabIconContainerActive,
                ]}>
                  <Ionicons
                    name={tab.icon as any}
                    size={22}
                    color={activeTab === tab.id ? '#fff' : colors.textSecondary}
                  />
                </View>
                <Text style={[
                  styles.tabLabel,
                  { color: activeTab === tab.id ? '#007AFF' : colors.textSecondary },
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
        
        {/* Album Picker Modal */}
        {showAlbumPicker && (
          <View style={styles.albumPickerOverlay}>
            <TouchableOpacity 
              style={styles.albumPickerBackdrop}
              activeOpacity={1}
              onPress={() => setShowAlbumPicker(false)}
            />
            <View style={[styles.albumPickerContainer, { backgroundColor: isDark ? '#1c1c1e' : '#fff' }]}>
              <View style={styles.albumPickerHeader}>
                <Text style={[styles.albumPickerTitle, { color: colors.text }]}>Select Album</Text>
                <TouchableOpacity 
                  onPress={() => setShowAlbumPicker(false)}
                  style={styles.albumPickerCloseBtn}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={[null, ...albums]}
                keyExtractor={(item, index) => item?.id || `recents-${index}`}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.albumItem, 
                      { borderBottomColor: colors.border },
                      (item === null && selectedAlbum === null) || (item?.id === selectedAlbum?.id) 
                        ? { backgroundColor: colors.surface } 
                        : {}
                    ]}
                    onPress={() => handleAlbumSelect(item)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.albumIcon, { backgroundColor: colors.primary + '20' }]}>
                      <Ionicons 
                        name={item === null ? 'time-outline' : 'folder-outline'} 
                        size={24} 
                        color={colors.primary} 
                      />
                    </View>
                    <View style={styles.albumInfo}>
                      <Text style={[styles.albumName, { color: colors.text }]}>
                        {item === null ? 'Recents' : item.title}
                      </Text>
                      {item !== null && (
                        <Text style={[styles.albumCount, { color: colors.textSecondary }]}>
                          {item.assetCount} items
                        </Text>
                      )}
                    </View>
                    {((item === null && selectedAlbum === null) || (item?.id === selectedAlbum?.id)) && (
                      <Ionicons name="checkmark" size={24} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.albumListContent}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </View>
        )}
        
        {/* Contact Picker Modal */}
        {showContactPicker && (
          <Animated.View 
            style={[
              styles.contactPickerOverlay,
              { 
                opacity: contactCardAnim,
                transform: [{ 
                  scale: contactCardAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  })
                }],
              },
            ]}
          >
            <View style={[styles.contactPickerContainer, { backgroundColor: isDark ? '#1c1c1e' : '#fff' }]}>
              <View style={styles.contactPickerHeader}>
                <TouchableOpacity 
                  onPress={() => setShowContactPicker(false)}
                  style={styles.contactPickerCloseBtn}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.contactPickerTitle, { color: colors.text }]}>Share Contact</Text>
                <View style={{ width: 40 }} />
              </View>
              
              {/* Search bar */}
              <View style={[styles.contactSearchContainer, { backgroundColor: colors.input }]}>
                <Ionicons name="search" size={20} color={colors.textSecondary} />
                <Text 
                  style={[styles.contactSearchPlaceholder, { color: colors.textSecondary }]}
                >
                  Search contacts...
                </Text>
              </View>
              
              {/* Contact list */}
              <FlatList
                data={filteredContacts}
                keyExtractor={item => item.id || String(Math.random())}
                renderItem={({ item, index }) => (
                  <Animated.View
                    style={{
                      opacity: contactCardAnim,
                      transform: [{
                        translateY: contactCardAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20 + index * 5, 0],
                        }),
                      }],
                    }}
                  >
                    <TouchableOpacity
                      style={[styles.contactItem, { borderBottomColor: colors.border }]}
                      onPress={() => shareContact(item)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.contactAvatar, { backgroundColor: colors.primary }]}>
                        {item.imageAvailable && item.image ? (
                          <Image source={{ uri: item.image.uri }} style={styles.contactAvatarImage} />
                        ) : (
                          <Text style={styles.contactAvatarText}>
                            {(item.name || 'U')[0].toUpperCase()}
                          </Text>
                        )}
                      </View>
                      <View style={styles.contactInfo}>
                        <Text style={[styles.contactName, { color: colors.text }]} numberOfLines={1}>
                          {item.name || 'Unknown'}
                        </Text>
                        <Text style={[styles.contactPhone, { color: colors.textSecondary }]} numberOfLines={1}>
                          {item.phoneNumbers?.[0]?.number || item.emails?.[0]?.email || 'No contact info'}
                        </Text>
                      </View>
                      <Ionicons name="paper-plane" size={20} color={colors.primary} />
                    </TouchableOpacity>
                  </Animated.View>
                )}
                contentContainerStyle={styles.contactListContent}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </Animated.View>
        )}
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    height: SCREEN_HEIGHT * 0.75,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(128,128,128,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  albumSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  albumTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  gridContent: {
    paddingBottom: 100,
  },
  cameraTile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    margin: 0.5,
  },
  cameraPreviewContainer: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 2,
  },
  cameraPreview: {
    flex: 1,
  },
  cameraPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  cameraIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  mediaTile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    margin: 0.5,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
  },
  videoDurationBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  videoDurationText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
  },
  selectionCircle: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  selectionCircleSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  selectionNumber: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,122,255,0.15)',
    borderRadius: 2,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  tabBar: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
    borderTopWidth: 0.5,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  tabIconContainer: {
    width: 44,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconContainerActive: {
    backgroundColor: '#007AFF',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  fullscreenCamera: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingBottom: Platform.OS === 'ios' ? 50 : 30,
  },
  cameraCloseBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: '#fff',
  },
  captureButtonVideo: {
    borderColor: '#FF3B30',
  },
  captureButtonRecording: {
    borderColor: '#FF3B30',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  captureButtonInnerVideo: {
    backgroundColor: '#FF3B30',
  },
  captureButtonInnerRecording: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
  },
  cameraModeToggle: {
    position: 'absolute',
    bottom: 130,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  cameraModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  cameraModeBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  cameraModeText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '600',
  },
  cameraModeTextActive: {
    color: '#fff',
  },
  recordingIndicator: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
  },
  recordingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cameraFlipBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Fallback UI styles
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
  },
  fallbackContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 100,
  },
  fallbackIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(128,128,128,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  fallbackTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  fallbackSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  fallbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
    gap: 10,
    marginBottom: 12,
  },
  fallbackButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  fallbackCameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
    borderWidth: 2,
    gap: 10,
  },
  fallbackCameraButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  // Contact picker styles
  contactPickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  contactPickerContainer: {
    height: SCREEN_HEIGHT * 0.7,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  contactPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  contactPickerCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(128,128,128,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactPickerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  contactSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 10,
  },
  contactSearchPlaceholder: {
    fontSize: 16,
  },
  contactListContent: {
    paddingBottom: 40,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  contactAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  contactAvatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  contactAvatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 14,
  },
  // Album picker styles
  albumPickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  albumPickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  albumPickerContainer: {
    width: SCREEN_WIDTH * 0.85,
    maxHeight: SCREEN_HEIGHT * 0.6,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  albumPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  albumPickerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  albumPickerCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(128,128,128,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  albumListContent: {
    paddingBottom: 20,
  },
  albumItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  albumIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  albumInfo: {
    flex: 1,
  },
  albumName: {
    fontSize: 16,
    fontWeight: '600',
  },
  albumCount: {
    fontSize: 13,
    marginTop: 2,
  },
});

export default TelegramAttachmentPicker;
