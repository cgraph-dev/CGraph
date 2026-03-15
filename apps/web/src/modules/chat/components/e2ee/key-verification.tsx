/**
 * E2EE Key Verification Component
 *
 * Displays safety number for verifying end-to-end encryption with a contact.
 * Users compare this number in-person or via a trusted channel to ensure
 * no man-in-the-middle attack is present.
 */

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '@/lib/api';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

interface KeyVerificationProps {
  userId: string;
  username: string;
  onVerified?: () => void;
  onClose: () => void;
}

interface VerificationState {
  safetyNumber: string | null;
  isVerified: boolean;
  loading: boolean;
  error: string | null;
}

/**
 * Format safety number into human-readable groups
 * "123456789012345678901234567890" -> "12345 67890 12345 67890 12345 67890"
 */
function formatSafetyNumber(number: string): string {
  return number.match(/.{1,5}/g)?.join(' ') || number;
}

/**
 * Generate QR code data for cross-device verification
 */
function getQRData(userId: string, safetyNumber: string): string {
  return JSON.stringify({
    version: 1,
    type: 'cgraph-verify',
    userId,
    safetyNumber,
    timestamp: Date.now(),
  });
}

/**
 * unknown for the chat module.
 */
/**
 * Key Verification component.
 */
export function KeyVerification({ userId, username, onVerified, onClose }: KeyVerificationProps) {
  const [state, setState] = useState<VerificationState>({
    safetyNumber: null,
    isVerified: false,
    loading: true,
    error: null,
  });
  const [showQR, setShowQR] = useState(false);

  // Fetch safety number on mount
  useEffect(() => {
    fetchSafetyNumber();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchSafetyNumber = async () => {
    try {
      setState((s) => ({ ...s, loading: true, error: null }));

      const response = await api.get(`/api/v1/e2ee/safety-number/${userId}`);
      const { safety_number } = response.data.data;

      // Check if already verified
      const verifyResponse = await api.get(`/api/v1/e2ee/keys/${userId}/verification-status`);
      const isVerified = verifyResponse.data.data?.verified || false;

      setState({
        safetyNumber: safety_number,
        isVerified,
        loading: false,
        error: null,
      });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'response' in err
            ?  
              ((err as { response?: { data?: { message?: string } } }).response?.data?.message ??
              'Failed to load safety number')
            : 'Failed to load safety number';
      setState((s) => ({
        ...s,
        loading: false,
        error: errorMessage,
      }));
    }
  };

  const handleMarkVerified = async () => {
    try {
      await api.post(`/api/v1/e2ee/keys/${userId}/verify`);
      setState((s) => ({ ...s, isVerified: true }));
      onVerified?.();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'response' in err
            ?  
              ((err as { response?: { data?: { message?: string } } }).response?.data?.message ??
              'Failed to mark as verified')
            : 'Failed to mark as verified';
      setState((s) => ({
        ...s,
        error: errorMessage,
      }));
    }
  };

  const handleUnverify = async () => {
    try {
      await api.delete(`/api/v1/e2ee/keys/${userId}/verify`);
      setState((s) => ({ ...s, isVerified: false }));
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'response' in err
            ?  
              ((err as { response?: { data?: { message?: string } } }).response?.data?.message ??
              'Failed to remove verification')
            : 'Failed to remove verification';
      setState((s) => ({
        ...s,
        error: errorMessage,
      }));
    }
  };

  if (state.loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="p-6 text-center">
        <ExclamationTriangleIcon className="mx-auto mb-4 h-12 w-12 text-yellow-500" />
        <h3 className="mb-2 text-lg font-medium text-gray-900">Verification Unavailable</h3>
        <p className="mb-4 text-gray-600">{state.error}</p>
        <button
          onClick={onClose}
          className="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
        >
          Close
        </button>
      </div>
    );
  }

  const formattedNumber = formatSafetyNumber(state.safetyNumber || '');

  return (
    <div className="max-w-md p-6">
      {/* Header */}
      <div className="mb-6 flex items-center">
        <ShieldCheckIcon
          className={`mr-3 h-8 w-8 ${state.isVerified ? 'text-green-500' : 'text-indigo-500'}`}
        />
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Verify Security with {username}</h2>
          <p className="text-sm text-gray-500">End-to-end encryption active</p>
        </div>
      </div>

      {/* Verification Status */}
      {state.isVerified && (
        <div className="mb-6 flex items-center rounded-lg border border-green-200 bg-green-50 p-4">
          <CheckCircleIcon className="mr-2 h-5 w-5 text-green-600" />
          <span className="font-medium text-green-800">Verified</span>
          <button
            onClick={handleUnverify}
            className="ml-auto text-sm text-green-600 underline hover:text-green-800"
          >
            Remove
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="mb-6">
        <p className="text-sm leading-relaxed text-gray-700">
          To verify that your messages are truly end-to-end encrypted with{' '}
          <strong>{username}</strong>, compare the safety number below with theirs.
        </p>
        <p className="mt-2 text-sm text-gray-600">You can compare via:</p>
        <ul className="mt-1 list-inside list-disc text-sm text-gray-600">
          <li>In-person meeting</li>
          <li>Video call (show QR code)</li>
          <li>Trusted side channel</li>
        </ul>
      </div>

      {/* Safety Number Display */}
      <div className="mb-6">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="mb-2 text-xs uppercase tracking-wide text-gray-500">Safety Number</p>
          <p className="select-all text-center font-mono text-lg tracking-widest text-gray-900">
            {formattedNumber}
          </p>
        </div>
      </div>

      {/* QR Code Toggle */}
      <div className="mb-6">
        <button
          onClick={() => setShowQR(!showQR)}
          className="flex w-full items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
        >
          {showQR ? 'Hide QR Code' : 'Show QR Code for Scanning'}
        </button>

        {showQR && state.safetyNumber && (
          <div className="mt-4 flex justify-center">
            <div className="rounded-lg border bg-white p-4">
              <QRCodeSVG
                value={getQRData(userId, state.safetyNumber)}
                size={200}
                level="M"
                includeMargin={true}
              />
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
        >
          Close
        </button>
        {!state.isVerified && (
          <button
            onClick={handleMarkVerified}
            className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
          >
            Mark as Verified
          </button>
        )}
      </div>

      {/* Security Note */}
      <p className="mt-4 text-center text-xs text-gray-500">
        If the safety numbers don't match, your communication may be compromised. Do not mark as
        verified until you've confirmed they match.
      </p>
    </div>
  );
}

export default KeyVerification;
