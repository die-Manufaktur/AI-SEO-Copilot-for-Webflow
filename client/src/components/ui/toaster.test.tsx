import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toaster } from './toaster';

// Mock the useToast hook
const mockToasts = [
  {
    id: '1',
    title: 'Success',
    description: 'Operation completed successfully',
    action: null,
    variant: 'default' as const,
  },
  {
    id: '2',
    title: 'Error',
    description: 'Something went wrong',
    action: <button>Retry</button>,
    variant: 'destructive' as const,
  },
];

const mockUseToast = vi.fn();

vi.mock('../../hooks/use-toast', () => ({
  useToast: () => mockUseToast(),
}));

describe('Toaster', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without errors when no toasts are present', () => {
    mockUseToast.mockReturnValue({
      toasts: [],
    });

    const { container } = render(<Toaster />);
    
    // The Toaster component should render without throwing errors
    expect(container.firstChild).toBeInTheDocument();
    
    // Should not have any toast content when toasts array is empty
    expect(screen.queryByText('Success')).not.toBeInTheDocument();
    expect(screen.queryByText('Error')).not.toBeInTheDocument();
  });

  it('renders toasts with titles and descriptions', async () => {
    mockUseToast.mockReturnValue({
      toasts: mockToasts,
    });

    render(<Toaster />);

    // Wait for toasts to be rendered
    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument();
    });

    expect(screen.getByText('Operation completed successfully')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders toast with title only when description is not provided', async () => {
    const toastWithoutDescription = [
      {
        id: '1',
        title: 'Title Only',
        description: undefined,
        action: null,
        variant: 'default' as const,
      },
    ];

    mockUseToast.mockReturnValue({
      toasts: toastWithoutDescription,
    });

    render(<Toaster />);

    await waitFor(() => {
      expect(screen.getByText('Title Only')).toBeInTheDocument();
    });

    // Description should not be rendered when undefined
    expect(screen.queryByText('Operation completed successfully')).not.toBeInTheDocument();
  });

  it('renders toast with description only when title is not provided', async () => {
    const toastWithoutTitle = [
      {
        id: '1',
        title: undefined,
        description: 'Description only',
        action: null,
        variant: 'default' as const,
      },
    ];

    mockUseToast.mockReturnValue({
      toasts: toastWithoutTitle,
    });

    render(<Toaster />);

    await waitFor(() => {
      expect(screen.getByText('Description only')).toBeInTheDocument();
    });

    // Title should not be rendered when undefined
    expect(screen.queryByText('Success')).not.toBeInTheDocument();
  });

  it('renders action buttons when provided', async () => {
    mockUseToast.mockReturnValue({
      toasts: mockToasts,
    });

    render(<Toaster />);

    await waitFor(() => {
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('renders close buttons for all toasts', async () => {
    mockUseToast.mockReturnValue({
      toasts: mockToasts,
    });

    render(<Toaster />);

    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument();
    });

    // Look for close buttons by their aria-label or data attribute
    const closeButtons = screen.getAllByRole('button');
    expect(closeButtons.length).toBeGreaterThanOrEqual(2); // At least close buttons for each toast
  });

  it('handles action button interactions without throwing errors', async () => {
    const user = userEvent.setup();
    const mockOnClick = vi.fn();
    const mockAction = <button onClick={mockOnClick}>Action</button>;
    
    const toastWithAction = [
      {
        id: '1',
        title: 'Test',
        description: 'Test description',
        action: mockAction,
        variant: 'default' as const,
      },
    ];

    mockUseToast.mockReturnValue({
      toasts: toastWithAction,
    });

    render(<Toaster />);

    await waitFor(() => {
      expect(screen.getByText('Action')).toBeInTheDocument();
    });

    const actionButton = screen.getByText('Action');
    
    // Test that we can interact with the button without errors
    await user.click(actionButton);
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('applies custom props to toast elements', async () => {
    const toastWithProps = [
      {
        id: '1',
        title: 'Test',
        description: 'Test description',
        action: null,
        variant: 'destructive' as const,
        className: 'custom-class',
        'data-testid': 'custom-toast',
      },
    ];

    mockUseToast.mockReturnValue({
      toasts: toastWithProps,
    });

    render(<Toaster />);

    await waitFor(() => {
      expect(screen.getByTestId('custom-toast')).toBeInTheDocument();
    });

    const toast = screen.getByTestId('custom-toast');
    expect(toast).toHaveClass('custom-class');
  });

  it('handles multiple toasts correctly based on TOAST_LIMIT', async () => {
    // Based on your use-toast.ts, TOAST_LIMIT = 1, so only the last toast should be shown
    const multipleToasts = [
      {
        id: '1',
        title: 'First Toast',
        description: 'First description',
        action: null,
        variant: 'default' as const,
      },
      {
        id: '2',
        title: 'Second Toast',
        description: 'Second description',
        action: null,
        variant: 'destructive' as const,
      },
      {
        id: '3',
        title: 'Third Toast',
        description: 'Third description',
        action: null,
        variant: 'default' as const,
      },
    ];

    mockUseToast.mockReturnValue({
      toasts: multipleToasts,
    });

    render(<Toaster />);

    // Wait for toasts to be rendered
    await waitFor(() => {
      expect(screen.getByText('First Toast')).toBeInTheDocument();
    });

    // All toasts should be rendered since we're mocking the toasts array directly
    expect(screen.getByText('Second Toast')).toBeInTheDocument();
    expect(screen.getByText('Third Toast')).toBeInTheDocument();
    expect(screen.getByText('First description')).toBeInTheDocument();
    expect(screen.getByText('Second description')).toBeInTheDocument();
    expect(screen.getByText('Third description')).toBeInTheDocument();
  });

  it('updates when toasts change', async () => {
    // Start with no toasts
    mockUseToast.mockReturnValue({
      toasts: [],
    });

    const { rerender } = render(<Toaster />);
    
    expect(screen.queryByText('New Toast')).not.toBeInTheDocument();

    // Add a toast
    mockUseToast.mockReturnValue({
      toasts: [
        {
          id: '1',
          title: 'New Toast',
          description: 'New description',
          action: null,
          variant: 'default' as const,
        },
      ],
    });

    rerender(<Toaster />);

    await waitFor(() => {
      expect(screen.getByText('New Toast')).toBeInTheDocument();
    });
  });

  it('renders the toast provider structure', () => {
    mockUseToast.mockReturnValue({
      toasts: [],
    });

    const { container } = render(<Toaster />);

    // Verify the component renders and has the expected structure
    expect(container.firstChild).toBeInTheDocument();
    
    // The ToastProvider should create the necessary DOM structure
    // Even without toasts, the provider and viewport should be present in the DOM
    expect(container.querySelector('[data-radix-collection-item]')).toBeFalsy(); // No toasts
  });

  it('integrates with the toast system correctly', async () => {
    // Test that the component properly handles the toast state structure
    const singleToast = [
      {
        id: 'integration-test',
        title: 'Integration Test',
        description: 'Testing toast integration',
        action: null,
        variant: 'default' as const,
        open: true, // This matches the toast system's structure
      },
    ];

    mockUseToast.mockReturnValue({
      toasts: singleToast,
    });

    render(<Toaster />);

    await waitFor(() => {
      expect(screen.getByText('Integration Test')).toBeInTheDocument();
    });

    expect(screen.getByText('Testing toast integration')).toBeInTheDocument();
  });
});