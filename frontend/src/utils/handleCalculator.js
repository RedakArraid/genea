/**
 * Utilitaires pour calculer les handles intelligents des connexions
 * Détermine automatiquement quel côté utiliser pour les connexions entre conjoints
 */

/**
 * Calcule les handles intelligents pour une arête donnée
 * @param {Object} edge - L'arête à traiter
 * @param {Array} nodes - Tous les nœuds de l'arbre
 * @returns {Object} - L'arête avec les handles calculés
 */
export const calculateSmartHandles = (edge, nodes) => {
  // Si les handles sont déjà définis, les garder
  if (edge.sourceHandle && edge.targetHandle) {
    return edge;
  }

  const sourceNode = nodes.find(n => n.id === edge.source);
  const targetNode = nodes.find(n => n.id === edge.target);

  if (!sourceNode || !targetNode) {
    return edge;
  }

  // Pour les relations de conjoint, calculer les handles intelligents
  if (edge.data?.type === 'spouse_connection') {
    const sourceIsLeft = sourceNode.position.x < targetNode.position.x;
    
    return {
      ...edge,
      sourceHandle: sourceIsLeft ? 'spouse-right-source' : 'spouse-left-source',
      targetHandle: sourceIsLeft ? 'spouse-left-target' : 'spouse-right-target'
    };
  }

  // Pour les autres relations, utiliser les handles par défaut
  return edge;
};

/**
 * Calcule les handles intelligents pour toutes les arêtes
 * @param {Array} edges - Toutes les arêtes
 * @param {Array} nodes - Tous les nœuds
 * @returns {Array} - Les arêtes avec handles calculés
 */
export const calculateAllSmartHandles = (edges, nodes) => {
  return edges.map(edge => calculateSmartHandles(edge, nodes));
};

/**
 * Détermine les handles optimaux pour une nouvelle connexion
 * @param {Object} sourceNode - Nœud source
 * @param {Object} targetNode - Nœud cible
 * @param {String} connectionType - Type de connexion ('spouse', 'parent', etc.)
 * @returns {Object} - { sourceHandle, targetHandle }
 */
export const getOptimalHandles = (sourceNode, targetNode, connectionType) => {
  switch (connectionType) {
    case 'spouse':
      const sourceIsLeft = sourceNode.position.x < targetNode.position.x;
      return {
        sourceHandle: sourceIsLeft ? 'spouse-right-source' : 'spouse-left-source',
        targetHandle: sourceIsLeft ? 'spouse-left-target' : 'spouse-right-target'
      };
    
    case 'parent':
      // Parent en haut, enfant en bas
      return {
        sourceHandle: 'parent-source',
        targetHandle: 'child-target'
      };
    
    case 'child':
      // Enfant en bas, parent en haut
      return {
        sourceHandle: 'child-source',
        targetHandle: 'parent-target'
      };
    
    default:
      return {
        sourceHandle: undefined,
        targetHandle: undefined
      };
  }
};
