import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';

/**
 * Composant de légende sous forme de bouton d'aide
 */
const LegendTooltip = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleLegend = () => setIsOpen(!isOpen);

  return (
    <div className="fixed top-4 left-4 z-20">
      {/* Bouton légende */}
      <button
        onClick={toggleLegend}
        className="w-10 h-10 bg-slate-500 dark:bg-slate-600 text-white rounded-full shadow-lg hover:bg-slate-600 dark:hover:bg-slate-700 transition-colors duration-200 flex items-center justify-center"
        title="Légende des connexions"
      >
        <Info className="w-5 h-5" />
      </button>

      {/* Panel de légende */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: -20 }}
            transition={{ duration: 0.2 }}
            className="absolute top-12 left-0 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-600 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-slate-100">Légende</h3>
              <button
                onClick={toggleLegend}
                className="text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              {/* Types de connexions */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-slate-100 mb-2">Types de liens</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-0.5 bg-blue-500"></div>
                    <span className="text-gray-600 dark:text-slate-300">Parent-enfant</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-6 h-0.5" 
                      style={{ 
                        background: 'repeating-linear-gradient(to right, #e11d48 0, #e11d48 3px, transparent 3px, transparent 6px)' 
                      }}
                    ></div>
                    <span className="text-gray-600 dark:text-slate-300">Mariage</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-0.5 bg-green-500"></div>
                    <span className="text-gray-600 dark:text-slate-300">Enfant d'union</span>
                  </div>
                </div>
              </div>

              {/* Points de connexion */}
              <div className="pt-2 border-t border-gray-200 dark:border-slate-600">
                <h4 className="font-medium text-gray-900 dark:text-slate-100 mb-2">Points de connexion</h4>
                <div className="space-y-1 text-xs text-gray-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>Parent-enfant (haut/bas)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                    <span>Mariage (gauche/droite)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Enfant d'union (bas)</span>
                  </div>
                </div>
              </div>

              {/* Instructions rapides */}
              <div className="bg-blue-50 dark:bg-slate-700 rounded-lg p-3">
                <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-1 text-xs">💡 Astuce rapide</h4>
                <p className="text-blue-800 dark:text-blue-200 text-xs">
                  Glissez depuis un point coloré pour créer une connexion vers une autre personne
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LegendTooltip;