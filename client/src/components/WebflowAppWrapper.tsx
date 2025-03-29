import React, { useEffect } from 'react';

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