/**
 * Utilitaires pour la gestion des enfants de mariage et leur positionnement
 */

/**
 * Trouve tous les enfants d'un couple (arête de mariage)
 */
export const findMarriageChildren = (marriageEdgeId, nodes, edges) => {
  // Trouver l'arête de mariage
  const marriageEdge = edges.find(e => e.id === marriageEdgeId);
  if (!marriageEdge) return [];

  // Trouver tous les enfants de ce mariage en évitant les doublons
  const childrenMap = new Map();
  
  edges
    .filter(edge => 
      edge.data?.type === 'marriage_child_connection' &&
      edge.data?.marriageEdgeId === marriageEdgeId
    )
    .forEach(edge => {
      const childNode = nodes.find(n => n.id === edge.target);
      if (childNode && !childrenMap.has(edge.target)) {
        childrenMap.set(edge.target, { 
          id: edge.target, 
          edgeId: edge.id,
          node: childNode 
        });
      }
    });

  return Array.from(childrenMap.values());
};

/**
 * Calcule les positions optimales pour les enfants d'un mariage
 */
export const calculateChildrenPositions = (marriageEdge, children, nodes) => {
  if (!marriageEdge || !children || children.length === 0) {
    return [];
  }

  // Trouver les nœuds parents
  const sourceNode = nodes.find(n => n.id === marriageEdge.source);
  const targetNode = nodes.find(n => n.id === marriageEdge.target);
  
  if (!sourceNode || !targetNode) {
    return [];
  }

  // Centre du lien conjugal
  const centerX = (sourceNode.position.x + targetNode.position.x) / 2;
  const centerY = Math.max(sourceNode.position.y, targetNode.position.y);

  // Distance verticale standard pour les enfants
  const verticalOffset = 250;
  const childrenY = centerY + verticalOffset;

  // Cas d'un enfant unique
  if (children.length === 1) {
    return [{
      id: children[0].id,
      position: {
        x: centerX,
        y: childrenY
      }
    }];
  }

  // Cas de plusieurs enfants - distribution équidistante
  const childSpacing = 180; // Espacement entre enfants
  const totalWidth = (children.length - 1) * childSpacing;
  const startX = centerX - totalWidth / 2;

  return children.map((child, index) => ({
    id: child.id,
    position: {
      x: startX + index * childSpacing,
      y: childrenY
    }
  }));
};

/**
 * Repositionne automatiquement les enfants d'un mariage
 */
export const repositionMarriageChildren = (marriageEdgeId, nodes, edges, updateNodePositions) => {
  // Trouver l'arête de mariage
  const marriageEdge = edges.find(e => e.id === marriageEdgeId);
  if (!marriageEdge) return;

  // Trouver tous les enfants
  const children = findMarriageChildren(marriageEdgeId, nodes, edges);
  if (children.length === 0) return;

  // Calculer les nouvelles positions
  const newPositions = calculateChildrenPositions(marriageEdge, children, nodes);

  // Appliquer les nouvelles positions
  if (newPositions.length > 0) {
    const nodePositions = newPositions.map(pos => ({
      id: pos.id,
      position: pos.position
    }));
    
    updateNodePositions(nodePositions);
  }
};

/**
 * Trouve la position optimale pour un nouvel enfant de mariage
 */
export const calculateNewChildPosition = (marriageEdge, existingChildren, nodes) => {
  if (!marriageEdge) return { x: 400, y: 400 };

  // Trouver les nœuds parents
  const sourceNode = nodes.find(n => n.id === marriageEdge.source);
  const targetNode = nodes.find(n => n.id === marriageEdge.target);
  
  if (!sourceNode || !targetNode) {
    return { x: 400, y: 400 };
  }

  // Centre du lien conjugal
  const centerX = (sourceNode.position.x + targetNode.position.x) / 2;
  const centerY = Math.max(sourceNode.position.y, targetNode.position.y);
  const verticalOffset = 250;

  // Si c'est le premier enfant, le placer au centre
  if (!existingChildren || existingChildren.length === 0) {
    return {
      x: centerX,
      y: centerY + verticalOffset
    };
  }

  // S'il y a déjà des enfants, calculer la nouvelle position équidistante
  const childSpacing = 180;
  const totalChildren = existingChildren.length + 1; // +1 pour le nouvel enfant
  const totalWidth = (totalChildren - 1) * childSpacing;
  const startX = centerX - totalWidth / 2;

  // Le nouvel enfant sera placé à la fin (ou au milieu selon la logique souhaitée)
  return {
    x: startX + existingChildren.length * childSpacing,
    y: centerY + verticalOffset
  };
};

/**
 * Groupe les enfants par mariage pour optimiser le rendu
 */
export const groupChildrenByMarriage = (edges) => {
  const marriageGroups = new Map();

  edges
    .filter(edge => edge.data?.type === 'marriage_child_connection')
    .forEach(edge => {
      const marriageId = edge.data?.marriageEdgeId;
      if (marriageId) {
        if (!marriageGroups.has(marriageId)) {
          marriageGroups.set(marriageId, []);
        }
        marriageGroups.get(marriageId).push({
          childId: edge.target,
          edgeId: edge.id
        });
      }
    });

  return marriageGroups;
};