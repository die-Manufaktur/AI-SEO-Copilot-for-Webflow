import React, { useEffect } from 'react';
import { createLogger } from '../lib/utils';

// Create a namespaced logger for the WebflowAppWrapper component
const logger = createLogger('WebflowWrapper');

interface WebflowAppWrapperProps {
  children: React.ReactNode;
}

export default function WebflowAppWrapper({ children }: WebflowAppWrapperProps) {
  useEffect(() => {
    const setSize = () => {
      if (window.webflow?.setExtensionSize) {
        try {
          window.webflow.setExtensionSize({ width: 715, height: 800 });
          return true;
        } catch (error) {
          logger.error('Failed to set extension size:', error);
          return true; // Don't retry on errors — the API exists but threw
        }
      }
      return false;
    };

    if (!setSize()) {
      // Retry until window.webflow is injected by the Designer
      const interval = setInterval(() => {
        if (setSize()) clearInterval(interval);
      }, 100);
      // Stop trying after 10 seconds
      const timeout = setTimeout(() => {
        clearInterval(interval);
        logger.warn('webflow.setExtensionSize not available after 10s');
      }, 10_000);
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, []);

  return (
    <div
      id="webflow-app-wrapper"
      data-testid="webflow-app-wrapper"
      style={{ width: 715, minWidth: 715, maxWidth: 715 }}
      className="bg-background text-text1"
    >
      {children}
    </div>
  );
}