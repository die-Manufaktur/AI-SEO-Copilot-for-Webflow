import { useState, useEffect } from 'react';

/**
 * Custom hook to detect if the device is mobile based on screen width
 * @returns boolean - true if the device is mobile (screen width < 768px)
 */
export const useMobile = (): boolean => {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    // Check initial screen size
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Set on first render
    checkIfMobile();
    
    // Add listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  return isMobile;
};
