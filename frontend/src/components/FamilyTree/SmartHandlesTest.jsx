/**
 * Composant de test pour les handles intelligents
 * À utiliser temporairement pour tester et déboguer
 */

import React from 'react';
import { updateTreeHandles } from '../../utils/handleMigration';

const SmartHandlesTest = ({ treeId }) => {
  const handleUpdateHandles = async () => {
    if (!treeId) {
      alert('Pas d\'arbre sélectionné');
      return;
    }

    console.log('Mise à jour des handles intelligents...');
    const result = await updateTreeHandles(treeId);
    
    if (result.success) {
      alert(`Handles mis à jour avec succès! ${result.updated} arêtes modifiées.`);
      // Recharger la page pour voir les changements
      window.location.reload();
    } else {
      alert(`Erreur: ${result.error}`);
    }
  };

  return (
    <div className="fixed top-4 right-4 bg-yellow-100 border border-yellow-300 rounded-lg p-3 z-50">
      <h3 className="font-semibold text-yellow-800 mb-2">🔧 Mode Debug</h3>
      <p className="text-xs text-yellow-700 mb-2">
        Test des handles intelligents pour les conjoints
      </p>
      <button
        onClick={handleUpdateHandles}
        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
      >
        Mettre à jour les handles
      </button>
      <div className="mt-2 text-xs text-yellow-600">
        <p>• Les liens de conjoints devraient se connecter sur les côtés les plus proches</p>
        <p>• Testez avant/après la mise à jour</p>
      </div>
    </div>
  );
};

export default SmartHandlesTest;
