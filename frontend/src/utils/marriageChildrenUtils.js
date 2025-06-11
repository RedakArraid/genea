/**
 * Utilitaires pour la gestion des enfants de mariage et leur positionnement optimisé
 */

/**
 * Trouve tous les enfants d'un couple (arête de mariage) 
 * Uniquement basé sur les relations permanentes backend
 */
export const findMarriageChildren = (marriageEdgeId, nodes, edges) => {
  // Trouver l'arête de mariage
  const marriageEdge = edges.find(e => e.id === marriageEdgeId);
  if (!marriageEdge) return [];

  const allChildren = new Map();

  // SEULE SOURCE : Relations permanentes d'enfants d'union
  edges
    .filter(edge => 
      edge.data?.type === 'union_child_connection' &&
      edge.data?.marriageEdgeId === marriageEdgeId
    )
    .forEach(edge => {
      const childNode = nodes.find(n => n.id === edge.target);
      if (childNode) {
        allChildren.set(edge.target, { 
          id: edge.target, 
          edgeId: edge.id,
          node: childNode,
          source: 'union_relation' // Relation d'union permanente
        });
      }
    });

  // Compatibilité avec anciennes relations marriage_child_connection
  edges
    .filter(edge => 
      edge.data?.type === 'marriage_child_connection' &&
      edge.data?.marriageEdgeId === marriageEdgeId
    )
    .forEach(edge => {
      const childNode = nodes.find(n => n.id === edge.target);
      if (childNode && !allChildren.has(edge.target)) {
        allChildren.set(edge.target, { 
          id: edge.target, 
          edgeId: edge.id,
          node: childNode,
          source: 'legacy_relation' // Ancienne relation
        });
      }
    });

  return Array.from(allChildren.values());
};

/**
 * Calcule les positions optimales pour les enfants d'un mariage selon le modèle attendu
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

  // Calculer la position selon la logique de MarriageEdge.jsx
  const centerX = (sourceNode.position.x + targetNode.position.x) / 2;
  const centerY = (sourceNode.position.y + targetNode.position.y) / 2;
  
  // Distance cohérente avec MarriageEdge.jsx
  const verticalLineLength = 120; // Ligne du centre vers ligne horizontale
  const childDistanceFromLine = 180; // Distance ligne horizontale vers enfant (+80px total)
  const childrenY = centerY + verticalLineLength + childDistanceFromLine; // = centerY + 300

  // Cas d'un enfant unique - placé au centre
  if (children.length === 1) {
    return [{
      id: children[0].id,
      position: {
        x: centerX - 70, // Centrer la carte (largeur ≈ 140px)
        y: childrenY
      }
    }];
  }

  // Cas de plusieurs enfants - distribution équidistante
  const childSpacing = 180; // Espacement entre enfants (RESTAURÉ)
  const totalWidth = (children.length - 1) * childSpacing;
  const startX = centerX - totalWidth / 2;

  return children.map((child, index) => ({
    id: child.id,
    position: {
      x: startX + index * childSpacing - 70, // Centrer les cartes
      y: childrenY
    }
  }));
};

/**
 * Repositionne automatiquement TOUS les enfants d'un mariage selon le modèle attendu
 */
