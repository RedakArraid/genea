import React from 'react';
import { useToast } from '../../hooks/useToast';

/**
 * Composant Toaster - Affiche les notifications toast
 */
const Toaster = () => {
  const { toasts, dismissToast } = useToast();

  // Si aucun toast, ne rien afficher
  if (toasts.length === 0) {
    return null;
  }

  // Définir les classes selon le type de toast
  const getToastClasses = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-500 text-white';
      case 'error':
        return 'bg-red-500 text-white';
      case 'warning':
        return 'bg-yellow-500 text-white';
      case 'info':
      default:
        return 'bg-primary text-primary-foreground';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${getToastClasses(toast.type)} rounded-lg shadow-lg p-4 flex items-start justify-between transition-all duration-300 ease-in-out animate-in slide-in-from-right`}
        >
          {/* Message du toast */}
          <div className="flex-1 mr-2">
            {toast.message}
          </div>
          
          {/* Bouton pour fermer le toast */}
          <button
            onClick={() => dismissToast(toast.id)}
            className="text-sm font-medium opacity-70 hover:opacity-100"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};

export default Toaster;