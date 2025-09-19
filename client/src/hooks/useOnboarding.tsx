import { useState, useEffect, useCallback } from 'react';

interface OnboardingStep {
  title: string;
  description: string;
  component: string;
}

interface OnboardingState {
  currentStep: number;
  isComplete: boolean;
  hasSeenOnboarding: boolean;
  completedSteps: number[];
  stepTimestamps: Record<number, { start: number; end?: number }>;
}

interface UseOnboardingOptions {
  trackEvent?: (event: string, data: any) => void;
}

type StepStatus = 'completed' | 'current' | 'upcoming';

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: 'Welcome',
    description: 'Get started with AI SEO Copilot',
    component: 'WelcomeStep'
  },
  {
    title: 'API Key Setup',
    description: 'Configure your OpenAI API key',
    component: 'ApiKeyStep'
  },
  {
    title: 'Features Overview',
    description: 'Learn about key features',
    component: 'FeaturesStep'
  },
  {
    title: 'Try It Out',
    description: 'Interactive demo',
    component: 'DemoStep'
  },
  {
    title: 'All Set!',
    description: 'Start optimizing your content',
    component: 'CompletionStep'
  }
];

const STORAGE_KEY = 'seo-copilot-onboarding';
const API_KEY_STORAGE = 'seo-copilot-api-key';

export const useOnboarding = (options: UseOnboardingOptions = {}) => {
  const { trackEvent } = options;

  const [state, setState] = useState<OnboardingState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load onboarding state:', error);
    }

    return {
      currentStep: 0,
      isComplete: false,
      hasSeenOnboarding: false,
      completedSteps: [],
      stepTimestamps: { 0: { start: Date.now() } }
    };
  });

  const [apiKey, setApiKeyState] = useState<string | null>(() => {
    return localStorage.getItem(API_KEY_STORAGE);
  });

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const completeStep = useCallback((stepIndex: number) => {
    if (stepIndex !== state.currentStep) {
      return; // Can only complete current step
    }

    const endTime = Date.now();
    const startTime = state.stepTimestamps[stepIndex]?.start || endTime;
    const timeSpent = endTime - startTime;

    // Track analytics
    trackEvent?.('onboarding_step_completed', {
      step: stepIndex,
      timeSpent
    });

    setState(prev => {
      const newCompletedSteps = [...prev.completedSteps, stepIndex];
      const nextStep = stepIndex + 1;
      const isLastStep = nextStep >= ONBOARDING_STEPS.length;

      if (isLastStep) {
        // Calculate total time
        const totalTimeSpent = Object.values(prev.stepTimestamps).reduce((total, times) => {
          if (times.end) {
            return total + (times.end - times.start);
          }
          return total + (endTime - times.start);
        }, 0);

        trackEvent?.('onboarding_completed', { totalTimeSpent });
      }

      return {
        ...prev,
        currentStep: nextStep,
        completedSteps: newCompletedSteps,
        isComplete: isLastStep,
        hasSeenOnboarding: true,
        stepTimestamps: {
          ...prev.stepTimestamps,
          [stepIndex]: {
            ...prev.stepTimestamps[stepIndex],
            end: endTime
          },
          ...(isLastStep ? {} : {
            [nextStep]: { start: endTime }
          })
        }
      };
    });
  }, [state.currentStep, state.stepTimestamps, trackEvent]);

  const goToPreviousStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(0, prev.currentStep - 1)
    }));
  }, []);

  const goToStep = useCallback((stepIndex: number) => {
    setState(prev => {
      // Can only go to completed steps or the next step
      const canGoToStep = 
        stepIndex <= prev.currentStep ||
        prev.completedSteps.includes(stepIndex - 1);

      if (!canGoToStep) {
        return prev;
      }

      return {
        ...prev,
        currentStep: stepIndex,
        stepTimestamps: {
          ...prev.stepTimestamps,
          [stepIndex]: prev.stepTimestamps[stepIndex] || { start: Date.now() }
        }
      };
    });
  }, []);

  const skipOnboarding = useCallback(() => {
    trackEvent?.('onboarding_skipped', {
      atStep: state.currentStep
    });

    setState({
      currentStep: ONBOARDING_STEPS.length,
      isComplete: true,
      hasSeenOnboarding: true,
      completedSteps: [],
      stepTimestamps: {}
    });
  }, [state.currentStep, trackEvent]);

  const resetOnboarding = useCallback(() => {
    trackEvent?.('onboarding_reset', {});

    setState({
      currentStep: 0,
      isComplete: false,
      hasSeenOnboarding: false,
      completedSteps: [],
      stepTimestamps: { 0: { start: Date.now() } }
    });
  }, [trackEvent]);

  const setApiKey = useCallback((key: string) => {
    setApiKeyState(key);
    localStorage.setItem(API_KEY_STORAGE, key);
  }, []);

  const validateApiKey = useCallback((key: string): boolean => {
    return /^sk-[a-zA-Z0-9]{32,}$/.test(key);
  }, []);

  const getStepInfo = useCallback((stepIndex: number): OnboardingStep | null => {
    if (stepIndex < 0 || stepIndex >= ONBOARDING_STEPS.length) {
      return null;
    }
    return ONBOARDING_STEPS[stepIndex];
  }, []);

  const getStepStatus = useCallback((stepIndex: number): StepStatus => {
    if (state.completedSteps.includes(stepIndex)) {
      return 'completed';
    }
    if (stepIndex === state.currentStep) {
      return 'current';
    }
    return 'upcoming';
  }, [state.completedSteps, state.currentStep]);

  const getTimeSpentOnStep = useCallback((stepIndex: number): number => {
    const timestamps = state.stepTimestamps[stepIndex];
    if (!timestamps) return 0;

    if (timestamps.end) {
      return timestamps.end - timestamps.start;
    }

    // If step is current, calculate time up to now
    if (stepIndex === state.currentStep) {
      return Date.now() - timestamps.start;
    }

    return 0;
  }, [state.stepTimestamps, state.currentStep]);

  return {
    // State
    currentStep: state.currentStep,
    totalSteps: ONBOARDING_STEPS.length,
    isComplete: state.isComplete,
    hasSeenOnboarding: state.hasSeenOnboarding,
    shouldShowOnboarding: !state.isComplete && state.currentStep < ONBOARDING_STEPS.length,
    apiKey,

    // Actions
    completeStep,
    goToPreviousStep,
    goToStep,
    skipOnboarding,
    resetOnboarding,
    setApiKey,

    // Utilities
    validateApiKey,
    getStepInfo,
    getStepStatus,
    getTimeSpentOnStep
  };
};