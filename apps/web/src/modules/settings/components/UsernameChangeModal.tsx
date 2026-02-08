import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
  Alert,
  AlertDescription,
  Badge,
} from '@/shared/components/ui';
import { Loader2, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import {
  useUsernameChange,
  COOLDOWN_DAYS_PREMIUM,
  COOLDOWN_DAYS_STANDARD,
} from '@/modules/settings/hooks/useUsernameChange';
import { UsernameHistorySection } from '@/modules/settings/components/UsernameHistory';

interface UsernameChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsername: string;
  lastChangeDate?: Date | null;
  isPremium?: boolean;
  onSuccess?: (newUsername: string) => void;
}

export const UsernameChangeModal: React.FC<UsernameChangeModalProps> = ({
  isOpen,
  onClose,
  currentUsername,
  lastChangeDate,
  isPremium = false,
  onSuccess,
}) => {
  const {
    newUsername,
    setNewUsername,
    isChecking,
    isSubmitting,
    checkResult,
    error,
    showHistory,
    toggleHistory,
    history,
    loadingHistory,
    remainingDays,
    canChange,
    handleSubmit,
  } = useUsernameChange({ currentUsername, lastChangeDate, isPremium, onSuccess, onClose });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Change Username
            {isPremium && (
              <Badge
                variant="secondary"
                className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white"
              >
                Premium
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Choose a new username for your account. This change is visible to all users.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cooldown warning */}
          {!canChange && (
            <Alert variant="destructive">
              <Clock className="h-4 w-4" />
              <AlertDescription>
                You can change your username again in <strong>{remainingDays} days</strong>.
                {!isPremium && (
                  <span className="mt-1 block text-sm opacity-80">
                    Premium users have a {COOLDOWN_DAYS_PREMIUM}-day cooldown instead of{' '}
                    {COOLDOWN_DAYS_STANDARD} days.
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Current username */}
          <div>
            <Label className="text-muted-foreground text-sm">Current Username</Label>
            <p className="font-medium">{currentUsername}</p>
          </div>

          {/* New username input */}
          <div className="space-y-2">
            <Label htmlFor="new-username">New Username</Label>
            <div className="relative">
              <Input
                id="new-username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Enter new username"
                disabled={!canChange || isSubmitting}
                className={
                  checkResult ? (checkResult.available ? 'border-green-500' : 'border-red-500') : ''
                }
              />
              {isChecking && (
                <Loader2 className="text-muted-foreground absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin" />
              )}
            </div>

            {/* Availability feedback */}
            {checkResult && !isChecking && newUsername && (
              <p
                className={`flex items-center gap-1 text-sm ${checkResult.available ? 'text-green-600' : 'text-red-600'}`}
              >
                {checkResult.available ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                {checkResult.message}
              </p>
            )}
          </div>

          {/* Username requirements */}
          <div className="text-muted-foreground space-y-1 text-sm">
            <p>Username requirements:</p>
            <ul className="list-inside list-disc space-y-0.5 pl-2">
              <li>3-32 characters</li>
              <li>Letters, numbers, underscores, and hyphens only</li>
              <li>Cannot be a recently released username</li>
            </ul>
          </div>

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* History section */}
          <UsernameHistorySection
            showHistory={showHistory}
            onToggle={toggleHistory}
            history={history}
            loading={loadingHistory}
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canChange || !checkResult?.available || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Changing...
              </>
            ) : (
              'Change Username'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UsernameChangeModal;
