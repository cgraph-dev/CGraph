/**
 * KeyVerification Component Tests
 *
 * Tests for E2EE key verification and safety number display.
 * @since v0.7.27
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KeyVerification } from '../KeyVerification';

// Mock the API
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

import { api } from '@/lib/api';

describe('KeyVerification', () => {
  const defaultProps = {
    userId: 'user-123',
    username: 'Alice',
    onVerified: vi.fn(),
    onClose: vi.fn(),
  };

  const mockSafetyNumber = '123456789012345678901234567890';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('shows loading spinner while fetching', () => {
      vi.mocked(api.get).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<KeyVerification {...defaultProps} />);

      // Look for the spinner by its class
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('displays error when fetching safety number fails', async () => {
      vi.mocked(api.get).mockRejectedValueOnce({
        response: { data: { message: 'User not found' } },
      });

      render(<KeyVerification {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Verification Unavailable')).toBeInTheDocument();
      });

      expect(screen.getByText('User not found')).toBeInTheDocument();
    });

    it('shows close button on error', async () => {
      vi.mocked(api.get).mockRejectedValueOnce({
        response: { data: { message: 'Error' } },
      });

      render(<KeyVerification {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Close')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Close'));
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('verified state', () => {
    beforeEach(() => {
      vi.mocked(api.get)
        .mockResolvedValueOnce({
          data: { data: { safety_number: mockSafetyNumber } },
        })
        .mockResolvedValueOnce({
          data: { data: { verified: true } },
        });
    });

    it('displays verified badge when user is verified', async () => {
      render(<KeyVerification {...defaultProps} />);

      await waitFor(() => {
        // The component shows "Verified" text with green styling
        expect(screen.getByText('Verified')).toBeInTheDocument();
      });
    });

    it('shows remove verification button', async () => {
      render(<KeyVerification {...defaultProps} />);

      await waitFor(() => {
        // The button just says "Remove"
        expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
      });
    });

    it('can remove verification', async () => {
      const user = userEvent.setup();
      vi.mocked(api.delete).mockResolvedValueOnce({ data: {} });

      render(<KeyVerification {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Remove' }));

      expect(api.delete).toHaveBeenCalledWith('/api/v1/e2ee/keys/user-123/verify');
    });
  });

  describe('unverified state', () => {
    beforeEach(() => {
      vi.mocked(api.get)
        .mockResolvedValueOnce({
          data: { data: { safety_number: mockSafetyNumber } },
        })
        .mockResolvedValueOnce({
          data: { data: { verified: false } },
        });
    });

    it('displays safety number formatted correctly', async () => {
      render(<KeyVerification {...defaultProps} />);

      await waitFor(() => {
        // Safety number should be formatted in groups of 5
        expect(screen.getByText('12345 67890 12345 67890 12345 67890')).toBeInTheDocument();
      });
    });

    it('displays username in header', async () => {
      render(<KeyVerification {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Verify Security with Alice/)).toBeInTheDocument();
      });
    });

    it('shows mark as verified button', async () => {
      render(<KeyVerification {...defaultProps} />);

      await waitFor(() => {
        // Use getByRole to be more specific
        expect(screen.getByRole('button', { name: 'Mark as Verified' })).toBeInTheDocument();
      });
    });

    it('can mark user as verified', async () => {
      const user = userEvent.setup();
      vi.mocked(api.post).mockResolvedValueOnce({ data: {} });

      render(<KeyVerification {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Mark as Verified' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Mark as Verified' }));

      expect(api.post).toHaveBeenCalledWith('/api/v1/e2ee/keys/user-123/verify');
    });

    it('calls onVerified callback after marking verified', async () => {
      const user = userEvent.setup();
      vi.mocked(api.post).mockResolvedValueOnce({ data: {} });

      render(<KeyVerification {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Mark as Verified' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Mark as Verified' }));

      await waitFor(() => {
        expect(defaultProps.onVerified).toHaveBeenCalled();
      });
    });
  });

  describe('QR code functionality', () => {
    beforeEach(() => {
      vi.mocked(api.get)
        .mockResolvedValueOnce({
          data: { data: { safety_number: mockSafetyNumber } },
        })
        .mockResolvedValueOnce({
          data: { data: { verified: false } },
        });
    });

    it('has QR code toggle button', async () => {
      render(<KeyVerification {...defaultProps} />);

      await waitFor(() => {
        // Use more specific selector for the button
        expect(screen.getByRole('button', { name: /Show QR Code for Scanning/i })).toBeInTheDocument();
      });
    });

    it('toggles QR code display', async () => {
      const user = userEvent.setup();
      render(<KeyVerification {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Show QR Code for Scanning/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Show QR Code for Scanning/i }));

      // After clicking, should show "Hide QR Code" or the QR code itself
      await waitFor(() => {
        expect(
          screen.queryByText(/Hide QR Code/i) || 
          document.querySelector('[data-testid="qr-code"]')
        ).toBeTruthy();
      });
    });
  });

  describe('API integration', () => {
    it('fetches safety number on mount', async () => {
      vi.mocked(api.get)
        .mockResolvedValueOnce({
          data: { data: { safety_number: mockSafetyNumber } },
        })
        .mockResolvedValueOnce({
          data: { data: { verified: false } },
        });

      render(<KeyVerification {...defaultProps} />);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/api/v1/e2ee/safety-number/user-123');
        expect(api.get).toHaveBeenCalledWith('/api/v1/e2ee/keys/user-123/verification-status');
      });
    });

    it('handles verify API error gracefully', async () => {
      const user = userEvent.setup();
      vi.mocked(api.get)
        .mockResolvedValueOnce({
          data: { data: { safety_number: mockSafetyNumber } },
        })
        .mockResolvedValueOnce({
          data: { data: { verified: false } },
        });
      vi.mocked(api.post).mockRejectedValueOnce({
        response: { data: { message: 'Verification failed' } },
      });

      render(<KeyVerification {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Mark as Verified' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Mark as Verified' }));

      await waitFor(() => {
        expect(screen.getByText('Verification failed')).toBeInTheDocument();
      });
    });
  });

  describe('close functionality', () => {
    beforeEach(() => {
      vi.mocked(api.get)
        .mockResolvedValueOnce({
          data: { data: { safety_number: mockSafetyNumber } },
        })
        .mockResolvedValueOnce({
          data: { data: { verified: false } },
        });
    });

    it('has close button', async () => {
      render(<KeyVerification {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Close')).toBeInTheDocument();
      });
    });

    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<KeyVerification {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Close')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Close'));
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });
});
