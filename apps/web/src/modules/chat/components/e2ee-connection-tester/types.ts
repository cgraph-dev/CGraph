/**
 * E2EEConnectionTester type definitions
 * @module modules/chat/components/e2ee-connection-tester
 */

export interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'warning' | 'error';
  message: string;
  details?: string;
  duration?: number;
}

export interface E2EEConnectionTesterProps {
  conversationId: string;
  recipientId: string;
  recipientName: string;
  onClose: () => void;
}

export type OverallStatus = 'idle' | 'testing' | 'success' | 'partial' | 'failed';
