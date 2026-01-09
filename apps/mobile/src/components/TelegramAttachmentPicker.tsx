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
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as MediaLibrary from 'expo-media-library';
import { CameraView, useCameraPermissions } from 'expo-camera';
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
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const cameraRef = useRef<CameraView>(null);
  
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
  
  // Load media assets from gallery
  const loadMediaAssets = async () => {
    setIsLoading(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setHasMediaPermission(status === 'granted');
      
      if (status === 'granted') {
        const media = await MediaLibrary.getAssetsAsync({
          mediaType: ['photo', 'video'],
          sortBy: ['creationTime'],
          first: 100,
        });
        
        setAssets(media.assets.map(asset => ({
          id: asset.id,
          uri: asset.uri,
          mediaType: asset.mediaType === 'video' ? 'video' : 'photo',
          duration: asset.duration,
          filename: asset.filename,
          width: asset.width,
          height: asset.height,
        })));
      }
    } catch (error) {
      console.error('Error loading media:', error);
    } finally {
      setIsLoading(false);
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
  
  // Handle camera capture
  const handleCameraCapture = async () => {
    if (!cameraRef.current) return;
    
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });
      
      if (photo?.uri) {
        onSelectAssets([{
          uri: photo.uri,
          type: 'image',
          name: `photo_${Date.now()}.jpg`,
          mimeType: 'image/jpeg',
        }]);
        setShowCamera(false);
        onClose();
      }
    } catch (error) {
      console.error('Camera capture error:', error);
      Alert.alert('Error', 'Failed to capture photo');
    }
  };
  
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
  
  // Open camera with permission check
  const openCamera = async () => {
    if (!cameraPermission?.granted) {
      const { granted } = await requestCameraPermission();
      if (!granted) {
        Alert.alert('Permission needed', 'Camera permission is required to take photos.');
        return;
      }
    }
    setShowCamera(true);
  };
  
  // Render camera tile
  const renderCameraTile = () => (
    <TouchableOpacity
      style={styles.cameraTile}
      onPress={openCamera}
      activeOpacity={0.8}
    >
      <View style={styles.cameraPreviewContainer}>
        {cameraPermission?.granted ? (
          <CameraView
            style={styles.cameraPreview}
            facing="back"
          />
        ) : (
          <View style={[styles.cameraPlaceholder, { backgroundColor: colors.surface }]}>
            <Ionicons name="camera" size={40} color={colors.textSecondary} />
          </View>
        )}
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
      Alert.alert('Contact Sharing', 'Contact sharing is coming soon!');
      return;
    }
    
    setActiveTab(tab);
  };
  
  // Fullscreen camera view
  if (showCamera) {
    return (
      <Modal visible={visible} animationType="fade" statusBarTranslucent>
        <View style={styles.fullscreenCamera}>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
          />
          
          {/* Camera controls */}
          <View style={styles.cameraControls}>
            <TouchableOpacity
              style={styles.cameraCloseBtn}
              onPress={() => setShowCamera(false)}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.captureButton}
              onPress={handleCameraCapture}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.cameraFlipBtn}
              onPress={() => {/* Flip camera */}}
            >
              <Ionicons name="camera-reverse" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }
  
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
            
            <TouchableOpacity style={styles.albumSelector}>
              <Text style={[styles.albumTitle, { color: colors.text }]}>Recents</Text>
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
          
          {/* Media Grid */}
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
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  cameraFlipBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default TelegramAttachmentPicker;
