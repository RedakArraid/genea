/**
 * Version simplifiée et robuste de l'alignement des générations
 */

/**
 * Alignement simple par ligne horizontale
 */
export const simpleGenerationAlignment = (nodes, edges) => {
  if (!nodes || nodes.length === 0) return [];

  console.log('Début alignement simple avec', nodes.length, 'nœuds');

  // Grouper les nœuds par niveau Y approximatif (tolérance de 100px)
  const yGroups = new Map();
  const tolerance = 100;

  nodes.forEach(node => {
    if (!node.position || typeof node.position.y !== 'number') {
      console.warn('Nœud sans position valide ignoré:', node.id);
      return;
    }

    const y = Math.round(node.position.y / tolerance) * tolerance;
    if (!yGroups.has(y)) {
      yGroups.set(y, []);
    }
    yGroups.get(y).push(node);
  });

  console.log('Groupes Y trouvés:', yGroups.size);

  // Aligner chaque groupe sur la même ligne
  const alignedNodes = [];
  const sortedYs = Array.from(yGroups.keys()).sort((a, b) => a - b);

  sortedYs.forEach((groupY, index) => {
    const groupNodes = yGroups.get(groupY);
    const actualY = 150 + index * 300; // Espacement de 300px entre générations

    // Trier les nœuds du groupe par X pour maintenir l'ordre
    const sortedNodes = groupNodes.sort((a, b) => a.position.x - b.position.x);
    
    // Espacer horizontalement
    const spacing = 200; // Distance horizontale restaurée
    const totalWidth = Math.max(0, (sortedNodes.length - 1) * spacing);
    const startX = 400 - totalWidth / 2; // Centrer autour de x=400

    sortedNodes.forEach((node, nodeIndex) => {
      alignedNodes.push({
        ...node,
        position: {
          x: startX + nodeIndex * spacing,
          y: actualY
        }
      });
    });
  });

  console.log('Nœuds alignés créés:', alignedNodes.length);
  return alignedNodes;
};

/**
 * Alignement intelligent basé sur les relations - VERSION CORRIGÉE
 */
