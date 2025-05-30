import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Composant d'aide pour expliquer les fonctionnalités de l'arbre généalogique
 */
const HelpTooltip = ({ isOpen, onToggle }) => {
  const toggleHelp = () => onToggle();

  return (
    <div className="fixed top-4 right-4 z-20">
      {/* Bouton d'aide */}
      <button
        onClick={toggleHelp}
        className="w-10 h-10 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors duration-200 flex items-center justify-center"
        title="Aide (Ctrl+H ou ?)"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>

      {/* Panel d'aide */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 20 }}
            transition={{ duration: 0.2 }}
            className="absolute top-12 right-0 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-h-96 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Guide d'utilisation</h3>
              <button
                onClick={toggleHelp}
                className="text-gray-400 hover:text-gray-600"
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

              {/* Modification */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Modifier une personne
                </h4>
                <ul className="space-y-1 pl-6">
                  <li>• Clic droit puis "Modifier"</li>
                  <li>• Ou double-clic sur la personne</li>
                </ul>
              </div>

              {/* Raccourcis clavier */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5a2 2 0 00-2 2v12a4 4 0 004 4h2a2 2 0 002-2V5a2 2 0 00-2-2z" />
                  </svg>
                  Raccourcis clavier
                </h4>
                <ul className="space-y-1 pl-6">
                  <li>• <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+N</kbd> ou <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">+</kbd> : Ajouter une personne</li>
                  <li>• <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+H</kbd> ou <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">?</kbd> : Aide</li>
                  <li>• <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">F</kbd> ou <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+0</kbd> : Ajuster la vue</li>
                </ul>
              </div>

              {/* Conseils */}
              <div className="bg-blue-50 rounded-lg p-3">
                <h4 className="font-medium text-blue-900 mb-2">💡 Conseils</h4>
                <ul className="space-y-1 text-blue-800 text-xs">
                  <li>• Commencez par vous ajouter au centre</li>
                  <li>• Ajoutez ensuite vos parents et enfants</li>
                  <li>• Utilisez la minimap pour naviguer dans les grands arbres</li>
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