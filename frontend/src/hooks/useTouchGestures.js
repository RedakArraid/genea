import { useEffect, useRef } from 'react';

/**
 * Hook pour gérer les gestes tactiles sur ReactFlow
 * Ajoute le support pour pinch-to-zoom, double-tap, etc.
 */
export const useTouchGestures = (reactFlowInstance) => {
  const touchStartRef = useRef({});
  const lastTouchTimeRef = useRef(0);
  const isGestureRef = useRef(false);

  useEffect(() => {
    if (!reactFlowInstance) return;

    let startDistance = 0;
    let startScale = 1;
    let initialPinchCenter = { x: 0, y: 0 };

    const handleTouchStart = (e) => {
      if (e.touches.length === 2) {
        // Pinch to zoom - début
        isGestureRef.current = true;
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        
        startDistance = Math.hypot(
          touch1.clientX - touch2.clientX,
          touch1.clientY - touch2.clientY
        );
        
        startScale = reactFlowInstance.getZoom();
        
        initialPinchCenter = {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2
        };
      } else if (e.touches.length === 1) {
        // Touch simple
        isGestureRef.current = false;
        touchStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          time: Date.now()
        };
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length === 2 && isGestureRef.current) {
        // Pinch to zoom - mouvement
        e.preventDefault();
        
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        
        const distance = Math.hypot(
          touch1.clientX - touch2.clientX,
          touch1.clientY - touch2.clientY
        );
        
        // Calculer le nouveau scale avec limites
        const scale = Math.max(0.1, Math.min(4, startScale * (distance / startDistance)));
        
        const currentCenter = {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2
        };
        
        // Zoom vers le centre du pinch
        try {
          reactFlowInstance.zoomTo(scale, { 
            x: currentCenter.x, 
            y: currentCenter.y 
          });
        } catch (error) {
          console.warn('Erreur lors du zoom:', error);
        }
      }
    };

    const handleTouchEnd = (e) => {
      if (e.changedTouches.length === 1 && touchStartRef.current.time && !isGestureRef.current) {
        const touchEnd = {
          x: e.changedTouches[0].clientX,
          y: e.changedTouches[0].clientY,
          time: Date.now()
        };
        
        const touchDuration = touchEnd.time - touchStartRef.current.time;
        const touchDistance = Math.hypot(
          touchEnd.x - touchStartRef.current.x,
          touchEnd.y - touchStartRef.current.y
        );
        
        // Détecter double tap (moins de 300ms entre les taps, mouvement < 20px)
        const timeSinceLastTouch = touchEnd.time - lastTouchTimeRef.current;
        if (timeSinceLastTouch < 300 && touchDistance < 20 && touchDuration < 200) {
          // Double tap détecté - zoom intelligent
          try {
            const currentZoom = reactFlowInstance.getZoom();
            const newZoom = currentZoom < 1 ? 1.5 : currentZoom < 1.5 ? 0.5 : 1;
            
            reactFlowInstance.zoomTo(newZoom, {
              x: touchEnd.x,
              y: touchEnd.y
            }, { duration: 300 });
          } catch (error) {
            console.warn('Erreur lors du double-tap zoom:', error);
          }
        }
        
        lastTouchTimeRef.current = touchEnd.time;
      }
      
      // Reset des états
      isGestureRef.current = false;
      touchStartRef.current = {};
    };

    // Empêcher le zoom natif du navigateur sur les gestes multi-touch
    const handleTouchMovePreventDefault = (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // Empêcher le menu contextuel long-press sur mobile
    const handleContextMenu = (e) => {
      if ('ontouchstart' in window) {
        e.preventDefault();
      }
    };

    const paneElement = document.querySelector('.react-flow__pane');
    if (paneElement) {
      // Événements tactiles
      paneElement.addEventListener('touchstart', handleTouchStart, { passive: true });
      paneElement.addEventListener('touchmove', handleTouchMove, { passive: false });
      paneElement.addEventListener('touchend', handleTouchEnd, { passive: true });
      
      // Empêcher les comportements natifs
      document.addEventListener('touchmove', handleTouchMovePreventDefault, { passive: false });
      paneElement.addEventListener('contextmenu', handleContextMenu);
      
      // Empêcher le zoom au double-tap sur iOS Safari
      paneElement.style.touchAction = 'pan-x pan-y';
    }

    return () => {
      if (paneElement) {
        paneElement.removeEventListener('touchstart', handleTouchStart);
        paneElement.removeEventListener('touchmove', handleTouchMove);
        paneElement.removeEventListener('touchend', handleTouchEnd);
        paneElement.removeEventListener('contextmenu', handleContextMenu);
      }
      document.removeEventListener('touchmove', handleTouchMovePreventDefault);
    };
  }, [reactFlowInstance]);
};

export default useTouchGestures;
