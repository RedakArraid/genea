import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Composant pour afficher les notifications de raccourcis clavier
 */
const ShortcutNotification = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenShown, setHasBeenShown] = useState(false);

  useEffect(() => {
    // Afficher la notification après 3 secondes, une seule fois par session
    if (!hasBeenShown) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        setHasBeenShown(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [hasBeenShown]);

  const handleDismiss = () => {
    setIsVisible(false);
  };

  const handleNeverShow = () => {
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-6 left-6 max-w-sm bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-20"
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="w-6 h-6 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-gray-900">Raccourcis utiles ⌨️</h3>
              <div className="mt-2 text-sm text-gray-600">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Ajouter une personne</span>
                    <div className="flex space-x-1">
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Ctrl+N</kbd>
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">+</kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Ajuster la vue</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">F</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Aide</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">?</kbd>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex space-x-2">
                <button
                  onClick={handleDismiss}
                  className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors duration-200 font-medium"
                >
                  Compris ! 👍
                </button>
                <button
                  onClick={handleNeverShow}
                  className="text-xs text-gray-500 hover:text-gray-700 transition-colors duration-200"
                >
                  Masquer
                </button>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 ml-4 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ShortcutNotification;
