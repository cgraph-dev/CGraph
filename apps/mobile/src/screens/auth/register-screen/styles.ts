import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 46, 22, 0.1)',
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#fff',
    textShadowColor: 'rgba(16, 185, 129, 0.35)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(16, 185, 129, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  subtitleSecondary: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  formContainer: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    shadowColor: 'rgba(16, 185, 129, 0.2)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#d1d5db',
    marginBottom: 2,
  },
  labelHint: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#6b7280',
  },
  inputGradient: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.8)',
  },
  inputFocused: {
    borderColor: 'rgba(16, 185, 129, 0.5)',
    shadowColor: 'rgba(16, 185, 129, 0.25)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 3,
  },
  input: {
    padding: 16,
    fontSize: 16,
    color: '#fff',
  },
  inputHint: {
    fontSize: 12,
    marginTop: 4,
    color: '#6b7280',
  },
  termsRow: {
    marginTop: 8,
  },
  termsRowInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: '#9ca3af',
  },
  termsLink: {
    fontWeight: '600',
    color: '#10b981',
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: 'rgba(16, 185, 129, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
});