export const repositionMarriageChildren = (marriageEdgeId, nodes, edges, updateNodePositions) => {
  // Trouver l'arête de mariage
  const marriageEdge = edges.find(e => e.id === marriageEdgeId);
  if (!marriageEdge) return;

  // Trouver tous les enfants
  const children = findMarriageChildren(marriageEdgeId, nodes, edges);
  if (children.length === 0) return;

  // Calculer les nouvelles positions optimales
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
 * et repositionne automatiquement tous les enfants existants
 */
export const calculateNewChildPosition = (marriageEdge, existingChildren, nodes) => {
  if (!marriageEdge) return { x: 400, y: 400 };

  // Trouver les nœuds parents
  const sourceNode = nodes.find(n => n.id === marriageEdge.source);
  const targetNode = nodes.find(n => n.id === marriageEdge.target);
  
  if (!sourceNode || !targetNode) {
    return { x: 400, y: 400 };
  }

  // Calculer la position selon la logique de MarriageEdge.jsx
  const centerX = (sourceNode.position.x + targetNode.position.x) / 2;
  const centerY = (sourceNode.position.y + targetNode.position.y) / 2;
  
  // Distance cohérente avec MarriageEdge.jsx
  const verticalLineLength = 120; // Ligne du centre vers ligne horizontale
  const childDistanceFromLine = 180; // Distance ligne horizontale vers enfant (+80px total)
  const childrenY = centerY + verticalLineLength + childDistanceFromLine; // = centerY + 300

  // Calculer la position selon le nombre total d'enfants (existants + nouveau)
  const totalChildren = (existingChildren?.length || 0) + 1;
  
  if (totalChildren === 1) {
    // Premier enfant - au centre
    return {
      x: centerX - 70,
      y: childrenY
    };
  }

  // Plusieurs enfants - calculer la position à la fin de la série
  const childSpacing = 180; // Espacement entre enfants (RESTAURÉ)
  const totalWidth = (totalChildren - 1) * childSpacing;
  const startX = centerX - totalWidth / 2;
  const newChildIndex = existingChildren?.length || 0;

  return {
    x: startX + newChildIndex * childSpacing - 70,
    y: childrenY
  };
};

/**
 * Repositionne automatiquement tous les enfants d'un mariage après ajout d'un nouvel enfant
 */
export const repositionAfterChildAddition = async (marriageEdgeId, nodes, edges, updateNodePositions) => {
  // Attendre un peu pour que le nouvel enfant soit ajouté au store
  setTimeout(() => {
    repositionMarriageChildren(marriageEdgeId, nodes, edges, updateNodePositions);
  }, 100);
};

/**
 * Groupe les enfants par mariage pour optimiser le rendu
 */
export const groupChildrenByMarriage = (edges) => {
  const marriageGroups = new Map();

  // Nouvelles relations union_child_connection
  edges
    .filter(edge => edge.data?.type === 'union_child_connection')
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

  // Anciennes relations marriage_child_connection (compatibilité)
  edges
    .filter(edge => edge.data?.type === 'marriage_child_connection')
    .forEach(edge => {
      const marriageId = edge.data?.marriageEdgeId;
      if (marriageId) {
        if (!marriageGroups.has(marriageId)) {
          marriageGroups.set(marriageId, []);
        }
        // Éviter les doublons
        const existingChild = marriageGroups.get(marriageId).find(child => child.childId === edge.target);
        if (!existingChild) {
          marriageGroups.get(marriageId).push({
            childId: edge.target,
            edgeId: edge.id
          });
        }
      }
    });

  return marriageGroups;
};

/**
 * Vérifie si une position est optimale selon le modèle attendu
 */
export const isOptimalChildPosition = (child, marriageEdge, allChildren, nodes) => {
  const expectedPositions = calculateChildrenPositions(marriageEdge, allChildren, nodes);
  const expectedPos = expectedPositions.find(p => p.id === child.id);
  
  if (!expectedPos) return false;
  
  const tolerance = 10; // Tolérance de 10px
  const actualX = child.node.position.x;
  const actualY = child.node.position.y;
  
  return Math.abs(actualX - expectedPos.position.x) <= tolerance &&
         Math.abs(actualY - expectedPos.position.y) <= tolerance;
};

/**
 * Auto-repositionne tous les enfants mal placés
 */
export const autoRepositionMisplacedChildren = (edges, nodes, updateNodePositions) => {
  const marriageGroups = groupChildrenByMarriage(edges);
  
  marriageGroups.forEach((children, marriageEdgeId) => {
    const marriageEdge = edges.find(e => e.id === marriageEdgeId);
    if (!marriageEdge) return;
    
    const childrenWithNodes = children.map(child => {
      const node = nodes.find(n => n.id === child.childId);
      return node ? { id: child.childId, node } : null;
    }).filter(Boolean);
    
    // Vérifier si au moins un enfant est mal placé
    const needsRepositioning = childrenWithNodes.some(child => 
      !isOptimalChildPosition(child, marriageEdge, childrenWithNodes, nodes)
    );
    
    if (needsRepositioning) {
      repositionMarriageChildren(marriageEdgeId, nodes, edges, updateNodePositions);
    }
  });
};