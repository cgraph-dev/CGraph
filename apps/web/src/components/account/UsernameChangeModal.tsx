import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, CheckCircle2, Clock, History } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

interface UsernameChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsername: string;
  lastChangeDate?: Date | null;
  isPremium?: boolean;
  onSuccess?: (newUsername: string) => void;
}

interface UsernameHistory {
  id: string;
  oldUsername: string;
  newUsername: string;
  changedAt: Date;
  changedByAdmin: boolean;
}

interface CheckResult {
  available: boolean;
  message?: string;
}

const COOLDOWN_DAYS_STANDARD = 30;
const COOLDOWN_DAYS_PREMIUM = 7;

export const UsernameChangeModal: React.FC<UsernameChangeModalProps> = ({
  isOpen,
  onClose,
  currentUsername,
  lastChangeDate,
  isPremium = false,
  onSuccess,
}) => {
  const [newUsername, setNewUsername] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<UsernameHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const debouncedUsername = useDebounce(newUsername, 500);
  const cooldownDays = isPremium ? COOLDOWN_DAYS_PREMIUM : COOLDOWN_DAYS_STANDARD;
  
  // Calculate remaining cooldown days
  const getRemainingDays = useCallback((): number => {
    if (!lastChangeDate) return 0;
    const now = new Date();
    const daysSinceChange = Math.floor(
      (now.getTime() - lastChangeDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.max(0, cooldownDays - daysSinceChange);
  }, [lastChangeDate, cooldownDays]);
  
  const remainingDays = getRemainingDays();
  const canChange = remainingDays === 0;
  
  // Username validation regex
  const isValidFormat = (username: string): boolean => {
    return /^[a-zA-Z0-9_-]{3,32}$/.test(username);
  };
  
  // Check username availability
  useEffect(() => {
    if (!debouncedUsername || debouncedUsername === currentUsername) {
      setCheckResult(null);
      return;
    }
    
    if (!isValidFormat(debouncedUsername)) {
      setCheckResult({
        available: false,
        message: 'Username must be 3-32 characters and contain only letters, numbers, underscores, and hyphens',
      });
      return;
    }
    
    const checkAvailability = async () => {
      setIsChecking(true);
      try {
        const response = await fetch(`/api/users/check-username?username=${encodeURIComponent(debouncedUsername)}`);
        const data = await response.json();
        setCheckResult({
          available: data.available,
          message: data.available ? 'Username is available!' : data.reason || 'Username is not available',
        });
      } catch {
        setCheckResult({
          available: false,
          message: 'Unable to check availability',
        });
      } finally {
        setIsChecking(false);
      }
    };
    
    checkAvailability();
  }, [debouncedUsername, currentUsername]);
  
  // Load history
  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await fetch('/api/users/me/username-history');
      const data = await response.json();
      setHistory(data.history || []);
    } catch {
      console.error('Failed to load username history');
    } finally {
      setLoadingHistory(false);
    }
  };
  
  useEffect(() => {
    if (showHistory && history.length === 0) {
      loadHistory();
    }
  }, [showHistory, history.length]);
  
  // Handle submit
  const handleSubmit = async () => {
    if (!canChange || !checkResult?.available) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/users/me/change-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to change username');
      }
      
      onSuccess?.(newUsername);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Change Username
            {isPremium && (
              <Badge variant="secondary" className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
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
                  <span className="block mt-1 text-sm opacity-80">
                    Premium users have a {COOLDOWN_DAYS_PREMIUM}-day cooldown instead of {COOLDOWN_DAYS_STANDARD} days.
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Current username */}
          <div>
            <Label className="text-sm text-muted-foreground">Current Username</Label>
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
                className={checkResult ? (checkResult.available ? 'border-green-500' : 'border-red-500') : ''}
              />
              {isChecking && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            
            {/* Availability feedback */}
            {checkResult && !isChecking && newUsername && (
              <p className={`text-sm flex items-center gap-1 ${checkResult.available ? 'text-green-600' : 'text-red-600'}`}>
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
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Username requirements:</p>
            <ul className="list-disc list-inside space-y-0.5 pl-2">
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
          
          {/* History toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="w-full justify-start text-muted-foreground"
          >
            <History className="h-4 w-4 mr-2" />
            {showHistory ? 'Hide' : 'Show'} username history
          </Button>
          
          {/* History list */}
          {showHistory && (
            <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
              {loadingHistory ? (
                <div className="flex justify-center py-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : history.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No username changes recorded
                </p>
              ) : (
                <ul className="space-y-2">
                  {history.map((item) => (
                    <li key={item.id} className="text-sm flex justify-between items-center">
                      <span>
                        <span className="text-muted-foreground">{item.oldUsername}</span>
                        <span className="mx-2">→</span>
                        <span className="font-medium">{item.newUsername}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(item.changedAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
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
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
