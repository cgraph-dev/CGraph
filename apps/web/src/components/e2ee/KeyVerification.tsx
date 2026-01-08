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
import { useAuthStore } from '@/stores/authStore';
import { CheckCircleIcon, ExclamationTriangleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

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

export function KeyVerification({ userId, username, onVerified, onClose }: KeyVerificationProps) {
  const currentUser = useAuthStore((s) => s.user);
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
    } catch (err: any) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err.response?.data?.message || 'Failed to load safety number',
      }));
    }
  };

  const handleMarkVerified = async () => {
    try {
      await api.post(`/api/v1/e2ee/keys/${userId}/verify`);
      setState((s) => ({ ...s, isVerified: true }));
      onVerified?.();
    } catch (err: any) {
      setState((s) => ({
        ...s,
        error: err.response?.data?.message || 'Failed to mark as verified',
      }));
    }
  };

  const handleUnverify = async () => {
    try {
      await api.delete(`/api/v1/e2ee/keys/${userId}/verify`);
      setState((s) => ({ ...s, isVerified: false }));
    } catch (err: any) {
      setState((s) => ({
        ...s,
        error: err.response?.data?.message || 'Failed to remove verification',
      }));
    }
  };

  if (state.loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="p-6 text-center">
        <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Verification Unavailable</h3>
        <p className="text-gray-600 mb-4">{state.error}</p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700"
        >
          Close
        </button>
      </div>
    );
  }

  const formattedNumber = formatSafetyNumber(state.safetyNumber || '');

  return (
    <div className="p-6 max-w-md">
      {/* Header */}
      <div className="flex items-center mb-6">
        <ShieldCheckIcon className={`h-8 w-8 mr-3 ${state.isVerified ? 'text-green-500' : 'text-indigo-500'}`} />
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Verify Security with {username}
          </h2>
          <p className="text-sm text-gray-500">
            End-to-end encryption active
          </p>
        </div>
      </div>

      {/* Verification Status */}
      {state.isVerified && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
          <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
          <span className="text-green-800 font-medium">Verified</span>
          <button
            onClick={handleUnverify}
            className="ml-auto text-sm text-green-600 hover:text-green-800 underline"
          >
            Remove
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="mb-6">
        <p className="text-gray-700 text-sm leading-relaxed">
          To verify that your messages are truly end-to-end encrypted with{' '}
          <strong>{username}</strong>, compare the safety number below with theirs.
        </p>
        <p className="text-gray-600 text-sm mt-2">
          You can compare via:
        </p>
        <ul className="text-sm text-gray-600 list-disc list-inside mt-1">
          <li>In-person meeting</li>
          <li>Video call (show QR code)</li>
          <li>Trusted side channel</li>
        </ul>
      </div>

      {/* Safety Number Display */}
      <div className="mb-6">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Safety Number</p>
          <p className="font-mono text-lg text-center text-gray-900 tracking-widest select-all">
            {formattedNumber}
          </p>
        </div>
      </div>

      {/* QR Code Toggle */}
      <div className="mb-6">
        <button
          onClick={() => setShowQR(!showQR)}
          className="w-full py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center justify-center"
        >
          {showQR ? 'Hide QR Code' : 'Show QR Code for Scanning'}
        </button>
        
        {showQR && state.safetyNumber && (
          <div className="mt-4 flex justify-center">
            <div className="p-4 bg-white border rounded-lg">
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
          className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Close
        </button>
        {!state.isVerified && (
          <button
            onClick={handleMarkVerified}
            className="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
          >
            Mark as Verified
          </button>
        )}
      </div>

      {/* Security Note */}
      <p className="mt-4 text-xs text-gray-500 text-center">
        If the safety numbers don't match, your communication may be compromised.
        Do not mark as verified until you've confirmed they match.
      </p>
    </div>
  );
}

export default KeyVerification;
