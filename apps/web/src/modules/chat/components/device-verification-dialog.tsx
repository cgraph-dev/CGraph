/**
 * DeviceVerificationDialog Component
 *
 * Triggered when the user channel receives a "device_added" event.
 * Prompts the existing device's user to verify and cross-sign the
 * new device, establishing trust in the multi-device E2EE chain.
 *
 * Also includes a key change notification banner for conversations
 * where a contact's identity key has changed.
 *
 * @module modules/chat/components/device-verification-dialog
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import {
  crossSignDevice,
  syncKeyMaterial,
  getDeviceList,
  revokeDeviceTrust,
  type DeviceInfo,
} from '@/lib/crypto/e2ee-store/device-sync';

// ── Types ─────────────────────────────────────────────────────────────────────

interface DeviceVerificationDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** New device info from the "device_added" event */
  newDevice: NewDeviceEvent | null;
}

/** Payload from "device_added" user channel event */
export interface NewDeviceEvent {
  device_id: string;
  platform: string;
  timestamp: string;
  device_name?: string;
}

interface VerificationState {
  step: 'prompt' | 'verifying' | 'syncing' | 'done' | 'error';
  error: string | null;
}

// ── Linked Devices Panel ──────────────────────────────────────────────────────

interface LinkedDevicesPanelProps {
  /** Whether to show as a standalone panel */
  className?: string;
}

/**
 * Linked Devices settings panel for the web app.
 *
 * Shows all user devices from the trust chain with trust status.
 * Allows removing untrusted or old devices.
 */
