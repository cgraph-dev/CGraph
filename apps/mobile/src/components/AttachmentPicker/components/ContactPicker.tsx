import React from 'react';
import { View, TouchableOpacity, Text, FlatList, Image, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Contacts from 'expo-contacts';
import { styles } from '../styles';

interface ContactPickerProps {
  visible: boolean;
  contacts: (Contacts.Contact & { id: string })[];
  searchQuery: string;
  animation: Animated.Value;
  onShareContact: (contact: Contacts.Contact & { id: string }) => void;
  onClose: () => void;
  isDark: boolean;
  colors: {
    text: string;
    border: string;
    input: string;
    primary: string;
    textSecondary: string;
  };
}

export function ContactPicker({
  visible,
  contacts,
  searchQuery,
  animation,
  onShareContact,
  onClose,
  isDark,
  colors,
}: ContactPickerProps) {
  if (!visible) return null;

  // Filter contacts by search query
  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phoneNumbers?.some((p) => p.number?.includes(searchQuery))
  );

  return (
    <Animated.View
      style={[
        styles.contactPickerOverlay,
        {
          opacity: animation,
          transform: [
            {
              scale: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.9, 1],
              }),
            },
          ],
        },
      ]}
    >
      <View
        style={[styles.contactPickerContainer, { backgroundColor: isDark ? '#1c1c1e' : '#fff' }]}
      >
        <View style={styles.contactPickerHeader}>
          <TouchableOpacity onPress={onClose} style={styles.contactPickerCloseBtn}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.contactPickerTitle, { color: colors.text }]}>Share Contact</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Search bar */}
        <View style={[styles.contactSearchContainer, { backgroundColor: colors.input }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <Text style={[styles.contactSearchPlaceholder, { color: colors.textSecondary }]}>
            Search contacts...
          </Text>
        </View>

        {/* Contact list */}
        <FlatList
          data={filteredContacts}
          keyExtractor={(item) => item.id || String(Math.random())}
          renderItem={({ item, index }) => (
            <Animated.View
              style={{
                opacity: animation,
                transform: [
                  {
                    translateY: animation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20 + index * 5, 0],
                    }),
                  },
                ],
              }}
            >
              <TouchableOpacity
                style={[styles.contactItem, { borderBottomColor: colors.border }]}
                onPress={() => onShareContact(item)}
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
                  <Text
                    style={[styles.contactPhone, { color: colors.textSecondary }]}
                    numberOfLines={1}
                  >
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
  );
}
