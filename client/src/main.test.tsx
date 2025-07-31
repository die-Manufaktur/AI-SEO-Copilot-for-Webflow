import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock React DOM
const mockRender = vi.fn();
const mockCreateRoot = vi.fn(() => ({
  render: mockRender,
}));

vi.mock('react-dom/client', () => ({
  createRoot: mockCreateRoot,
}));

// Mock the App component
vi.mock('./App', () => ({
  default: () => 'App Component',
}));

// Mock CSS import
vi.mock('./index.css', () => ({}));

describe('main.tsx', () => {
  beforeEach(() => {
    // Setup clean DOM environment
    document.body.innerHTML = '<div id="root"></div>';
    vi.clearAllMocks();
  });

  it('renders the App component when root element exists', async () => {
    // Import main.tsx to trigger the rendering logic
    await import('./main');

    // Verify React root was created with correct element
    expect(mockCreateRoot).toHaveBeenCalledWith(
      document.getElementById('root')
    );

    // Verify App component was rendered
    expect(mockRender).toHaveBeenCalledTimes(1);
  });

  it('handles missing root element gracefully', async () => {
    // Remove root element
    document.body.innerHTML = '';
    
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await import('./main');

    // Should not crash, might log error depending on implementation
    expect(mockCreateRoot).not.toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });
});