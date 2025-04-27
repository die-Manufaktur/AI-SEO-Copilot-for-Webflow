import { vi } from 'vitest';
import type { ToastProps, ToastActionElement } from "../components/ui/toast";
import React from 'react';

/**
 * Internal representation of a toast with all required properties
 * This matches the internal ToasterToast type from use-toast.ts
 */
export type MockToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

/**
 * Creates a mock toast with default values that can be overridden
 */
export const createMockToast = (overrides?: Partial<MockToasterToast>): MockToasterToast => ({
  id: "mock-toast-id",
  title: "Mock Toast Title",
  description: "Mock toast description",
  variant: "default",
  open: true,
  onOpenChange: vi.fn(),
  ...overrides,
});

/**
 * Creates a mock toast state for reducer tests
 */
export const createMockToastState = (toasts: MockToasterToast[] = []) => ({
  toasts
});

/**
 * Mock implementation of setTimeout that doesn't actually create a timer
 */
export const mockSetTimeout = vi.fn().mockImplementation(() => "mock-timeout-id");

/**
 * Restores all toast-related mocks
 */
export const restoreToastMocks = () => {
  vi.restoreAllMocks();
};