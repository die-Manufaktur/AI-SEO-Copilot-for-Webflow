import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOnboarding } from './useOnboarding';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

describe('useOnboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('Initial State', () => {
    it('should start at step 0 for new users', () => {
      const { result } = renderHook(() => useOnboarding());
      
      expect(result.current.currentStep).toBe(0);
      expect(result.current.isComplete).toBe(false);
      expect(result.current.hasSeenOnboarding).toBe(false);
    });

    it('should load saved progress from localStorage', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'seo-copilot-onboarding') {
          return JSON.stringify({
            currentStep: 2,
            isComplete: false,
            hasSeenOnboarding: true,
            completedSteps: [0, 1]
          });
        }
        return null;
      });

      const { result } = renderHook(() => useOnboarding());
      
      expect(result.current.currentStep).toBe(2);
      expect(result.current.hasSeenOnboarding).toBe(true);
    });

    it('should handle completed onboarding state', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'seo-copilot-onboarding') {
          return JSON.stringify({
            currentStep: 5,
            isComplete: true,
            hasSeenOnboarding: true,
            completedSteps: [0, 1, 2, 3, 4]
          });
        }
        return null;
      });

      const { result } = renderHook(() => useOnboarding());
      
      expect(result.current.isComplete).toBe(true);
      expect(result.current.shouldShowOnboarding).toBe(false);
    });
  });

  describe('Step Management', () => {
    it('should complete current step and advance', () => {
      const { result } = renderHook(() => useOnboarding());
      
      expect(result.current.currentStep).toBe(0);
      
      act(() => {
        result.current.completeStep(0);
      });
      
      expect(result.current.currentStep).toBe(1);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'seo-copilot-onboarding',
        expect.stringContaining('"currentStep":1')
      );
    });

    it('should not advance if completing wrong step', () => {
      const { result } = renderHook(() => useOnboarding());
      
      act(() => {
        result.current.completeStep(2); // Try to complete step 2 when on step 0
      });
      
      expect(result.current.currentStep).toBe(0);
    });

    it('should mark onboarding complete on last step', () => {
      const { result } = renderHook(() => useOnboarding());
      
      // Complete all steps
      act(() => {
        result.current.completeStep(0);
        result.current.completeStep(1);
        result.current.completeStep(2);
        result.current.completeStep(3);
        result.current.completeStep(4);
      });
      
      expect(result.current.isComplete).toBe(true);
      expect(result.current.currentStep).toBe(5);
    });

    it('should track completed steps', () => {
      const { result } = renderHook(() => useOnboarding());
      
      act(() => {
        result.current.completeStep(0);
        result.current.completeStep(1);
      });
      
      expect(result.current.getStepStatus(0)).toBe('completed');
      expect(result.current.getStepStatus(1)).toBe('completed');
      expect(result.current.getStepStatus(2)).toBe('current');
      expect(result.current.getStepStatus(3)).toBe('upcoming');
    });
  });

  describe('Navigation', () => {
    it('should go to previous step', () => {
      const { result } = renderHook(() => useOnboarding());
      
      act(() => {
        result.current.completeStep(0);
        result.current.completeStep(1);
      });
      
      expect(result.current.currentStep).toBe(2);
      
      act(() => {
        result.current.goToPreviousStep();
      });
      
      expect(result.current.currentStep).toBe(1);
    });

    it('should not go before step 0', () => {
      const { result } = renderHook(() => useOnboarding());
      
      act(() => {
        result.current.goToPreviousStep();
      });
      
      expect(result.current.currentStep).toBe(0);
    });

    it('should go to specific step if allowed', () => {
      const { result } = renderHook(() => useOnboarding());
      
      act(() => {
        result.current.completeStep(0);
        result.current.completeStep(1);
        result.current.completeStep(2);
      });
      
      act(() => {
        result.current.goToStep(1);
      });
      
      expect(result.current.currentStep).toBe(1);
    });

    it('should not go to uncompleted step', () => {
      const { result } = renderHook(() => useOnboarding());
      
      act(() => {
        result.current.goToStep(3); // Try to jump ahead
      });
      
      expect(result.current.currentStep).toBe(0);
    });
  });

  describe('API Key Management', () => {
    it('should save API key', () => {
      const { result } = renderHook(() => useOnboarding());
      
      act(() => {
        result.current.setApiKey('sk-test123');
      });
      
      expect(result.current.apiKey).toBe('sk-test123');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'seo-copilot-api-key',
        'sk-test123'
      );
    });

    it('should validate API key format', () => {
      const { result } = renderHook(() => useOnboarding());
      
      const invalidResult = result.current.validateApiKey('invalid');
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.error).toBeTruthy();
      
      const validResult = result.current.validateApiKey('sk-1234567890abcdefghijklmnopqrstuvwxyz');
      expect(validResult.isValid).toBe(true);
      expect(validResult.error).toBeNull();
    });

    it('should load saved API key', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'seo-copilot-api-key') {
          return 'sk-saved-key';
        }
        return null;
      });

      const { result } = renderHook(() => useOnboarding());
      expect(result.current.apiKey).toBe('sk-saved-key');
    });
  });

  describe('Skip and Reset', () => {
    it('should skip onboarding', () => {
      const { result } = renderHook(() => useOnboarding());
      
      act(() => {
        result.current.skipOnboarding();
      });
      
      expect(result.current.isComplete).toBe(true);
      expect(result.current.hasSeenOnboarding).toBe(true);
      expect(result.current.shouldShowOnboarding).toBe(false);
    });

    it('should reset onboarding', () => {
      const { result } = renderHook(() => useOnboarding());
      
      // Complete some steps first
      act(() => {
        result.current.completeStep(0);
        result.current.completeStep(1);
        result.current.skipOnboarding();
      });
      
      expect(result.current.isComplete).toBe(true);
      
      // Reset
      act(() => {
        result.current.resetOnboarding();
      });
      
      expect(result.current.currentStep).toBe(0);
      expect(result.current.isComplete).toBe(false);
      expect(result.current.hasSeenOnboarding).toBe(false);
    });
  });

  describe('Step Information', () => {
    it('should provide step details', () => {
      const { result } = renderHook(() => useOnboarding());
      
      const stepInfo = result.current.getStepInfo(0);
      expect(stepInfo).toMatchObject({
        title: expect.any(String),
        description: expect.any(String),
        component: expect.any(String)
      });
    });

    it('should return null for invalid step', () => {
      const { result } = renderHook(() => useOnboarding());
      
      const stepInfo = result.current.getStepInfo(10);
      expect(stepInfo).toBeNull();
    });

    it('should track time spent on steps', async () => {
      vi.useFakeTimers();
      
      try {
        const { result } = renderHook(() => useOnboarding());
        
        // Fast-forward time a bit to ensure different timestamps
        act(() => {
          vi.advanceTimersByTime(100);
        });
        
        act(() => {
          result.current.completeStep(0);
        });
        
        const timeSpent = result.current.getTimeSpentOnStep(0);
        expect(timeSpent).toBeGreaterThan(0);
        expect(timeSpent).toBeLessThan(1000); // Should be quick in tests
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('Analytics', () => {
    it('should track onboarding events', () => {
      const mockTrackEvent = vi.fn();
      const { result } = renderHook(() => useOnboarding({ trackEvent: mockTrackEvent }));
      
      act(() => {
        result.current.completeStep(0);
      });
      
      expect(mockTrackEvent).toHaveBeenCalledWith('onboarding_step_completed', {
        step: 0,
        timeSpent: expect.any(Number)
      });
    });

    it('should track skip event', () => {
      const mockTrackEvent = vi.fn();
      const { result } = renderHook(() => useOnboarding({ trackEvent: mockTrackEvent }));
      
      act(() => {
        result.current.skipOnboarding();
      });
      
      expect(mockTrackEvent).toHaveBeenCalledWith('onboarding_skipped', {
        atStep: 0
      });
    });

    it('should track completion event', () => {
      const mockTrackEvent = vi.fn();
      const { result } = renderHook(() => useOnboarding({ trackEvent: mockTrackEvent }));
      
      act(() => {
        result.current.completeStep(0);
      });
      
      act(() => {
        result.current.completeStep(1);
      });
      
      act(() => {
        result.current.completeStep(2);
      });
      
      act(() => {
        result.current.completeStep(3);
      });
      
      act(() => {
        result.current.completeStep(4);
      });
      
      expect(mockTrackEvent).toHaveBeenCalledWith('onboarding_completed', {
        totalTimeSpent: expect.any(Number)
      });
    });
  });

  describe('Persistence', () => {
    it('should persist state changes', () => {
      const { result } = renderHook(() => useOnboarding());
      
      act(() => {
        result.current.completeStep(0);
      });
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'seo-copilot-onboarding',
        expect.stringContaining('"currentStep":1')
      );
    });

    it('should handle corrupted localStorage data', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json');
      
      const { result } = renderHook(() => useOnboarding());
      
      expect(result.current.currentStep).toBe(0);
      expect(result.current.isComplete).toBe(false);
    });
  });
});