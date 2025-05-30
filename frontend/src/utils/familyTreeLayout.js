/**
 * Fonction pour calculer l'alignement automatique des générations
 */
export const calculateGenerationLayout = (nodes, edges) => {
  const generations = new Map();
  const visited = new Set();
  const nodeGenerations = new Map();
  
  // Fonction récursive pour déterminer les générations
  const assignGeneration = (nodeId, generation) => {
    if (visited.has(nodeId)) {
      // Si déjà visité, vérifier la cohérence des générations
      const existingGeneration = nodeGenerations.get(nodeId);
      if (existingGeneration !== undefined && existingGeneration !== generation) {
        // Prendre la génération la plus élevée (plus proche de la racine)
        generation = Math.min(existingGeneration, generation);
      }
      return;
    }
    
    visited.add(nodeId);
    nodeGenerations.set(nodeId, generation);
    
    if (!generations.has(generation)) {
      generations.set(generation, []);
    }
    
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      generations.get(generation).push({
        ...node,
        generation
      });
    }
    
    // Trouver les enfants (génération suivante)
    const children = edges
      .filter(edge => edge.source === nodeId && 
        (edge.data?.type === 'parent_child_connection' || edge.data?.type === 'marriage_child_connection'))
      .map(edge => edge.target);
    
    children.forEach(childId => {
      assignGeneration(childId, generation + 1);
    });
    
    // Trouver les parents (génération précédente)
    const parents = edges
      .filter(edge => edge.target === nodeId && 
        (edge.data?.type === 'parent_child_connection' || edge.data?.type === 'marriage_child_connection'))
      .map(edge => edge.source);
    
    parents.forEach(parentId => {
      assignGeneration(parentId, generation - 1);
    });
  };
  
  // Commencer par les nœuds racines (ceux sans parents)
  const rootNodes = nodes.filter(node => {
    const hasParents = edges.some(edge => 
      edge.target === node.id && 
      (edge.data?.type === 'parent_child_connection' || edge.data?.type === 'marriage_child_connection')
    );
    return !hasParents;
  });
  
  // Si pas de racines, prendre le premier nœud
  if (rootNodes.length === 0 && nodes.length > 0) {
    assignGeneration(nodes[0].id, 0);
  } else {
    rootNodes.forEach(node => assignGeneration(node.id, 0));
  }
  
  // Nettoyer et reconstruire les générations avec les nouvelles assignations
  generations.clear();
  nodeGenerations.forEach((generation, nodeId) => {
    if (!generations.has(generation)) {
      generations.set(generation, []);
    }
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      generations.get(generation).push({
        ...node,
        generation
      });
    }
  });
  
  // Positionner les nœuds par génération avec alignement horizontal strict
  const layoutNodes = [];
  const generationHeight = 300; // Espacement vertical entre générations
  const nodeSpacing = 200; // Espacement horizontal entre nœuds
  const baseY = 150; // Position Y de base
  
  // Trier les générations par ordre croissant
  const sortedGenerations = Array.from(generations.keys()).sort((a, b) => a - b);
  
  sortedGenerations.forEach((generation, index) => {
    const generationNodes = generations.get(generation);
    const y = baseY + (index * generationHeight); // Même Y pour toute la génération
    
    // Calculer la largeur totale nécessaire
    const totalWidth = Math.max(0, (generationNodes.length - 1) * nodeSpacing);
    const startX = -totalWidth / 2 + 500; // Centrer horizontalement
    
    generationNodes.forEach((node, nodeIndex) => {
      layoutNodes.push({
        ...node,
        position: {
          x: startX + nodeIndex * nodeSpacing,
          y: y // Même Y pour tous les nœuds de cette génération
        }
      });
    });
  });
  
  return layoutNodes;
};

/**
 * Fonction pour aligner automatiquement les conjoints
 */
