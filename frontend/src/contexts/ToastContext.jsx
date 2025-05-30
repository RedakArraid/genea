import React, { createContext, useState, useCallback } from 'react';

// Création du contexte pour les notifications toast
export const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // Ajouter une notification toast
  const showToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now().toString();
    
    const newToast = {
      id,
      message,
      type,
      duration
    };
    
    setToasts(prevToasts => [...prevToasts, newToast]);
    
    // Supprimer automatiquement après la durée spécifiée
    setTimeout(() => {
      dismissToast(id);
    }, duration);
    
    return id;
  }, []);

  // Supprimer une notification toast
  const dismissToast = useCallback((id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  // Valeurs à exposer via le contexte
  const contextValue = {
    toasts,
    showToast,
    dismissToast
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
    </ToastContext.Provider>
  );
};