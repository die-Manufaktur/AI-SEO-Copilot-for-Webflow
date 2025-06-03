import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { copyTextToClipboard } from './clipboard';

// Mock navigator.clipboard
const mockClipboard = {
  writeText: vi.fn(),
};

Object.defineProperty(navigator, 'clipboard', {
  value: mockClipboard,
  writable: true,
});

// Mock document.execCommand for fallback
Object.defineProperty(document, 'execCommand', {
  value: vi.fn(),
  writable: true,
});

describe('clipboard utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('copyToClipboard', () => {
    it('uses modern clipboard API when available', async () => {
      mockClipboard.writeText.mockResolvedValue(undefined);
      
      const result = await copyTextToClipboard('test text');
      
      expect(mockClipboard.writeText).toHaveBeenCalledWith('test text');
      expect(result).toBe(true);
    });

    it('falls back to execCommand when clipboard API fails', async () => {
      mockClipboard.writeText.mockRejectedValue(new Error('Clipboard API failed'));
      document.execCommand = vi.fn().mockReturnValue(true);
      
      const result = await copyTextToClipboard('fallback text');
      
      expect(result).toBe(true);
    });

    it('returns false when both methods fail', async () => {
      mockClipboard.writeText.mockRejectedValue(new Error('Clipboard API failed'));
      document.execCommand = vi.fn().mockReturnValue(false);
      
      const result = await copyTextToClipboard('failed text');
      
      expect(result).toBe(false);
    });

      it('handles empty text', async () => {
        mockClipboard.writeText.mockResolvedValue(undefined);
        
        const result = await copyTextToClipboard('');
        
        expect(mockClipboard.writeText).toHaveBeenCalledWith('');
        expect(result).toBe(true);
      });
    });
  });