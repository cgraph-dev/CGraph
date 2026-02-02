import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import { api } from '@/lib/api';
import { createLogger } from '@/lib/logger';
import { toast } from '@/components/Toast';
import { GlassCard } from '@/shared/components/ui';

const logger = createLogger('SessionsSettings');

interface Session {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  current: boolean;
  ipAddress: string;
  browser: string;
}

// Helper functions
function formatLastActive(dateString: string): string {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString();
}

function parseBrowser(userAgent: string): string {
  if (!userAgent) return 'Unknown Browser';
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Microsoft Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  return 'Unknown Browser';
}

export function SessionsSettingsPanel() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRevoking, setIsRevoking] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      const response = await api.get('/api/v1/me/sessions');
      const data = response.data?.data || response.data?.sessions || [];

      const mappedSessions: Session[] = data.map((s: Record<string, unknown>) => ({
        id: s.id as string,
        device: (s.device as string) || (s.user_agent as string) || 'Unknown Device',
        location: (s.location as string) || (s.ip_location as string) || 'Unknown Location',
        lastActive: formatLastActive((s.last_seen_at as string) || (s.inserted_at as string)),
        current: (s.current as boolean) || false,
        ipAddress: (s.ip_address as string) || '',
        browser: parseBrowser((s.user_agent as string) || ''),
      }));

      setSessions(mappedSessions);
    } catch (error) {
      logger.error('Failed to fetch sessions:', error);
      toast.error('Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const revokeSession = async (sessionId: string) => {
    setIsRevoking(sessionId);
    try {
      await api.delete(`/api/v1/me/sessions/${sessionId}`);
      setSessions(sessions.filter((s) => s.id !== sessionId));
      toast.success('Session revoked');
    } catch {
      toast.error('Failed to revoke session');
    } finally {
      setIsRevoking(null);
    }
  };

  const revokeAllOtherSessions = async () => {
    setIsRevoking('all');
    try {
      // Revoke all non-current sessions
      const otherSessions = sessions.filter((s) => !s.current);
      await Promise.all(otherSessions.map((s) => api.delete(`/api/v1/me/sessions/${s.id}`)));
      setSessions(sessions.filter((s) => s.current));
      toast.success('All other sessions revoked');
    } catch {
      toast.error('Failed to revoke sessions');
    } finally {
      setIsRevoking(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="mb-6 bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-2xl font-bold text-transparent">
        Active Sessions
      </h1>

      <div className="space-y-4">
        {sessions.length === 0 ? (
          <GlassCard variant="default" className="p-6 text-center">
            <p className="text-gray-400">No active sessions found</p>
          </GlassCard>
        ) : (
          sessions.map((session) => (
            <GlassCard
              key={session.id}
              variant={session.current ? 'crystal' : 'default'}
              className="p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <DevicePhoneMobileIcon
                    className={`h-8 w-8 ${session.current ? 'text-primary-400' : 'text-gray-400'}`}
                  />
                  <div>
                    <h3 className="font-medium text-white">
                      {session.browser || session.device}
                      {session.current && (
                        <span className="ml-2 text-xs font-semibold text-green-400">(Current)</span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {session.location} • {session.lastActive}
                    </p>
                    {session.ipAddress && (
                      <p className="font-mono text-xs text-gray-500">{session.ipAddress}</p>
                    )}
                  </div>
                </div>
                {!session.current && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => revokeSession(session.id)}
                    disabled={isRevoking === session.id}
                    className="rounded-lg bg-red-600/20 px-3 py-1.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-600/30 disabled:opacity-50"
                  >
                    {isRevoking === session.id ? 'Revoking...' : 'Revoke'}
                  </motion.button>
                )}
              </div>
            </GlassCard>
          ))
        )}
      </div>

      {sessions.filter((s) => !s.current).length > 0 && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={revokeAllOtherSessions}
          disabled={isRevoking === 'all'}
          className="mt-6 rounded-lg bg-red-600/20 px-4 py-2 font-medium text-red-400 transition-colors hover:bg-red-600/30 disabled:opacity-50"
        >
          {isRevoking === 'all' ? 'Revoking All...' : 'Revoke All Other Sessions'}
        </motion.button>
      )}
    </motion.div>
  );
}
