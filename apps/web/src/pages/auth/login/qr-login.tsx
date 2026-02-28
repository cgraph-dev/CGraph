/**
 * QR Code Login page — scan from mobile to authenticate web sessions.
 *
 * Protocol flow:
 * 1. Request QR session from backend
 * 2. Display QR code with encoded session payload
 * 3. Subscribe to qr_auth:{session_id} WebSocket channel
 * 4. Wait for mobile to scan + approve
 * 5. Receive tokens via channel broadcast → store + redirect
 *
 * @module pages/auth/login/qr-login
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Socket } from 'phoenix';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { useAuthStore } from '@/modules/auth/store';
import { createLogger } from '@/lib/logger';

const logger = createLogger('QrLogin');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type QrState = 'loading' | 'ready' | 'authenticated' | 'expired' | 'error';

interface QrSession {
  sessionId: string;
  qrPayload: string;
  expiresIn: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const QR_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const QR_SIZE = 256;

// ---------------------------------------------------------------------------
// Socket URL helper (matches connectionLifecycle pattern)
// ---------------------------------------------------------------------------

function getSocketUrl(): string {
  const envUrl = import.meta.env.VITE_SOCKET_URL ?? import.meta.env.VITE_WS_URL;

  if (envUrl !== undefined && envUrl !== '') {
    return envUrl;
  }

  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/socket`;
  }

  return 'ws://localhost:4000/socket';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/** QR code login tab/section for the login page. */
export function QrLogin() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();

  const [state, setState] = useState<QrState>('loading');
  const [session, setSession] = useState<QrSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const channelRef = useRef<ReturnType<Socket['channel']> | null>(null);
  const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Create QR session ──────────────────────────────────────────────

  const createSession = useCallback(async () => {
    setState('loading');
    setError(null);

    try {
      const response = await api.post('/api/v1/auth/qr-session');
      const data = response.data?.data ?? response.data;

      const qrSession: QrSession = {
        sessionId: data.session_id,
        qrPayload: data.qr_payload,
        expiresIn: data.expires_in ?? 300,
      };

      setSession(qrSession);
      setState('ready');

      // Connect to QR auth channel
      connectToChannel(qrSession.sessionId);

      // Set expiry timer
      if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = setTimeout(() => {
        setState('expired');
        disconnectChannel();
      }, QR_EXPIRY_MS);
    } catch (err) {
      logger.error('Failed to create QR session:', err);
      setError('Failed to create QR session. Please try again.');
      setState('error');
    }
  }, []);

  // ── WebSocket channel connection ───────────────────────────────────

  const connectToChannel = useCallback(
    (sessionId: string) => {
      disconnectChannel();

      const socketUrl = getSocketUrl();
      const socket = new Socket(`${socketUrl}/websocket`, {
        params: { qr_auth: 'true' },
        reconnectAfterMs: () => 5000,
      });

      socket.connect();
      socketRef.current = socket;

      const channel = socket.channel(`qr_auth:${sessionId}`, {});
      channelRef.current = channel;

      channel
        .join()
        .receive('ok', () => {
          logger.info('Joined QR auth channel:', sessionId);
        })
        .receive('error', (resp: unknown) => {
          logger.error('Failed to join QR auth channel:', resp);
          setState('error');
          setError('Failed to connect. Please try again.');
        });

      // Listen for auth completion from mobile
      channel.on('auth_complete', (payload: unknown) => {
        logger.info('QR auth complete — storing tokens');
        const data = payload as { tokens: Record<string, string>; user: Record<string, unknown> };
        handleAuthComplete(data);
      });
    },
    [],
  );

  const disconnectChannel = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.leave();
      channelRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  // ── Handle successful auth ─────────────────────────────────────────

  const handleAuthComplete = useCallback(
    (payload: { tokens: Record<string, string>; user: Record<string, unknown> }) => {
      setState('authenticated');

      // Store tokens in auth store
      const { tokens, user } = payload;
      useAuthStore.setState({
        token: tokens.access_token ?? null,
        refreshToken: tokens.refresh_token ?? null,
        user: user as unknown as ReturnType<typeof useAuthStore.getState>['user'],
        isAuthenticated: true,
      });

      // Clean up
      disconnectChannel();
      if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);

      // Redirect to app after brief visual feedback
      setTimeout(() => {
        navigate('/messages');
      }, 1200);
    },
    [navigate, disconnectChannel],
  );

  // ── Lifecycle ──────────────────────────────────────────────────────

  useEffect(() => {
    createSession();

    return () => {
      disconnectChannel();
      if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);
    };
  }, []);

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col items-center gap-6">
      <AnimatePresence mode="wait">
        {/* Loading */}
        {state === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex h-[320px] w-[300px] items-center justify-center"
          >
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          </motion.div>
        )}

        {/* QR Code Ready */}
        {state === 'ready' && session && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="rounded-2xl bg-white p-4 shadow-lg">
              <QRCodeSVG
                value={session.qrPayload}
                size={QR_SIZE}
                level="M"
                includeMargin={false}
              />
            </div>
            <p className="max-w-[260px] text-center text-sm text-foreground-muted">
              {t('login.qr_scan_instructions', 'Open CGraph on your phone and scan this code to log in')}
            </p>
            <div className="flex items-center gap-2 text-xs text-foreground-muted">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-green-500" />
              {t('login.qr_waiting', 'Waiting for scan...')}
            </div>
          </motion.div>
        )}

        {/* Authenticated */}
        {state === 'authenticated' && (
          <motion.div
            key="authenticated"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex h-[320px] w-[300px] flex-col items-center justify-center gap-3"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
              <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-medium text-foreground">
              {t('login.qr_success', 'Login approved!')}
            </p>
            <p className="text-sm text-foreground-muted">
              {t('login.qr_redirecting', 'Redirecting...')}
            </p>
          </motion.div>
        )}

        {/* Expired */}
        {state === 'expired' && (
          <motion.div
            key="expired"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex h-[320px] w-[300px] flex-col items-center justify-center gap-4"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/20">
              <svg className="h-8 w-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-foreground-muted">
              {t('login.qr_expired', 'QR code expired')}
            </p>
            <button
              onClick={createSession}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
            >
              {t('login.qr_generate_new', 'Generate New Code')}
            </button>
          </motion.div>
        )}

        {/* Error */}
        {state === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex h-[320px] w-[300px] flex-col items-center justify-center gap-4"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
              <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-sm text-foreground-muted">{error}</p>
            <button
              onClick={createSession}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
            >
              {t('login.qr_try_again', 'Try Again')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default QrLogin;