export function LinkedDevicesPanel({ className = '' }: LinkedDevicesPanelProps) {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await getDeviceList();
      setDevices(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load devices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const handleRemoveDevice = async (deviceId: string) => {
    setRemovingId(deviceId);
    try {
      await revokeDeviceTrust(deviceId);
      setDevices((prev) => prev.filter((d) => d.deviceId !== deviceId));
    } catch {
      setError('Failed to remove device');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-textPrimary text-lg font-semibold">Linked Devices</h3>
        <button
          onClick={fetchDevices}
          disabled={loading}
          className="text-sm text-primary-400 hover:text-primary-300 disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-400 border-t-transparent" />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {!loading && !error && devices.length === 0 && (
        <p className="text-textMuted py-4 text-center text-sm">No linked devices found</p>
      )}

      {!loading && !error && devices.length > 0 && (
        <div className="space-y-2">
          {devices.map((device) => (
            <div
              key={device.deviceId}
              className="border-surfaceBorder bg-surface/50 flex items-center justify-between rounded-lg border px-4 py-3"
            >
              <div className="flex items-center gap-3">
                {device.platform === 'ios' || device.platform === 'android' ? (
                  <DevicePhoneMobileIcon className="text-textMuted h-5 w-5" />
                ) : (
                  <ComputerDesktopIcon className="text-textMuted h-5 w-5" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-textPrimary text-sm font-medium">
                      {device.deviceId.slice(0, 8)}…
                    </span>
                    {device.isCurrent && (
                      <span className="rounded-full bg-primary-500/20 px-2 py-0.5 text-xs text-primary-400">
                        This device
                      </span>
                    )}
                  </div>
                  <div className="text-textMuted flex items-center gap-2 text-xs">
                    <span className="capitalize">{device.platform || 'Unknown'}</span>
                    <span>•</span>
                    {device.isTrusted ? (
                      <span className="flex items-center gap-1 text-green-400">
                        <ShieldCheckIcon className="h-3 w-3" />
                        Verified
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-yellow-400">
                        <ShieldExclamationIcon className="h-3 w-3" />
                        Unverified
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {!device.isCurrent && (
                <button
                  onClick={() => handleRemoveDevice(device.deviceId)}
                  disabled={removingId === device.deviceId}
                  className="text-textMuted rounded-lg p-2 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                  title="Remove device"
                >
                  {removingId === device.deviceId ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
                  ) : (
                    <TrashIcon className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Key Change Banner ─────────────────────────────────────────────────────────

interface KeyChangeBannerProps {
  /** Contact name whose key changed */
  contactName: string;
  /** Contact user ID */
  contactId: string;
  /** Callback to open verification dialog/screen */
  onVerify: () => void;
  /** Callback to dismiss the banner */
  onDismiss: () => void;
}

/**
 * Key change notification banner for conversations.
 *
 * Displayed when a contact's identity key has changed (detected during
 * session creation or from server notification). Links to the safety
 * number verification dialog.
 */
export function KeyChangeBanner({
  contactName,
  contactId: _contactId,
  onVerify,
  onDismiss,
}: KeyChangeBannerProps) {
  return (
    <div className="flex items-center justify-between border-b border-yellow-500/30 bg-yellow-500/10 px-4 py-2">
      <div className="flex items-center gap-2">
        <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 text-yellow-400" />
        <p className="text-sm text-yellow-300">
          <span className="font-medium">{contactName}</span>&apos;s security number has changed.{' '}
          <button
            onClick={onVerify}
            className="font-medium text-yellow-200 underline hover:text-yellow-100"
          >
            Tap to verify
          </button>
        </p>
      </div>
      <button
        onClick={onDismiss}
        className="ml-2 rounded p-1 text-yellow-400 hover:bg-yellow-500/20"
        aria-label="Dismiss key change notification"
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

// ── Device Verification Dialog ────────────────────────────────────────────────

/**
 * Device verification dialog for web.
 *
 * Shown when a new device is detected via the "device_added" user channel
 * event. The user can verify and cross-sign the new device, or reject it.
 */
export function DeviceVerificationDialog({
  isOpen,
  onClose,
  newDevice,
}: DeviceVerificationDialogProps) {
  const [state, setState] = useState<VerificationState>({
    step: 'prompt',
    error: null,
  });

  // Reset state when dialog opens with new device
  useEffect(() => {
    if (isOpen && newDevice) {
      setState({ step: 'prompt', error: null });
    }
  }, [isOpen, newDevice]);

  const handleVerifyAndTrust = async () => {
    if (!newDevice) return;

    try {
      // Step 1: Cross-sign the new device
      setState({ step: 'verifying', error: null });
      await crossSignDevice(newDevice.device_id);

      // Step 2: Sync key material to new device
      setState({ step: 'syncing', error: null });
      await syncKeyMaterial(newDevice.device_id);

      // Done
      setState({ step: 'done', error: null });

      // Auto-close after success
      setTimeout(onClose, 2000);
    } catch (err) {
      setState({
        step: 'error',
        error: err instanceof Error ? err.message : 'Verification failed',
      });
    }
  };

  const handleReject = () => {
    onClose();
  };

  if (!newDevice) return null;

  const platformIcon =
    newDevice.platform === 'ios' || newDevice.platform === 'android' ? (
      <DevicePhoneMobileIcon className="h-8 w-8 text-primary-400" />
    ) : (
      <ComputerDesktopIcon className="h-8 w-8 text-primary-400" />
    );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheckIcon className="h-6 w-6 text-primary-400" />
            New Device Detected
          </DialogTitle>
          <DialogDescription>
            A new device is requesting to join your account. Verify it to enable end-to-end
            encrypted messaging on that device.
          </DialogDescription>
        </DialogHeader>

        {/* Device info card */}
        <div className="border-surfaceBorder bg-surface/50 rounded-lg border p-4">
          <div className="flex items-center gap-3">
            {platformIcon}
            <div>
              <p className="text-textPrimary font-medium">
                {newDevice.device_name || `Device ${newDevice.device_id.slice(0, 8)}…`}
              </p>
              <p className="text-textMuted text-xs">
                <span className="capitalize">{newDevice.platform}</span>
                {' • '}
                {new Date(newDevice.timestamp).toLocaleString()}
              </p>
              <p className="text-textMuted mt-1 font-mono text-xs">
                ID: {newDevice.device_id.slice(0, 16)}…
              </p>
            </div>
          </div>
        </div>

        {/* Step-specific content */}
        {state.step === 'prompt' && (
          <p className="text-textMuted text-sm">
            If you did not log in on a new device, reject this request and consider changing your
            password.
          </p>
        )}

        {state.step === 'verifying' && (
          <div className="flex items-center gap-3 py-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-400 border-t-transparent" />
            <span className="text-textMuted text-sm">Cross-signing device…</span>
          </div>
        )}

        {state.step === 'syncing' && (
          <div className="flex items-center gap-3 py-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-400 border-t-transparent" />
            <span className="text-textMuted text-sm">Syncing encryption keys…</span>
          </div>
        )}

        {state.step === 'done' && (
          <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3">
            <ShieldCheckIcon className="h-5 w-5 text-green-400" />
            <span className="text-sm font-medium text-green-400">
              Device verified and keys synced successfully
            </span>
          </div>
        )}

        {state.step === 'error' && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
            <p className="text-sm text-red-400">{state.error}</p>
            <button
              onClick={() => setState({ step: 'prompt', error: null })}
              className="mt-2 text-xs text-red-300 underline hover:text-red-200"
            >
              Try again
            </button>
          </div>
        )}

        {/* Footer actions */}
        {(state.step === 'prompt' || state.step === 'error') && (
          <DialogFooter>
            <button
              onClick={handleReject}
              className="border-surfaceBorder text-textPrimary hover:bg-surfaceHover rounded-lg border px-4 py-2 text-sm font-medium"
            >
              Reject
            </button>
            <button
              onClick={handleVerifyAndTrust}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500"
            >
              Verify &amp; Trust
            </button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default DeviceVerificationDialog;
