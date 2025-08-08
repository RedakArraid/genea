import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Composant d'aide pour expliquer les fonctionnalités de l'arbre généalogique
 * Maintenant géré par LegendTooltip
 */
const HelpTooltip = ({ isOpen, onToggle }) => {
  const toggleHelp = () => onToggle();

  return (
    <div className="fixed bottom-6 left-6 z-20">
      {/* Panel d'aide */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-16 left-0 w-80 bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-4 max-h-96 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Guide d'utilisation</h3>
              <button
                onClick={toggleHelp}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm text-gray-700">
              {/* Ajouter des personnes */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Ajouter des personnes
                </h4>
                <ul className="space-y-1 pl-6">
                  <li>• Utilisez le bouton "+" flottant en bas à droite</li>
                  <li>• Ou le bouton "Ajouter une personne" en haut</li>
                  <li>• Raccourcis : <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+N</kbd> ou <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">+</kbd></li>
                  <li>• Clic droit sur une personne pour ajouter des relations</li>
                </ul>
              </div>

              {/* Navigation */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3v10" />
                  </svg>
                  Navigation
                </h4>
                <ul className="space-y-1 pl-6">
                  <li>• Glissez pour déplacer la vue</li>
                  <li>• Molette de la souris pour zoomer</li>
                  <li>• Glissez une personne pour la repositionner</li>
                  <li>• Ajuster la vue : <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">F</kbd> ou <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+0</kbd></li>
                </ul>
              </div>

              {/* Relations */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Créer des relations
                </h4>
                <ul className="space-y-1 pl-6">
                  <li>• Clic droit sur une personne</li>
                  <li>• Choisir "Ajouter parent/enfant/conjoint"</li>
                  <li>• Ou glisser depuis un cercle de connexion</li>
                </ul>
              </div>

              {/* Raccourcis clavier */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Raccourcis clavier
                </h4>
                <div className="grid grid-cols-2 gap-2 pl-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Ajouter personne</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Ctrl+N</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Ajuster vue</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">F</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Aide</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">?</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Supprimer</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Del</kbd>
                  </div>
                </div>
              </div>

              {/* Conseils */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-3 border border-green-100">
                <h4 className="font-medium text-green-900 mb-2 text-xs">💡 Conseils</h4>
                <ul className="text-green-800 text-xs space-y-1">
                  <li>• Utilisez les points colorés pour créer des connexions</li>
                  <li>• Les lignes pointillées indiquent les mariages</li>
                  <li>• Les enfants d'union apparaissent sous la ligne de mariage</li>
                  <li>• Sauvegardez régulièrement votre travail</li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HelpTooltip;