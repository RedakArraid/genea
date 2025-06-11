/**
 * Algorithme d'alignement ultra-simple pour debug
 */

export const debugAlignment = (nodes, edges) => {
  if (!nodes || nodes.length === 0) return [];

  console.log('🔍 DEBUG ALIGNMENT - Analyse détaillée');
  
  // Analyser les relations parent-enfant réelles
  console.log('📊 Analyse des arêtes:');
  const parentChildEdges = edges.filter(edge => 
    edge.data?.type === 'parent_child_connection' ||
    edge.data?.type === 'marriage_child_connection' ||
    edge.data?.type === 'union_child_connection'
  );
  
  const spouseEdges = edges.filter(edge => 
    edge.data?.type === 'spouse_connection'
  );
  
  console.log('Détail de TOUTES les arêtes:');
  edges.forEach((edge, index) => {
    const sourceName = nodes.find(n => n.id === edge.source)?.data?.firstName || edge.source;
    const targetName = nodes.find(n => n.id === edge.target)?.data?.firstName || edge.target;
    console.log(`  ${index + 1}. ${sourceName} → ${targetName} (type: "${edge.data?.type}", hidden: ${edge.hidden})`);
  });
  
  console.log(`  Relations parent-enfant: ${parentChildEdges.length}`);
  parentChildEdges.forEach(edge => {
    const sourceName = nodes.find(n => n.id === edge.source)?.data?.firstName || edge.source;
    const targetName = nodes.find(n => n.id === edge.target)?.data?.firstName || edge.target;
    console.log(`    ${sourceName} → ${targetName} (${edge.data?.type})`);
  });
  
  console.log(`  Relations conjugales: ${spouseEdges.length}`);
  spouseEdges.forEach(edge => {
    const sourceName = nodes.find(n => n.id === edge.source)?.data?.firstName || edge.source;
    const targetName = nodes.find(n => n.id === edge.target)?.data?.firstName || edge.target;
    console.log(`    ${sourceName} ↔ ${targetName}`);
  });

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

  // CORRECTION: Gérer les enfants d'union qui sont liés au mariage, pas au parent
  console.log('🔧 CORRECTION: Analyse des enfants d\'union:');
  const unionChildEdges = edges.filter(edge => edge.data?.type === 'union_child_connection');
  console.log(`Enfants d'union détectés: ${unionChildEdges.length}`);
  
  unionChildEdges.forEach(edge => {
    console.log(`  Enfant d'union: ${edge.source} (mariage) → ${edge.target} (enfant)`);
    
    // Trouver les parents du mariage (source et target du lien de mariage)
    const marriageEdge = edges.find(e => e.id === edge.source && e.data?.type === 'spouse_connection');
    if (marriageEdge) {
      const parent1 = marriageEdge.source;
      const parent2 = marriageEdge.target;
      const childId = edge.target;
      
      const parent1Name = nodes.find(n => n.id === parent1)?.data?.firstName || parent1;
      const parent2Name = nodes.find(n => n.id === parent2)?.data?.firstName || parent2;
      const childName = nodes.find(n => n.id === childId)?.data?.firstName || childId;
      
      console.log(`    → ${childName} est enfant de ${parent1Name} et ${parent2Name}`);
      
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
    } else {
      console.warn(`    ⚠️  Mariage non trouvé pour l'enfant d'union ${edge.source}`);
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

  console.log('👨‍👩‍👧‍👦 Structure familiale détectée:');
  console.log(`  Parents avec enfants: ${children.size}`);
  children.forEach((childIds, parentId) => {
    const parentName = nodes.find(n => n.id === parentId)?.data?.firstName || parentId;
    const childNames = childIds.map(id => nodes.find(n => n.id === id)?.data?.firstName || id);
    console.log(`    ${parentName} a pour enfant(s): ${childNames.join(', ')}`);
  });
  
  console.log(`  Couples mariés: ${spouses.size / 2}`);
  const processedCouples = new Set();
  spouses.forEach((spouseIds, personId) => {
    if (!processedCouples.has(personId)) {
      const personName = nodes.find(n => n.id === personId)?.data?.firstName || personId;
      const spouseNames = spouseIds.map(id => nodes.find(n => n.id === id)?.data?.firstName || id);
      console.log(`    Couple: ${personName} ↔ ${spouseNames.join(', ')}`);
      processedCouples.add(personId);
      spouseIds.forEach(id => processedCouples.add(id));
    }
  });

  // Assigner les niveaux de génération
  const levels = new Map();
  const visited = new Set();

  const assignLevel = (nodeId, level, source = 'unknown') => {
    const nodeName = nodes.find(n => n.id === nodeId)?.data?.firstName || nodeId;
    
    if (visited.has(nodeId)) {
      const existingLevel = levels.get(nodeId);
      if (existingLevel !== level) {
        console.log(`⚠️  CONFLIT: ${nodeName} déjà niveau ${existingLevel}, maintenant ${level} (source: ${source})`);
        // Prendre le niveau le plus haut (plus proche racine)
        const finalLevel = Math.min(existingLevel, level);
        levels.set(nodeId, finalLevel);
        console.log(`   → Résolution: ${nodeName} = niveau ${finalLevel}`);
      }
      return;
    }
    
    visited.add(nodeId);
    levels.set(nodeId, level);
    console.log(`✅ ${nodeName} → niveau ${level} (source: ${source})`);
    
    // Assigner le même niveau aux conjoints
    const nodeSpouses = spouses.get(nodeId) || [];
    nodeSpouses.forEach(spouseId => {
      if (!visited.has(spouseId)) {
        const spouseName = nodes.find(n => n.id === spouseId)?.data?.firstName || spouseId;
        console.log(`💑 Conjoint ${spouseName} → même niveau ${level}`);
        assignLevel(spouseId, level, `conjoint de ${nodeName}`);
      }
    });
    
    // Propager aux enfants (niveau suivant)
    const nodeChildren = children.get(nodeId) || [];
    nodeChildren.forEach(childId => {
      assignLevel(childId, level + 1, `enfant de ${nodeName}`);
    });
  };

  // Trouver les racines (sans parents)
  const rootNodes = nodes.filter(node => !parents.has(node.id));
  console.log('🌳 Nœuds racines (sans parents):');
  rootNodes.forEach(node => {
    console.log(`  ${node.data?.firstName || node.id}`);
  });

  if (rootNodes.length === 0) {
    console.log('⚠️  Aucune racine trouvée, utilisation du premier nœud');
    if (nodes.length > 0) {
      assignLevel(nodes[0].id, 0, 'premier nœud par défaut');
    }
  } else {
    rootNodes.forEach(node => {
      assignLevel(node.id, 0, 'nœud racine');
    });
  }

  // Assigner les nœuds orphelins
  nodes.forEach(node => {
    if (!levels.has(node.id)) {
      console.log(`🏝️  Nœud isolé: ${node.data?.firstName || node.id} → niveau 0`);
      levels.set(node.id, 0);
    }
  });

  // Résumé des niveaux
  console.log('📊 Répartition par génération:');
  const levelGroups = new Map();
  levels.forEach((level, nodeId) => {
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level).push(nodeId);
  });

  Array.from(levelGroups.keys()).sort().forEach(level => {
    const nodeIds = levelGroups.get(level);
    const names = nodeIds.map(id => nodes.find(n => n.id === id)?.data?.firstName || id);
    console.log(`  Génération ${level}: ${names.join(', ')}`);
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
      console.log(`🎯 Positionnement génération ${level} (parents) à y=${y}`);
      
      const spacing = 200;
      const totalWidth = Math.max(0, (levelNodes.length - 1) * spacing);
      const startX = 400 - totalWidth / 2;
      
      levelNodes.forEach((node, nodeIndex) => {
        const x = startX + nodeIndex * spacing;
        console.log(`   ${node.data?.firstName || node.id}: x=${x}, y=${y}`);
        
        alignedNodes.push({
          ...node,
          position: { x, y }
        });
      });
    } else {
      // Générations suivantes - vérifier s'il y a des enfants d'union
      console.log(`🎯 Positionnement génération ${level} (enfants)`);
      
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
              
              // Position au bout de la ligne verte (+80px total)
              const verticalLineLength = 120;
              const childDistanceFromLine = 180;
              const childY = centerY + verticalLineLength + childDistanceFromLine;
              
              console.log(`   ${node.data?.firstName || node.id} (enfant d'union): x=${node.position.x}, y=${childY}`);
              
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
          console.log(`   ${node.data?.firstName || node.id} (enfant normal): x=${node.position.x}, y=${y}`);
          
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

  console.log('🎉 DEBUG ALIGNMENT terminé:', alignedNodes.length, 'nœuds');
  return alignedNodes;
};
