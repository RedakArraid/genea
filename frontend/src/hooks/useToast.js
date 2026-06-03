import { useContext } from 'react';
import { ToastContext } from '../contexts/ToastContext';

/**
 * Hook personnalisé pour accéder au contexte des notifications toast
 * @returns {Object} Les méthodes et états du contexte des toasts
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  return context;
};