export const smartGenerationAlignment = (nodes, edges) => {
  if (!nodes || nodes.length === 0) return [];

  console.log('Début alignement intelligent avec', nodes.length, 'nœuds et', edges.length, 'arêtes');

  // Créer les relations familiales
  const children = new Map(); // parent -> [enfants]
  const parents = new Map();  // enfant -> [parents]
  const spouses = new Map();  // personne -> [conjoints]

  edges.forEach(edge => {
    if (edge.data?.type === 'parent_child_connection' || 
        edge.data?.type === 'marriage_child_connection' ||
        edge.data?.type === 'union_child_connection') {
      
      // source = parent, target = enfant
      if (!children.has(edge.source)) {
        children.set(edge.source, []);
      }
      children.get(edge.source).push(edge.target);

      if (!parents.has(edge.target)) {
        parents.set(edge.target, []);
      }
      parents.get(edge.target).push(edge.source);
    }
    
    // Relations conjugales
    if (edge.data?.type === 'spouse_connection') {
      if (!spouses.has(edge.source)) {
        spouses.set(edge.source, []);
      }
      if (!spouses.has(edge.target)) {
        spouses.set(edge.target, []);
      }
      spouses.get(edge.source).push(edge.target);
      spouses.get(edge.target).push(edge.source);
    }
  });

  console.log('Relations détectées:', {
    parents: parents.size,
    enfants: children.size,
    mariages: spouses.size
  });

  // Calculer les niveaux de génération
  const levels = new Map();
  const visited = new Set();

  // Fonction pour assigner un niveau et propager aux conjoints
  const assignLevel = (nodeId, level) => {
    if (visited.has(nodeId)) {
      // Si déjà visité, vérifier la cohérence
      const existingLevel = levels.get(nodeId);
      if (existingLevel !== undefined && existingLevel !== level) {
        console.warn(`Conflit de niveau pour ${nodeId}: ${existingLevel} vs ${level}`);
        // Prendre le niveau le plus élevé (plus proche de la racine)
        level = Math.min(existingLevel, level);
      }
      return;
    }
    
    visited.add(nodeId);
    levels.set(nodeId, level);
    
    console.log(`Nœud ${nodeId} assigné au niveau ${level}`);
    
    // Assigner le même niveau aux conjoints (IMPORTANT !)
    const nodeSpouses = spouses.get(nodeId) || [];
    nodeSpouses.forEach(spouseId => {
      if (!visited.has(spouseId)) {
        console.log(`Conjoint ${spouseId} assigné au même niveau ${level}`);
        assignLevel(spouseId, level);
      }
    });
    
    // Propager aux enfants (niveau suivant)
    const nodeChildren = children.get(nodeId) || [];
    nodeChildren.forEach(childId => {
      assignLevel(childId, level + 1);
    });
  };

  // Commencer par les nœuds racines (sans parents)
  const rootNodes = nodes.filter(node => !parents.has(node.id));
  console.log('Nœuds racines trouvés:', rootNodes.map(n => n.id));

  if (rootNodes.length === 0 && nodes.length > 0) {
    // Si pas de racines claires, prendre le premier nœud
    console.log('Aucune racine détectée, utilisation du premier nœud');
    assignLevel(nodes[0].id, 0);
  } else {
    rootNodes.forEach(node => assignLevel(node.id, 0));
  }

  // Assigner les nœuds non visités au niveau 0
  nodes.forEach(node => {
    if (!levels.has(node.id)) {
      console.log(`Nœud isolé ${node.id} assigné au niveau 0`);
      levels.set(node.id, 0);
    }
  });

  // Grouper par niveau
  const levelGroups = new Map();
  levels.forEach((level, nodeId) => {
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      levelGroups.get(level).push(node);
    }
  });

  console.log('Niveaux de génération:', Array.from(levelGroups.keys()).sort());
  levelGroups.forEach((nodes, level) => {
    console.log(`Niveau ${level}: ${nodes.map(n => n.data?.firstName || n.id).join(', ')}`);
  });

  // Positionner les nœuds avec logique de famille
  const alignedNodes = [];
  const sortedLevels = Array.from(levelGroups.keys()).sort((a, b) => a - b);
  const verticalSpacing = 400; // Distance verticale entre générations (augmentée)
  const horizontalSpacing = 200; // Distance horizontale entre personnes (RESTAURÉE)
  const coupleSpacing = 180; // Distance entre conjoints (RESTAURÉE)

  sortedLevels.forEach((level, levelIndex) => {
    const levelNodes = levelGroups.get(level);
    const y = 150 + levelIndex * verticalSpacing;
    
    console.log(`Positionnement niveau ${level} (${levelNodes.length} nœuds) à y=${y}`);
    
    // Grouper les couples et les célibataires
    const processedNodes = new Set();
    const familyGroups = [];
    
    levelNodes.forEach(node => {
      if (processedNodes.has(node.id)) return;
      
      const nodeSpouses = spouses.get(node.id) || [];
      const levelSpouses = nodeSpouses.filter(spouseId => 
        levelNodes.some(n => n.id === spouseId)
      );
      
      if (levelSpouses.length > 0) {
        // C'est un couple
        const couple = [node, ...levelSpouses.map(id => levelNodes.find(n => n.id === id))].filter(Boolean);
        familyGroups.push({ type: 'couple', nodes: couple });
        couple.forEach(n => processedNodes.add(n.id));
        console.log(`Couple détecté: ${couple.map(n => n.data?.firstName || n.id).join(' & ')}`);
      } else {
        // Célibataire
        familyGroups.push({ type: 'single', nodes: [node] });
        processedNodes.add(node.id);
        console.log(`Célibataire: ${node.data?.firstName || node.id}`);
      }
    });
    
    // Calculer la largeur totale nécessaire
    const totalWidth = familyGroups.reduce((width, group, index) => {
      if (group.type === 'couple') {
        return width + coupleSpacing * (group.nodes.length - 1) + (index > 0 ? horizontalSpacing : 0);
      } else {
        return width + (index > 0 ? horizontalSpacing : 0);
      }
    }, 0);
    
    const startX = 400 - totalWidth / 2; // Centrer
    let currentX = startX;
    
    familyGroups.forEach((group, groupIndex) => {
      if (groupIndex > 0) {
        currentX += horizontalSpacing;
      }
      
      if (group.type === 'couple') {
        // Placer les conjoints côte à côte
        group.nodes.forEach((node, nodeIndex) => {
          alignedNodes.push({
            ...node,
            position: {
              x: currentX + nodeIndex * coupleSpacing,
              y: y
            }
          });
        });
        currentX += coupleSpacing * (group.nodes.length - 1);
      } else {
        // Placer le célibataire
        alignedNodes.push({
          ...group.nodes[0],
          position: {
            x: currentX,
            y: y
          }
        });
      }
    });
  });

  console.log('Alignement intelligent terminé:', alignedNodes.length, 'nœuds');
  return alignedNodes;
};