export const alignSpouses = (nodes, edges) => {
  const marriageEdges = edges.filter(edge => edge.data?.type === 'spouse_connection');
  const alignedNodes = [...nodes];
  
  marriageEdges.forEach(edge => {
    const sourceIndex = alignedNodes.findIndex(n => n.id === edge.source);
    const targetIndex = alignedNodes.findIndex(n => n.id === edge.target);
    
    if (sourceIndex !== -1 && targetIndex !== -1) {
      const sourceNode = alignedNodes[sourceIndex];
      const targetNode = alignedNodes[targetIndex];
      
      // Aligner verticalement les conjoints sur la même ligne
      const avgY = (sourceNode.position.y + targetNode.position.y) / 2;
      
      alignedNodes[sourceIndex] = {
        ...sourceNode,
        position: { ...sourceNode.position, y: avgY }
      };
      
      alignedNodes[targetIndex] = {
        ...targetNode,
        position: { ...targetNode.position, y: avgY }
      };
      
      // S'assurer qu'ils sont côte à côte horizontalement
      const minX = Math.min(sourceNode.position.x, targetNode.position.x);
      const maxX = Math.max(sourceNode.position.x, targetNode.position.x);
      const spouseSpacing = 180; // Espacement entre conjoints
      
      // Réajuster les positions X pour un espacement correct
      if (Math.abs(maxX - minX) !== spouseSpacing) {
        const centerX = (minX + maxX) / 2;
        
        alignedNodes[sourceIndex] = {
          ...alignedNodes[sourceIndex],
          position: { 
            x: centerX - spouseSpacing / 2, 
            y: avgY 
          }
        };
        
        alignedNodes[targetIndex] = {
          ...alignedNodes[targetIndex],
          position: { 
            x: centerX + spouseSpacing / 2, 
            y: avgY 
          }
        };
      }
    }
  });
  
  return alignedNodes;
};

/**
 * Fonction pour calculer la position optimale d'un nouveau nœud
 */
export const calculateOptimalPosition = (nodes, parentId, relationType, marriagePoint = null) => {
  let position = { x: 400, y: 200 };
  
  if (parentId) {
    const parentNode = nodes.find(n => n.id === parentId);
    if (parentNode) {
      switch (relationType) {
        case 'child':
          position = { x: parentNode.position.x, y: parentNode.position.y + 250 };
          break;
        case 'spouse':
          // Espacement optimal pour éviter les chevauchements
          const spouseOffset = 200;
          const baseSpousePosition = { 
            x: parentNode.position.x + spouseOffset, 
            y: parentNode.position.y 
          };
          
          // Vérifier s'il y a déjà un conjoint à droite
          const existingSpouse = nodes.find(n => 
            Math.abs(n.position.y - parentNode.position.y) < 30 &&
            n.position.x > parentNode.position.x &&
            n.id !== parentId
          );
          
          if (existingSpouse) {
            // Placer à gauche si quelqu'un est déjà à droite
            position = { 
              x: parentNode.position.x - spouseOffset, 
              y: parentNode.position.y 
            };
          } else {
            position = baseSpousePosition;
          }
          break;
        case 'parent':
          position = { x: parentNode.position.x, y: parentNode.position.y - 250 };
          break;
        case 'sibling':
          // Trouver l'espace libre à côté
          const siblings = nodes.filter(n => 
            Math.abs(n.position.y - parentNode.position.y) < 50 && n.id !== parentId
          );
          const maxX = Math.max(parentNode.position.x, ...siblings.map(s => s.position.x));
          position = { x: maxX + 220, y: parentNode.position.y };
          break;
      }
    }
  } else if (marriagePoint) {
    position = { x: marriagePoint.x - 70, y: marriagePoint.y + 180 };
  }
  
  return position;
};

/**
 * Fonction pour éviter les chevauchements de nœuds
 */
export const avoidNodeOverlap = (nodes, newPosition, nodeWidth = 140, nodeHeight = 160) => {
  const minDistance = 50;
  let adjustedPosition = { ...newPosition };
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    let hasOverlap = false;
    
    for (const node of nodes) {
      const distance = Math.sqrt(
        Math.pow(adjustedPosition.x - node.position.x, 2) + 
        Math.pow(adjustedPosition.y - node.position.y, 2)
      );
      
      if (distance < nodeWidth + minDistance) {
        hasOverlap = true;
        // Déplacer légèrement
        adjustedPosition.x += (nodeWidth + minDistance);
        break;
      }
    }
    
    if (!hasOverlap) break;
    attempts++;
  }
  
  return adjustedPosition;
};
