/**
 * Utilitaires pour gérer les nœuds de mariage
 */

/**
 * Crée un nœud de mariage entre deux personnes
 */
export const createMarriageNode = (spouse1Node, spouse2Node, marriageEdgeId) => {
  // Position au centre entre les deux conjoints
  const centerX = (spouse1Node.position.x + spouse2Node.position.x) / 2 + 70;
  const centerY = (spouse1Node.position.y + spouse2Node.position.y) / 2 + 80;
  
  return {
    id: `marriage-${marriageEdgeId}`,
    type: 'marriage',
    position: { x: centerX - 20, y: centerY - 20 }, // -20 pour centrer le nœud de 40px
    data: {
      spouse1Id: spouse1Node.id,
      spouse2Id: spouse2Node.id,
      spouseName1: `${spouse1Node.data.firstName} ${spouse1Node.data.lastName}`,
      spouseName2: `${spouse2Node.data.firstName} ${spouse2Node.data.lastName}`,
      marriageEdgeId: marriageEdgeId
    },
    draggable: false // Le nœud suit automatiquement les conjoints
  };
};