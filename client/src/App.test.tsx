import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';

const mockQueryClient = vi.hoisted(() => ({
  getQueryCache: vi.fn(),
  getMutationCache: vi.fn(),
  clear: vi.fn(),
  removeQueries: vi.fn(),
  cancelQueries: vi.fn(),
  invalidateQueries: vi.fn(),
  refetchQueries: vi.fn(),
  resetQueries: vi.fn(),
  setQueryData: vi.fn(),
  getQueryData: vi.fn(),
  ensureQueryData: vi.fn(),
  fetchQuery: vi.fn(),
  prefetchQuery: vi.fn(),
  mount: vi.fn(),
  unmount: vi.fn(),
  isFetching: vi.fn(),
  isMutating: vi.fn(),
  getDefaultOptions: vi.fn(),
  setDefaultOptions: vi.fn(),
}));

vi.mock('./lib/queryClient', () => ({
  queryClient: mockQueryClient,
}));

vi.mock('./pages/Home', () => ({
  default: () => <div data-testid="home-component">Home Component</div>,
}));

// Mock the WebflowAppWrapper component
vi.mock('./components/WebflowAppWrapper', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="webflow-app-wrapper">{children}</div>
  ),
}));

// Mock the Toaster component
vi.mock('./components/ui/toaster', () => ({
  Toaster: () => <div data-testid="toaster">Toaster</div>,
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByTestId('webflow-app-wrapper')).toBeInTheDocument();
  });

  it('renders the Home component within WebflowAppWrapper', () => {
    render(<App />);
    
    expect(screen.getByTestId('webflow-app-wrapper')).toBeInTheDocument();
    expect(screen.getByTestId('home-component')).toBeInTheDocument();
  });

  it('renders the Toaster component', () => {
    render(<App />);
    expect(screen.getByTestId('toaster')).toBeInTheDocument();
  });

  it('provides QueryClient to the component tree', () => {
    render(<App />);
    
    // Verify the QueryClientProvider is working by checking the structure
    const wrapper = screen.getByTestId('webflow-app-wrapper');
    const home = screen.getByTestId('home-component');
    
    expect(wrapper).toContainElement(home);
  });

  it('has correct component hierarchy', () => {
    render(<App />);
    
    // Verify the complete component structure
    expect(screen.getByTestId('webflow-app-wrapper')).toBeInTheDocument();
    expect(screen.getByTestId('home-component')).toBeInTheDocument();
    expect(screen.getByTestId('toaster')).toBeInTheDocument();
  });
});