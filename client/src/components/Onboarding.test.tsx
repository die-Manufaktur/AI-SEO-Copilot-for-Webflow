import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Onboarding } from './Onboarding';
import { useOnboarding } from '../hooks/useOnboarding';

// Mock the onboarding hook
vi.mock('../hooks/useOnboarding', () => ({
  useOnboarding: vi.fn()
}));

describe('Onboarding', () => {
  const mockCompleteStep = vi.fn();
  const mockSkipOnboarding = vi.fn();
  const mockResetOnboarding = vi.fn();
  const mockSetApiKey = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useOnboarding as any).mockReturnValue({
      currentStep: 0,
      totalSteps: 5,
      isComplete: false,
      hasSeenOnboarding: false,
      completeStep: mockCompleteStep,
      skipOnboarding: mockSkipOnboarding,
      resetOnboarding: mockResetOnboarding,
      setApiKey: mockSetApiKey,
      apiKey: null
    });
  });

  describe('First Time User', () => {
    it('should show welcome screen for first time users', () => {
      render(<Onboarding />);
      expect(screen.getByText(/welcome to ai seo copilot/i)).toBeInTheDocument();
      expect(screen.getByText(/let's get you set up/i)).toBeInTheDocument();
    });

    it('should show progress indicator', () => {
      render(<Onboarding />);
      expect(screen.getByText(/step 1 of 5/i)).toBeInTheDocument();
    });

    it('should allow skipping onboarding', async () => {
      render(<Onboarding />);
      const skipButton = screen.getByText(/skip tour/i);
      
      await userEvent.click(skipButton);
      expect(mockSkipOnboarding).toHaveBeenCalled();
    });
  });

  describe('Step Navigation', () => {
    it('should navigate through steps', async () => {
      const { rerender } = render(<Onboarding />);
      
      // Step 1 - Welcome
      expect(screen.getByText(/welcome to ai seo copilot/i)).toBeInTheDocument();
      await userEvent.click(screen.getByText(/get started/i));
      expect(mockCompleteStep).toHaveBeenCalledWith(0);

      // Update mock to reflect step 2
      (useOnboarding as any).mockReturnValue({
        currentStep: 1,
        totalSteps: 5,
        isComplete: false,
        hasSeenOnboarding: false,
        completeStep: mockCompleteStep,
        skipOnboarding: mockSkipOnboarding,
        resetOnboarding: mockResetOnboarding,
        setApiKey: mockSetApiKey,
        apiKey: null
      });
      rerender(<Onboarding />);

      // Step 2 - API Key Setup
      expect(screen.getByText(/openai api key/i)).toBeInTheDocument();
    });

    it('should show previous button after first step', async () => {
      (useOnboarding as any).mockReturnValue({
        currentStep: 1,
        totalSteps: 5,
        isComplete: false,
        hasSeenOnboarding: false,
        completeStep: mockCompleteStep,
        skipOnboarding: mockSkipOnboarding,
        resetOnboarding: mockResetOnboarding,
        setApiKey: mockSetApiKey,
        apiKey: null
      });

      render(<Onboarding />);
      expect(screen.getByText(/previous/i)).toBeInTheDocument();
    });
  });

  describe('API Key Setup', () => {
    it('should validate API key format', async () => {
      (useOnboarding as any).mockReturnValue({
        currentStep: 1,
        totalSteps: 5,
        isComplete: false,
        hasSeenOnboarding: false,
        completeStep: mockCompleteStep,
        skipOnboarding: mockSkipOnboarding,
        resetOnboarding: mockResetOnboarding,
        setApiKey: mockSetApiKey,
        apiKey: null
      });

      render(<Onboarding />);
      const input = screen.getByPlaceholderText(/sk-/i);
      const continueButton = screen.getByText(/continue/i);

      // Invalid key
      await userEvent.type(input, 'invalid-key');
      await userEvent.click(continueButton);
      expect(screen.getByText(/invalid api key format/i)).toBeInTheDocument();

      // Valid key
      await userEvent.clear(input);
      await userEvent.type(input, 'sk-1234567890abcdefghijklmnopqrstuvwxyz');
      await userEvent.click(continueButton);
      expect(mockSetApiKey).toHaveBeenCalled();
    });

    it('should allow skipping API key setup', async () => {
      (useOnboarding as any).mockReturnValue({
        currentStep: 1,
        totalSteps: 5,
        isComplete: false,
        hasSeenOnboarding: false,
        completeStep: mockCompleteStep,
        skipOnboarding: mockSkipOnboarding,
        resetOnboarding: mockResetOnboarding,
        setApiKey: mockSetApiKey,
        apiKey: null
      });

      render(<Onboarding />);
      const skipButton = screen.getByText(/skip for now/i);
      
      await userEvent.click(skipButton);
      expect(mockCompleteStep).toHaveBeenCalledWith(1);
    });
  });

  describe('Feature Introduction', () => {
    it('should show key features', () => {
      (useOnboarding as any).mockReturnValue({
        currentStep: 2,
        totalSteps: 5,
        isComplete: false,
        hasSeenOnboarding: false,
        completeStep: mockCompleteStep,
        skipOnboarding: mockSkipOnboarding,
        resetOnboarding: mockResetOnboarding,
        setApiKey: mockSetApiKey,
        apiKey: 'sk-test'
      });

      render(<Onboarding />);
      expect(screen.getByText(/seo analysis/i)).toBeInTheDocument();
      expect(screen.getByText(/ai recommendations/i)).toBeInTheDocument();
      expect(screen.getByText(/one-click apply/i)).toBeInTheDocument();
    });

    it('should show feature animations', () => {
      (useOnboarding as any).mockReturnValue({
        currentStep: 2,
        totalSteps: 5,
        isComplete: false,
        hasSeenOnboarding: false,
        completeStep: mockCompleteStep,
        skipOnboarding: mockSkipOnboarding,
        resetOnboarding: mockResetOnboarding,
        setApiKey: mockSetApiKey,
        apiKey: 'sk-test'
      });

      render(<Onboarding />);
      const features = screen.getAllByTestId(/feature-card/i);
      features.forEach(feature => {
        expect(feature).toHaveClass('animate-fade-in');
      });
    });
  });

  describe('Interactive Demo', () => {
    it('should show interactive demo elements', () => {
      (useOnboarding as any).mockReturnValue({
        currentStep: 3,
        totalSteps: 5,
        isComplete: false,
        hasSeenOnboarding: false,
        completeStep: mockCompleteStep,
        skipOnboarding: mockSkipOnboarding,
        resetOnboarding: mockResetOnboarding,
        setApiKey: mockSetApiKey,
        apiKey: 'sk-test'
      });

      render(<Onboarding />);
      expect(screen.getByText(/try it yourself/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter keywords/i)).toBeInTheDocument();
      expect(screen.getByText(/analyze/i)).toBeInTheDocument();
    });

    it('should simulate analysis', async () => {
      (useOnboarding as any).mockReturnValue({
        currentStep: 3,
        totalSteps: 5,
        isComplete: false,
        hasSeenOnboarding: false,
        completeStep: mockCompleteStep,
        skipOnboarding: mockSkipOnboarding,
        resetOnboarding: mockResetOnboarding,
        setApiKey: mockSetApiKey,
        apiKey: 'sk-test'
      });

      render(<Onboarding />);
      const keywordInput = screen.getByPlaceholderText(/enter keywords/i);
      const analyzeButton = screen.getByText(/analyze/i);

      await userEvent.type(keywordInput, 'test keywords');
      await userEvent.click(analyzeButton);

      await waitFor(() => {
        expect(screen.getByText(/analysis complete/i)).toBeInTheDocument();
        expect(screen.getByText(/great job/i)).toBeInTheDocument();
      });
    });
  });

  describe('Completion', () => {
    it('should show completion screen', () => {
      (useOnboarding as any).mockReturnValue({
        currentStep: 4,
        totalSteps: 5,
        isComplete: false,
        hasSeenOnboarding: false,
        completeStep: mockCompleteStep,
        skipOnboarding: mockSkipOnboarding,
        resetOnboarding: mockResetOnboarding,
        setApiKey: mockSetApiKey,
        apiKey: 'sk-test'
      });

      render(<Onboarding />);
      expect(screen.getByText(/you're all set/i)).toBeInTheDocument();
      expect(screen.getByText(/start optimizing/i)).toBeInTheDocument();
    });

    it('should complete onboarding when finished', async () => {
      (useOnboarding as any).mockReturnValue({
        currentStep: 4,
        totalSteps: 5,
        isComplete: false,
        hasSeenOnboarding: false,
        completeStep: mockCompleteStep,
        skipOnboarding: mockSkipOnboarding,
        resetOnboarding: mockResetOnboarding,
        setApiKey: mockSetApiKey,
        apiKey: 'sk-test'
      });

      render(<Onboarding />);
      const finishButton = screen.getByText(/start optimizing/i);
      
      await userEvent.click(finishButton);
      expect(mockCompleteStep).toHaveBeenCalledWith(4);
    });
  });

  describe('Returning User', () => {
    it('should not show onboarding for returning users', () => {
      (useOnboarding as any).mockReturnValue({
        currentStep: 5,
        totalSteps: 5,
        isComplete: true,
        hasSeenOnboarding: true,
        completeStep: mockCompleteStep,
        skipOnboarding: mockSkipOnboarding,
        resetOnboarding: mockResetOnboarding,
        setApiKey: mockSetApiKey,
        apiKey: 'sk-test'
      });

      const { container } = render(<Onboarding />);
      expect(container.firstChild).toBeNull();
    });

    it('should allow resetting onboarding from settings', async () => {
      (useOnboarding as any).mockReturnValue({
        currentStep: 5,
        totalSteps: 5,
        isComplete: true,
        hasSeenOnboarding: true,
        completeStep: mockCompleteStep,
        skipOnboarding: mockSkipOnboarding,
        resetOnboarding: mockResetOnboarding,
        setApiKey: mockSetApiKey,
        apiKey: 'sk-test'
      });

      render(<Onboarding showResetOption />);
      const resetButton = screen.getByText(/restart tour/i);
      
      await userEvent.click(resetButton);
      expect(mockResetOnboarding).toHaveBeenCalled();
    });
  });

  describe('Responsive Design', () => {
    it('should adapt to small screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 400
      });

      render(<Onboarding />);
      const modal = screen.getByTestId('onboarding-modal');
      expect(modal).toHaveClass('max-w-full');
    });

    it('should show full width on desktop', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200
      });

      render(<Onboarding />);
      const modal = screen.getByTestId('onboarding-modal');
      expect(modal).toHaveClass('max-w-2xl');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<Onboarding />);
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Onboarding');
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '5');
    });

    it('should be keyboard navigable', async () => {
      render(<Onboarding />);
      const continueButton = screen.getByText(/get started/i);
      
      continueButton.focus();
      expect(document.activeElement).toBe(continueButton);
      
      fireEvent.keyDown(continueButton, { key: 'Enter' });
      expect(mockCompleteStep).toHaveBeenCalled();
    });

    it('should trap focus within modal', () => {
      render(<Onboarding />);
      const modal = screen.getByRole('dialog');
      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      expect(focusableElements.length).toBeGreaterThan(0);
    });
  });
});