/**
 * Algorithme d'alignement ultra-simple pour debug
 */

export const debugAlignment = (nodes, edges) => {
  if (!nodes || nodes.length === 0) return [];
  
  // Analyser les relations parent-enfant réelles
  const parentChildEdges = edges.filter(edge => 
    edge.data?.type === 'parent_child_connection' ||
    edge.data?.type === 'marriage_child_connection' ||
    edge.data?.type === 'union_child_connection'
  );
  
  const spouseEdges = edges.filter(edge => 
    edge.data?.type === 'spouse_connection'
  );

  // Analyser les niveaux de génération selon les relations
  const children = new Map(); // parent -> [enfants]
  const parents = new Map();  // enfant -> [parents]
  const spouses = new Map();  // personne -> [conjoints]

  // Construire les maps de relations
  parentChildEdges.forEach(edge => {
    // source = parent, target = enfant
    if (!children.has(edge.source)) {
      children.set(edge.source, []);
    }
    children.get(edge.source).push(edge.target);

    if (!parents.has(edge.target)) {
      parents.set(edge.target, []);
    }
    parents.get(edge.target).push(edge.source);
  });

  // Gérer les enfants d'union qui sont liés au mariage, pas au parent
  const unionChildEdges = edges.filter(edge => edge.data?.type === 'union_child_connection');
  
  unionChildEdges.forEach(edge => {
    // Trouver les parents du mariage (source et target du lien de mariage)
    const marriageEdge = edges.find(e => e.id === edge.source && e.data?.type === 'spouse_connection');
    if (marriageEdge) {
      const parent1 = marriageEdge.source;
      const parent2 = marriageEdge.target;
      const childId = edge.target;
      
      // Ajouter les relations parent-enfant pour les deux parents
      [parent1, parent2].forEach(parentId => {
        if (!children.has(parentId)) {
          children.set(parentId, []);
        }
        if (!children.get(parentId).includes(childId)) {
          children.get(parentId).push(childId);
        }
        
        if (!parents.has(childId)) {
          parents.set(childId, []);
        }
        if (!parents.get(childId).includes(parentId)) {
          parents.get(childId).push(parentId);
        }
      });
    }
  });

  spouseEdges.forEach(edge => {
    if (!spouses.has(edge.source)) {
      spouses.set(edge.source, []);
    }
    if (!spouses.has(edge.target)) {
      spouses.set(edge.target, []);
    }
    spouses.get(edge.source).push(edge.target);
    spouses.get(edge.target).push(edge.source);
  });

  // Assigner les niveaux de génération
  const levels = new Map();
  const visited = new Set();

  const assignLevel = (nodeId, level) => {
    if (visited.has(nodeId)) {
      const existingLevel = levels.get(nodeId);
      if (existingLevel !== level) {
        // Prendre le niveau le plus haut (plus proche racine)
        const finalLevel = Math.min(existingLevel, level);
        levels.set(nodeId, finalLevel);
      }
      return;
    }
    
    visited.add(nodeId);
    levels.set(nodeId, level);
    
    // Assigner le même niveau aux conjoints
    const nodeSpouses = spouses.get(nodeId) || [];
    nodeSpouses.forEach(spouseId => {
      if (!visited.has(spouseId)) {
        assignLevel(spouseId, level);
      }
    });
    
    // Propager aux enfants (niveau suivant)
    const nodeChildren = children.get(nodeId) || [];
    nodeChildren.forEach(childId => {
      assignLevel(childId, level + 1);
    });
  };

  // Trouver les racines (sans parents)
  const rootNodes = nodes.filter(node => !parents.has(node.id));

  if (rootNodes.length === 0) {
    if (nodes.length > 0) {
      assignLevel(nodes[0].id, 0);
    }
  } else {
    rootNodes.forEach(node => {
      assignLevel(node.id, 0);
    });
  }

  // Assigner les nœuds orphelins
  nodes.forEach(node => {
    if (!levels.has(node.id)) {
      levels.set(node.id, 0);
    }
  });

  // Répartition par génération
  const levelGroups = new Map();
  levels.forEach((level, nodeId) => {
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level).push(nodeId);
  });

  // Créer les positions finales avec gestion spéciale des enfants d'union
  const alignedNodes = [];
  const sortedLevels = Array.from(levelGroups.keys()).sort((a, b) => a - b);
  
  // Traiter chaque niveau
  sortedLevels.forEach((level, levelIndex) => {
    const levelNodeIds = levelGroups.get(level);
    const levelNodes = levelNodeIds.map(id => nodes.find(n => n.id === id)).filter(Boolean);
    
    if (level === 0) {
      // Génération 0 (parents) - positionnement normal
      const y = 150;
      
      const spacing = 200;
      const totalWidth = Math.max(0, (levelNodes.length - 1) * spacing);
      const startX = 400 - totalWidth / 2;
      
      levelNodes.forEach((node, nodeIndex) => {
        const x = startX + nodeIndex * spacing;
        
        alignedNodes.push({
          ...node,
          position: { x, y }
        });
      });
    } else {
      // Générations suivantes - vérifier s'il y a des enfants d'union
      levelNodes.forEach(node => {
        let positioned = false;
        
        // Vérifier si c'est un enfant d'union
        const unionEdge = edges.find(edge => 
          edge.data?.type === 'union_child_connection' && 
          edge.target === node.id
        );
        
        if (unionEdge) {
          // C'est un enfant d'union - calculer position selon le mariage
          const marriageEdge = edges.find(e => e.id === unionEdge.source);
          if (marriageEdge) {
            const sourceNode = nodes.find(n => n.id === marriageEdge.source);
            const targetNode = nodes.find(n => n.id === marriageEdge.target);
            
            if (sourceNode && targetNode) {
              const centerX = (sourceNode.position.x + targetNode.position.x) / 2;
              const centerY = (sourceNode.position.y + targetNode.position.y) / 2;
              
              // Position au bout de la ligne verte
              const verticalLineLength = 120;
              const childDistanceFromLine = 180;
              const childY = centerY + verticalLineLength + childDistanceFromLine;
              
              alignedNodes.push({
                ...node,
                position: { 
                  x: node.position.x, // Garder position X actuelle
                  y: childY // Position au bout de la ligne verte
                }
              });
              positioned = true;
            }
          }
        }
        
        if (!positioned) {
          // Enfant normal - positionnement générique
          const y = 150 + levelIndex * 220;
          
          alignedNodes.push({
            ...node,
            position: { 
              x: node.position.x,
              y: y
            }
          });
        }
      });
    }
  });

  return alignedNodes;
};
