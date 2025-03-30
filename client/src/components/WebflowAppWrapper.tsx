import React, { useEffect } from 'react';
import { createLogger } from '../lib/utils';

// Create a namespaced logger for the WebflowAppWrapper component
const logger = createLogger('WebflowWrapper');

interface WebflowAppWrapperProps {
  children: React.ReactNode;
}

export default function WebflowAppWrapper({ children }: WebflowAppWrapperProps) {
  useEffect(() => {
    // Set extension size to "large" when component mounts
    if (webflow && webflow.setExtensionSize) {
      try {
        webflow.setExtensionSize({
          width: 500,
          height: 720
        });
      } catch (error) {
        logger.error('Failed to set extension size:', error);
      }
    } else {
      logger.warn('webflow.setExtensionSize is not available');
    }
  }, []);

  return (
    <div id="webflow-app-wrapper" className="bg-background text-text1 min-h-screen">
      {children}
    </div>
  );
}