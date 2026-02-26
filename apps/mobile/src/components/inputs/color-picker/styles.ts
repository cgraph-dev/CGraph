import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  preview: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#374151',
  },
  previewColor: {
    flex: 1,
  },
  inputContainer: {
    flex: 1,
  },
  input: {
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'monospace',
  },
  sliderSection: {
    marginBottom: 20,
  },
  sliderLabel: {
    color: '#9ca3af',
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  slider: {
    position: 'relative',
    overflow: 'visible',
  },
  thumb: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderWidth: 3,
    borderColor: '#374151',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  swatchSection: {
    marginTop: 16,
  },
  swatchLabel: {
    color: '#9ca3af',
    fontSize: 12,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  swatch: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});
