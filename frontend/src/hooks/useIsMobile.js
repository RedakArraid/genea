import { useState, useEffect } from 'react';

/**
 * Hook pour détecter les appareils mobiles et tablettes
 * Retourne des informations sur le type d'appareil et les capacités tactiles
 */
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Mobile : écran < 768px avec support tactile
      setIsMobile(width <= 768 && hasTouch);
      
      // Tablette : écran entre 769px et 1024px avec support tactile
      setIsTablet(width > 768 && width <= 1024 && hasTouch);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    window.addEventListener('orientationchange', checkDevice);
    
    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, []);

  const isTouchDevice = isMobile || isTablet;

  return { 
    isMobile, 
    isTablet, 
    isTouchDevice,
    // Utilitaires supplémentaires
    isPortrait: window.innerHeight > window.innerWidth,
    screenSize: {
      width: window.innerWidth,
      height: window.innerHeight
    }
  };
};

export default useIsMobile;
