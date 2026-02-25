/**
 * Tests for ImageAltTextList — per-image alt text with regeneration loading states
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageAltTextList } from './ImageAltTextList';
import type { ImageAltTextItem } from './ImageAltTextList';

const mockImages: ImageAltTextItem[] = [
  { id: 'img_1', url: 'https://example.com/photo-a.jpg', name: 'photo-a.jpg', alt: null },
  { id: 'img_2', url: 'https://example.com/photo-b.jpg', name: 'photo-b.jpg', alt: null },
];

const defaultProps = {
  images: mockImages,
  onApply: vi.fn().mockResolvedValue({ success: true }),
};

describe('ImageAltTextList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic rendering', () => {
    it('renders a textarea for each image', () => {
      render(<ImageAltTextList {...defaultProps} />);
      expect(screen.getAllByRole('textbox')).toHaveLength(2);
    });

    it('renders empty state when no images provided', () => {
      render(<ImageAltTextList {...defaultProps} images={[]} />);
      expect(screen.getByText(/no images found/i)).toBeInTheDocument();
    });

    it('shows existing alt text in textarea', () => {
      const imagesWithAlt: ImageAltTextItem[] = [
        { id: 'img_1', url: 'https://example.com/a.jpg', name: 'a.jpg', alt: 'existing alt text' },
      ];
      render(<ImageAltTextList {...defaultProps} images={imagesWithAlt} />);
      expect(screen.getByDisplayValue('existing alt text')).toBeInTheDocument();
    });

    it('does not render regenerate buttons when onRegenerate prop is absent', () => {
      render(<ImageAltTextList {...defaultProps} />);
      expect(screen.queryByRole('button', { name: /generate new suggestion/i })).not.toBeInTheDocument();
    });

    it('renders regenerate buttons when onRegenerate prop is provided', () => {
      render(<ImageAltTextList {...defaultProps} onRegenerate={vi.fn()} />);
      expect(screen.getAllByRole('button', { name: /generate new suggestion/i })).toHaveLength(2);
    });
  });

  describe('Regeneration loading state', () => {
    it('shows pulsing "AI text is generating..." placeholder while regenerating', async () => {
      const user = userEvent.setup();
      // onRegenerate returns a promise that we can control
      let resolveRegen!: () => void;
      const onRegenerate = vi.fn(
        () => new Promise<void>(resolve => { resolveRegen = resolve; })
      );

      render(<ImageAltTextList {...defaultProps} onRegenerate={onRegenerate} />);

      const regenButtons = screen.getAllByRole('button', { name: /generate new suggestion/i });
      await user.click(regenButtons[0]);

      // While pending: placeholder shown, textarea hidden
      expect(screen.getByText('AI text is generating...')).toBeInTheDocument();
      expect(screen.queryAllByRole('textbox')).toHaveLength(1); // only the other image's textarea remains

      // Resolve and verify loading stops
      resolveRegen();
      await waitFor(() => {
        expect(screen.queryByText('AI text is generating...')).not.toBeInTheDocument();
      });
      expect(screen.getAllByRole('textbox')).toHaveLength(2);
    });

    it('only shows loading placeholder for the clicked image, not all images', async () => {
      const user = userEvent.setup();
      let resolveRegen!: () => void;
      const onRegenerate = vi.fn(
        () => new Promise<void>(resolve => { resolveRegen = resolve; })
      );

      render(<ImageAltTextList {...defaultProps} onRegenerate={onRegenerate} />);

      const regenButtons = screen.getAllByRole('button', { name: /generate new suggestion/i });
      await user.click(regenButtons[0]); // click first image's regenerate

      // The second image's textarea should still be visible
      expect(screen.getAllByRole('textbox')).toHaveLength(1);

      resolveRegen();
      await waitFor(() => expect(screen.getAllByRole('textbox')).toHaveLength(2));
    });

    it('disables ALL items apply and regenerate buttons when any single item is regenerating', async () => {
      const user = userEvent.setup();
      let resolveRegen!: () => void;
      const onRegenerate = vi.fn(
        () => new Promise<void>(resolve => { resolveRegen = resolve; })
      );

      render(<ImageAltTextList {...defaultProps} onRegenerate={onRegenerate} />);

      const regenButtons = screen.getAllByRole('button', { name: /generate new suggestion/i });
      const applyButtons = screen.getAllByRole('button', { name: /apply alt text/i });

      await user.click(regenButtons[0]);

      // ALL buttons across ALL items should be disabled while any item regenerates
      expect(regenButtons[0]).toBeDisabled();
      expect(applyButtons[0]).toBeDisabled();
      expect(regenButtons[1]).toBeDisabled();
      expect(applyButtons[1]).toBeDisabled();

      resolveRegen();
      await waitFor(() => expect(regenButtons[0]).not.toBeDisabled());
      // After completion, second item's buttons re-enable too
      expect(regenButtons[1]).not.toBeDisabled();
      expect(applyButtons[1]).not.toBeDisabled();
    });

    it('does not call onRegenerate when disabled prop is true (Generate All running)', async () => {
      const user = userEvent.setup();
      const onRegenerate = vi.fn().mockResolvedValue(undefined);

      render(<ImageAltTextList {...defaultProps} onRegenerate={onRegenerate} disabled={true} />);

      const regenButtons = screen.getAllByRole('button', { name: /generate new suggestion/i });
      await user.click(regenButtons[0]);

      expect(onRegenerate).not.toHaveBeenCalled();
    });

    it('stops loading after regeneration resolves', async () => {
      const user = userEvent.setup();
      const onRegenerate = vi.fn().mockResolvedValue(undefined);

      render(<ImageAltTextList {...defaultProps} onRegenerate={onRegenerate} />);

      const regenButtons = screen.getAllByRole('button', { name: /generate new suggestion/i });
      await user.click(regenButtons[0]);

      await waitFor(() => {
        expect(screen.queryByText('AI text is generating...')).not.toBeInTheDocument();
      });
      expect(screen.getAllByRole('textbox')).toHaveLength(2);
    });

    it('stops loading even when regeneration throws', async () => {
      const user = userEvent.setup();
      const onRegenerate = vi.fn().mockRejectedValue(new Error('Network error'));

      render(<ImageAltTextList {...defaultProps} onRegenerate={onRegenerate} />);

      const regenButtons = screen.getAllByRole('button', { name: /generate new suggestion/i });
      await user.click(regenButtons[0]);

      await waitFor(() => {
        expect(screen.queryByText('AI text is generating...')).not.toBeInTheDocument();
      });
      expect(screen.getAllByRole('textbox')).toHaveLength(2);
    });

    it('calls onRegenerate with the correct image and index', async () => {
      const user = userEvent.setup();
      const onRegenerate = vi.fn().mockResolvedValue(undefined);

      render(<ImageAltTextList {...defaultProps} onRegenerate={onRegenerate} />);

      const regenButtons = screen.getAllByRole('button', { name: /generate new suggestion/i });
      await user.click(regenButtons[1]); // second image

      await waitFor(() => expect(onRegenerate).toHaveBeenCalled());
      expect(onRegenerate).toHaveBeenCalledWith(mockImages[1], 1);
    });
  });

  describe('Apply functionality', () => {
    it('calls onApply with the image and current textarea text', async () => {
      const user = userEvent.setup();
      const onApply = vi.fn().mockResolvedValue({ success: true });
      const imagesWithAlt: ImageAltTextItem[] = [
        { id: 'img_1', url: 'https://example.com/a.jpg', name: 'a.jpg', alt: 'my alt text' },
      ];

      render(<ImageAltTextList {...defaultProps} images={imagesWithAlt} onApply={onApply} />);

      const applyButtons = screen.getAllByRole('button', { name: /apply alt text/i });
      await user.click(applyButtons[0]);

      await waitFor(() => expect(onApply).toHaveBeenCalled());
      expect(onApply).toHaveBeenCalledWith({
        image: imagesWithAlt[0],
        newAltText: 'my alt text',
      });
    });
  });

  describe('Disabled state', () => {
    it('disables all buttons when disabled prop is true', () => {
      render(
        <ImageAltTextList
          {...defaultProps}
          onRegenerate={vi.fn()}
          disabled={true}
        />
      );
      screen.getAllByRole('button').forEach(btn => expect(btn).toBeDisabled());
    });
  });
});
