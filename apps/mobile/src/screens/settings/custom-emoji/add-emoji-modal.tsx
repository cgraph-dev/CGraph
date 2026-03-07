/**
 * AddEmojiModal - Modal for creating new custom emojis
 *
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Image, Alert, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { LottieRenderer } from '@/lib/lottie';
import type { EmojiCategory, AnimationFormat } from './types';
import { styles } from './styles';

interface AddEmojiModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (
    name: string,
    shortcode: string,
    imageUri: string,
    category: string,
    animationFormat?: AnimationFormat,
  ) => void;
  categories: EmojiCategory[];
}

/**
 *
 */
export function AddEmojiModal({ visible, onClose, onSubmit, categories }: AddEmojiModalProps) {
  const [name, setName] = useState('');
  const [shortcode, setShortcode] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [category, setCategory] = useState('custom');
  const [animationFormat, setAnimationFormat] = useState<AnimationFormat>(null);
  const [lottieJsonUri, setLottieJsonUri] = useState<string | null>(null);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter an emoji name');
      return;
    }
    if (!shortcode.trim()) {
      Alert.alert('Error', 'Please enter a shortcode');
      return;
    }
    if (!imageUri) {
      Alert.alert('Error', 'Please select an image');
      return;
    }

    onSubmit(name.trim(), shortcode.trim().toLowerCase(), lottieJsonUri || imageUri, category, animationFormat);
    setName('');
    setShortcode('');
    setImageUri('');
    setCategory('custom');
    setAnimationFormat(null);
    setLottieJsonUri(null);
  };

  const filteredCategories = categories.filter((c) => c.id !== 'all');

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <BlurView intensity={80} tint="dark" style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Custom Emoji</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {/* Image Picker */}
          <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
            {lottieJsonUri ? (
              <LottieRenderer url={lottieJsonUri} size={80} autoplay loop />
            ) : imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.pickedImage} />
            ) : (
              <View style={styles.imagePickerPlaceholder}>
                <Ionicons name="image" size={32} color="#6b7280" />
                <Text style={styles.imagePickerText}>Tap to select image</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Lottie JSON picker */}
          <TouchableOpacity
            style={[styles.imagePicker, { marginTop: 8, paddingVertical: 10 }]}
            onPress={async () => {
              try {
                const result = await DocumentPicker.getDocumentAsync({
                  type: 'application/json',
                  copyToCacheDirectory: true,
                });
                if (!result.canceled && result.assets?.[0]) {
                  const asset = result.assets[0];
                  // Validate Lottie JSON structure
                  const content = await FileSystem.readAsStringAsync(asset.uri);
                  const parsed = JSON.parse(content);
                  if (!parsed.v || !parsed.layers) {
                    Alert.alert('Invalid Lottie', 'The file does not appear to be a valid Lottie JSON animation.');
                    return;
                  }
                  setLottieJsonUri(asset.uri);
                  setAnimationFormat('lottie');
                  setImageUri('');
                }
              } catch {
                Alert.alert('Error', 'Failed to pick Lottie JSON file');
              }
            }}
          >
            <View style={styles.imagePickerPlaceholder}>
              <Ionicons name="code-slash" size={24} color="#6b7280" />
              <Text style={[styles.imagePickerText, { fontSize: 12 }]}>
                {lottieJsonUri ? '✓ Lottie JSON selected' : 'Or pick Lottie JSON (.json)'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Party Parrot"
              placeholderTextColor="#6b7280"
            />
          </View>

          {/* Shortcode Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Shortcode</Text>
            <View style={styles.shortcodeInput}>
              <Text style={styles.shortcodePrefix}>:</Text>
              <TextInput
                style={styles.shortcodeField}
                value={shortcode}
                onChangeText={(text) => setShortcode(text.replace(/[^a-zA-Z0-9_]/g, ''))}
                placeholder="partyparrot"
                placeholderTextColor="#6b7280"
                autoCapitalize="none"
              />
              <Text style={styles.shortcodeSuffix}>:</Text>
            </View>
          </View>

          {/* Category Selector */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.categoryButtons}>
              {filteredCategories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryButton,
                    category === cat.id && styles.categoryButtonSelected,
                  ]}
                  onPress={() => setCategory(cat.id)}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      category === cat.id && styles.categoryButtonTextSelected,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <LinearGradient colors={['#10b981', '#059669']} style={styles.submitButtonGradient}>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Add Emoji</Text>
            </LinearGradient>
          </TouchableOpacity>
        </BlurView>
      </View>
    </Modal>
  );
}
