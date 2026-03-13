/**
 * DND Quick Toggle — Bottom sheet with duration options.
 * @module components/common/dnd-quick-toggle
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useThemeStore } from '@/stores';
import api from '../../lib/api';

interface DndState {
  active: boolean;
  dndUntil: string | null;
}

const DND_OPTIONS = [
  { label: 'For 1 hour', minutes: 60 },
  { label: 'For 2 hours', minutes: 120 },
  { label: 'For 8 hours', minutes: 480 },
  { label: 'Until tomorrow morning', minutes: 0 },
  { label: 'Until I turn it off', minutes: -1 },
] as const;

function getMinutesUntilTomorrowMorning(): number {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(8, 0, 0, 0);
  return Math.ceil((tomorrow.getTime() - now.getTime()) / 60000);
}

/**
 * DND Quick Toggle — shows a bottom sheet with DND duration options.
 */
export function DndQuickToggle() {
  const { colors } = useThemeStore();
  const [dndState, setDndState] = useState<DndState>({ active: false, dndUntil: null });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchDndState = useCallback(async () => {
    try {
      const response = await api.get('/api/v1/settings/dnd');
      const data = response.data?.data?.dnd || response.data?.dnd;
      if (data) {
        setDndState({ active: data.active, dndUntil: data.dnd_until });
      }
    } catch {
      // Non-critical
    }
  }, []);

  useEffect(() => {
    fetchDndState();
    const interval = setInterval(fetchDndState, 60000);
    return () => clearInterval(interval);
  }, [fetchDndState]);

  const activateDnd = useCallback(async (option: (typeof DND_OPTIONS)[number]) => {
    setLoading(true);
    try {
      let body: Record<string, unknown>;
      if (option.minutes === -1) {
        body = { indefinite: true };
      } else if (option.minutes === 0) {
        body = { duration_minutes: getMinutesUntilTomorrowMorning() };
      } else {
        body = { duration_minutes: option.minutes };
      }
      const response = await api.post('/api/v1/settings/dnd', body);
      const data = response.data?.data?.dnd || response.data?.dnd;
      if (data) {
        setDndState({ active: true, dndUntil: data.dnd_until });
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
      setOpen(false);
    }
  }, []);

  const clearDnd = useCallback(async () => {
    setLoading(true);
    try {
      await api.delete('/api/v1/settings/dnd');
      setDndState({ active: false, dndUntil: null });
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
      setOpen(false);
    }
  }, []);

  return (
    <>
      <TouchableOpacity
        onPress={() => {
          if (dndState.active) {
            clearDnd();
          } else {
            setOpen(true);
          }
        }}
        style={[styles.toggleButton, { backgroundColor: dndState.active ? colors.primary : colors.surface }]}
      >
        <Text style={[styles.toggleIcon, { color: dndState.active ? '#fff' : colors.text }]}>
          {dndState.active ? '🌙' : '🔔'}
        </Text>
        <Text style={[styles.toggleLabel, { color: dndState.active ? '#fff' : colors.text }]}>
          {dndState.active ? 'DND On' : 'DND'}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Do Not Disturb</Text>

            {DND_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.label}
                onPress={() => activateDnd(option)}
                disabled={loading}
                style={[styles.option, { borderBottomColor: colors.border }]}
              >
                <Text style={[styles.optionIcon]}>🌙</Text>
                <Text style={[styles.optionLabel, { color: colors.text }]}>{option.label}</Text>
              </TouchableOpacity>
            ))}

            {loading && (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            )}

            <TouchableOpacity onPress={() => setOpen(false)} style={styles.cancelButton}>
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  toggleIcon: {
    fontSize: 16,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  optionIcon: {
    fontSize: 18,
  },
  optionLabel: {
    fontSize: 16,
  },
  loadingRow: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
