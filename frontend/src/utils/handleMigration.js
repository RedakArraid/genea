/**
 * Script utilitaire pour mettre à jour les handles des arêtes existantes
 * Ce script peut être exécuté pour migrer les données existantes
 */

import api from '../services/api';
import { calculateAllSmartHandles } from './handleCalculator';

/**
 * Met à jour les handles intelligents pour tous les arbres
 * @param {string} treeId - ID de l'arbre à mettre à jour
 */
export const updateTreeHandles = async (treeId) => {
  try {
    console.log(`Mise à jour des handles pour l'arbre ${treeId}...`);
    
    // Récupérer l'arbre complet
    const response = await api.get(`/family-trees/${treeId}`);
    const { tree } = response.data;
    
    // Créer les nœuds
    const nodes = tree.Person.map(person => ({
      id: person.id,
      position: getNodePosition(person.id, tree.NodePosition),
    }));
    
    // Créer les arêtes
    const edges = tree.Edge.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type,
      data: edge.data,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle
    }));
    
    // Calculer les handles intelligents
    const smartEdges = calculateAllSmartHandles(edges, nodes);
    
    // Mettre à jour chaque arête qui a changé
    let updatedCount = 0;
    for (const smartEdge of smartEdges) {
      const originalEdge = edges.find(e => e.id === smartEdge.id);
      
      if (originalEdge.sourceHandle !== smartEdge.sourceHandle || 
          originalEdge.targetHandle !== smartEdge.targetHandle) {
        
        try {
          await api.put(`/edges/${smartEdge.id}`, {
            sourceHandle: smartEdge.sourceHandle,
            targetHandle: smartEdge.targetHandle
          });
          updatedCount++;
          console.log(`Arête ${smartEdge.id} mise à jour`);
        } catch (error) {
          console.error(`Erreur mise à jour arête ${smartEdge.id}:`, error);
        }
      }
    }
    
    console.log(`Mise à jour terminée: ${updatedCount} arêtes mises à jour`);
    return { success: true, updated: updatedCount };
    
  } catch (error) {
    console.error('Erreur lors de la mise à jour des handles:', error);
    return { success: false, error: error.message };
  }
};

// Fonction utilitaire (copie de celle du store)
function getNodePosition(nodeId, nodePositions) {
  const nodePosition = nodePositions.find(np => np.nodeId === nodeId);
  
  if (nodePosition) {
    return { x: nodePosition.x, y: nodePosition.y };
  }
  
  return { x: 0, y: 0 };
}
