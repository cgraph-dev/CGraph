import React from 'react';
import {
  View,
  Text,
  Modal as RNModal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import Button from './Button';

interface ModalProps {
  /** Modal visibility */
  visible: boolean;
  /** Close handler */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Modal content */
  children: React.ReactNode;
  /** Footer content */
  footer?: React.ReactNode;
  /** Close on backdrop press */
  closeOnBackdrop?: boolean;
  /** Show close button */
  showCloseButton?: boolean;
  /** Additional content styles */
  contentStyle?: ViewStyle;
}

export default function Modal({
  visible,
  onClose,
  title,
  children,
  footer,
  closeOnBackdrop = true,
  showCloseButton = true,
  contentStyle,
}: ModalProps) {
  const { colors } = useTheme();

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={closeOnBackdrop ? onClose : undefined}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
              <View
                style={[
                  styles.content,
                  { backgroundColor: colors.surface },
                  contentStyle,
                ]}
              >
                {(title || showCloseButton) && (
                  <View style={styles.header}>
                    {title && (
                      <Text style={[styles.title, { color: colors.text }]}>
                        {title}
                      </Text>
                    )}
                    {showCloseButton && (
                      <TouchableOpacity
                        onPress={onClose}
                        style={styles.closeButton}
                      >
                        <Ionicons
                          name="close"
                          size={24}
                          color={colors.textSecondary}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                <View style={styles.body}>{children}</View>
                {footer && <View style={styles.footer}>{footer}</View>}
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
}

// Confirm Dialog
interface ConfirmDialogProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
  loading?: boolean;
}

export function ConfirmDialog({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  loading = false,
}: ConfirmDialogProps) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} onClose={onClose} showCloseButton={false}>
      <Text style={[styles.confirmTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.confirmMessage, { color: colors.textSecondary }]}>
        {message}
      </Text>
      <View style={styles.confirmButtons}>
        <Button
          variant="secondary"
          onPress={onClose}
          style={styles.confirmButton}
          disabled={loading}
        >
          {cancelText}
        </Button>
        <Button
          variant={variant === 'danger' ? 'danger' : 'primary'}
          onPress={onConfirm}
          style={styles.confirmButton}
          loading={loading}
        >
          {confirmText}
        </Button>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  body: {
    padding: 16,
  },
  footer: {
    padding: 16,
    paddingTop: 0,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 14,
    marginBottom: 24,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmButton: {
    flex: 1,
  },
});
