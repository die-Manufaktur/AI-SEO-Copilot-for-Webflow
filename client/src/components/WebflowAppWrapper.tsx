import React, { useEffect } from 'react';

interface WebflowAppWrapperProps {
  children: React.ReactNode;
}

export default function WebflowAppWrapper({ children }: WebflowAppWrapperProps) {
  useEffect(() => {
    // Set extension size to "large" when component mounts
    if (window.webflow && window.webflow.setExtensionSize) {
      try {
        // Use the "large" preset
        window.webflow.setExtensionSize('large');
        console.log('Extension size set to large');
      } catch (error) {
        console.error('Failed to set extension size:', error);
      }
    } else {
      console.warn('webflow.setExtensionSize is not available');
    }
  }, []);

  return (
    <div id="webflow-app-wrapper" className="bg-background text-text1 min-h-screen">
      {children}
    </div>
  );
}