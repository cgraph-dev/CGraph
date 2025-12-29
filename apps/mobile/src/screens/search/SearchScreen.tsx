import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../lib/api';
import { Avatar, EmptyState } from '../../components';
import debounce from 'lodash.debounce';

type SearchCategory = 'all' | 'users' | 'groups' | 'forums';

interface SearchUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  status: string;
}

interface SearchGroup {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_url: string | null;
  member_count: number;
}

interface SearchForum {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_url: string | null;
  post_count: number;
}

const categories: { id: SearchCategory; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'all', label: 'All', icon: 'search' },
  { id: 'users', label: 'Users', icon: 'person' },
  { id: 'groups', label: 'Groups', icon: 'people' },
  { id: 'forums', label: 'Forums', icon: 'newspaper' },
];

export default function SearchScreen() {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<SearchCategory>('all');
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Results
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [forums, setForums] = useState<SearchForum[]>([]);

  // ID Search
  const [showIdSearch, setShowIdSearch] = useState(false);
  const [idSearchType, setIdSearchType] = useState<'user' | 'group' | 'forum'>('user');
  const [idSearchValue, setIdSearchValue] = useState('');

  const performSearch = useCallback(
    debounce(async (searchQuery: string, searchCategory: SearchCategory) => {
      if (!searchQuery.trim()) {
        setUsers([]);
        setGroups([]);
        setForums([]);
        setHasSearched(false);
        return;
      }

      setLoading(true);

      try {
        const promises: Promise<void>[] = [];

        if (searchCategory === 'all' || searchCategory === 'users') {
          promises.push(
            api.get('/api/v1/search/users', { params: { q: searchQuery } })
              .then((res) => setUsers(res.data.users || res.data || []))
              .catch(() => setUsers([]))
          );
        }

        if (searchCategory === 'all' || searchCategory === 'groups') {
          promises.push(
            api.get('/api/v1/groups', { params: { search: searchQuery } })
              .then((res) => setGroups(res.data.groups || res.data || []))
              .catch(() => setGroups([]))
          );
        }

        if (searchCategory === 'all' || searchCategory === 'forums') {
          promises.push(
            api.get('/api/v1/forums', { params: { search: searchQuery } })
              .then((res) => setForums(res.data.forums || res.data || []))
              .catch(() => setForums([]))
          );
        }

        await Promise.all(promises);
        setHasSearched(true);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    performSearch(query, category);
  }, [query, category, performSearch]);

  const handleIdSearch = async () => {
    if (!idSearchValue.trim()) return;

    try {
      let endpoint = '';
      switch (idSearchType) {
        case 'user':
          endpoint = `/api/v1/users/${idSearchValue}`;
          break;
        case 'group':
          endpoint = `/api/v1/groups/${idSearchValue}`;
          break;
        case 'forum':
          endpoint = `/api/v1/forums/${idSearchValue}`;
          break;
      }

      const response = await api.get(endpoint);
      const data = response.data.data || response.data;
      
      if (data) {
        // Navigate to the appropriate screen
        // This would depend on your navigation structure
        console.log('Found:', data);
      }
    } catch {
      // Not found
      console.log('Not found');
    }
  };

  const totalResults = users.length + groups.length + forums.length;

  const renderUser = ({ item }: { item: SearchUser }) => (
    <TouchableOpacity
      style={[styles.resultItem, { backgroundColor: colors.surface }]}
      onPress={() => {
        // Navigate to user profile
      }}
    >
      <Avatar
        source={item.avatar_url}
        name={item.display_name || item.username}
        size="md"
      />
      <View style={styles.resultInfo}>
        <Text style={[styles.resultTitle, { color: colors.text }]}>
          {item.display_name || item.username}
        </Text>
        <Text style={[styles.resultSubtitle, { color: colors.textSecondary }]}>
          @{item.username}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderGroup = ({ item }: { item: SearchGroup }) => (
    <TouchableOpacity
      style={[styles.resultItem, { backgroundColor: colors.surface }]}
      onPress={() => {
        // Navigate to group
      }}
    >
      <View style={[styles.groupIcon, { backgroundColor: colors.primary }]}>
        <Text style={styles.groupIconText}>{item.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.resultInfo}>
        <Text style={[styles.resultTitle, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.resultSubtitle, { color: colors.textSecondary }]}>
          {item.member_count} members
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderForum = ({ item }: { item: SearchForum }) => (
    <TouchableOpacity
      style={[styles.resultItem, { backgroundColor: colors.surface }]}
      onPress={() => {
        // Navigate to forum
      }}
    >
      <View style={[styles.groupIcon, { backgroundColor: '#22c55e' }]}>
        <Text style={styles.groupIconText}>{item.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.resultInfo}>
        <Text style={[styles.resultTitle, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.resultSubtitle, { color: colors.textSecondary }]}>
          {item.post_count} posts
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Input */}
      <View style={styles.header}>
        <View style={[styles.searchInput, { backgroundColor: colors.surfaceSecondary }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Search users, groups, forums..."
            placeholderTextColor={colors.textSecondary}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* ID Search Toggle */}
        <TouchableOpacity
          style={[styles.idSearchToggle, { backgroundColor: colors.surface }]}
          onPress={() => setShowIdSearch(!showIdSearch)}
        >
          <Ionicons name="key" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* ID Search Panel */}
      {showIdSearch && (
        <View style={[styles.idSearchPanel, { backgroundColor: colors.surface }]}>
          <Text style={[styles.idSearchTitle, { color: colors.text }]}>
            Search by ID
          </Text>
          <View style={styles.idSearchRow}>
            <View style={[styles.idTypeSelector, { backgroundColor: colors.surfaceSecondary }]}>
              {(['user', 'group', 'forum'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.idTypeButton,
                    idSearchType === type && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setIdSearchType(type)}
                >
                  <Text
                    style={[
                      styles.idTypeText,
                      { color: idSearchType === type ? '#fff' : colors.textSecondary },
                    ]}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.idSearchInputRow}>
            <TextInput
              style={[
                styles.idInput,
                { backgroundColor: colors.surfaceSecondary, color: colors.text },
              ]}
              placeholder={`Enter ${idSearchType} ID`}
              placeholderTextColor={colors.textSecondary}
              value={idSearchValue}
              onChangeText={setIdSearchValue}
            />
            <TouchableOpacity
              style={[styles.idSearchButton, { backgroundColor: colors.primary }]}
              onPress={handleIdSearch}
            >
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Category Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryButton,
              { backgroundColor: category === cat.id ? colors.primary : colors.surface },
            ]}
            onPress={() => setCategory(cat.id)}
          >
            <Ionicons
              name={cat.icon}
              size={16}
              color={category === cat.id ? '#fff' : colors.textSecondary}
            />
            <Text
              style={[
                styles.categoryText,
                { color: category === cat.id ? '#fff' : colors.textSecondary },
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results */}
      <ScrollView style={styles.results} contentContainerStyle={styles.resultsContent}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        {!loading && !hasSearched && (
          <EmptyState
            icon="search"
            title="Search CGraph"
            description="Find users, groups, and forums. You can also search by ID."
          />
        )}

        {!loading && hasSearched && totalResults === 0 && (
          <EmptyState
            icon="search"
            title="No results found"
            description="Try different keywords or search in a specific category"
          />
        )}

        {!loading && hasSearched && totalResults > 0 && (
          <>
            {/* Users Section */}
            {(category === 'all' || category === 'users') && users.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                  USERS ({users.length})
                </Text>
                {(category === 'all' ? users.slice(0, 3) : users).map((user) => (
                  <React.Fragment key={user.id}>{renderUser({ item: user })}</React.Fragment>
                ))}
                {category === 'all' && users.length > 3 && (
                  <TouchableOpacity onPress={() => setCategory('users')}>
                    <Text style={[styles.viewAll, { color: colors.primary }]}>
                      View all users
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Groups Section */}
            {(category === 'all' || category === 'groups') && groups.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                  GROUPS ({groups.length})
                </Text>
                {(category === 'all' ? groups.slice(0, 3) : groups).map((group) => (
                  <React.Fragment key={group.id}>{renderGroup({ item: group })}</React.Fragment>
                ))}
                {category === 'all' && groups.length > 3 && (
                  <TouchableOpacity onPress={() => setCategory('groups')}>
                    <Text style={[styles.viewAll, { color: colors.primary }]}>
                      View all groups
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Forums Section */}
            {(category === 'all' || category === 'forums') && forums.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                  FORUMS ({forums.length})
                </Text>
                {(category === 'all' ? forums.slice(0, 3) : forums).map((forum) => (
                  <React.Fragment key={forum.id}>{renderForum({ item: forum })}</React.Fragment>
                ))}
                {category === 'all' && forums.length > 3 && (
                  <TouchableOpacity onPress={() => setCategory('forums')}>
                    <Text style={[styles.viewAll, { color: colors.primary }]}>
                      View all forums
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  idSearchToggle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  idSearchPanel: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  idSearchTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  idSearchRow: {
    marginBottom: 12,
  },
  idTypeSelector: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 4,
  },
  idTypeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  idTypeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  idSearchInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  idInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 14,
  },
  idSearchButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriesContainer: {
    maxHeight: 50,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  results: {
    flex: 1,
  },
  resultsContent: {
    padding: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  resultInfo: {
    flex: 1,
    marginLeft: 12,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  resultSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupIconText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    paddingVertical: 8,
  },
});
