import React from 'react';
import { findMarriageChildren } from '../../utils/marriageChildrenUtils';

/**
 * Composant d'arête groupé pour les enfants d'un mariage
 * Dessine une structure en T : centre du mariage -> ligne verticale -> ligne horizontale -> enfants
 */
const MarriageChildrenGroupEdge = ({ edges, nodes, marriageEdges }) => {
  console.log('🌟 MarriageChildrenGroupEdge rendu avec:', {
    edgesCount: edges.length,
    nodesCount: nodes.length,
    marriageEdgesCount: marriageEdges.length
  });

  // Grouper les enfants par mariage
  const marriageGroups = marriageEdges.map(marriageEdge => {
    const children = findMarriageChildren(marriageEdge.id, nodes, edges);
    if (children.length === 0) return null;
    
    return {
      marriageEdge,
      children: children.map(child => {
        const childNode = nodes.find(n => n.id === child.id);
        return childNode ? { ...child, node: childNode } : null;
      }).filter(Boolean)
    };
  }).filter(Boolean);

  console.log('🌟 Groupes de mariages avec enfants:', marriageGroups.length);

  if (marriageGroups.length === 0) return null;

  return (
    <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none" style={{ zIndex: 10 }}>
      {marriageGroups.map(({ marriageEdge, children }) => {
        if (children.length === 0) return null;

        const sourceNode = nodes.find(n => n.id === marriageEdge.source);
        const targetNode = nodes.find(n => n.id === marriageEdge.target);
        
        if (!sourceNode || !targetNode) return null;

        // Calculer le centre du mariage (point de départ)
        const marriageCenterX = (sourceNode.position.x + targetNode.position.x + 140) / 2; // +140 pour la largeur des cartes
        const marriageCenterY = (sourceNode.position.y + targetNode.position.y + 80) / 2;   // +80 pour la hauteur des cartes

        // Cas d'un enfant unique
        if (children.length === 1) {
          const childNode = children[0].node;
          const childCenterX = childNode.position.x + 70; // Centre de la carte enfant (140/2)
          const childTopY = childNode.position.y;

          return (
            <g key={`marriage-group-${marriageEdge.id}`}>
              {/* Ligne directe vers l'enfant unique */}
              <line
                x1={marriageCenterX}
                y1={marriageCenterY}
                x2={childCenterX}
                y2={childTopY}
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
              />
              
              {/* Point de départ au centre du mariage */}
              <circle
                cx={marriageCenterX}
                cy={marriageCenterY}
                r="4"
                fill="#10b981"
                stroke="white"
                strokeWidth="2"
              />
              
              {/* Point d'arrivée sur l'enfant */}
              <circle
                cx={childCenterX}
                cy={childTopY}
                r="3"
                fill="#10b981"
                stroke="white"
                strokeWidth="1"
              />
            </g>
          );
        }

        // Cas de plusieurs enfants - Structure en T
        const sortedChildren = children.sort((a, b) => a.node.position.x - b.node.position.x);
        const leftmostChild = sortedChildren[0];
        const rightmostChild = sortedChildren[sortedChildren.length - 1];
        
        const leftmostX = leftmostChild.node.position.x + 70;
        const rightmostX = rightmostChild.node.position.x + 70;
        
        // Ligne verticale de 150px vers le bas
        const verticalLineLength = 150;
        const horizontalLineY = marriageCenterY + verticalLineLength;

        return (
          <g key={`marriage-group-${marriageEdge.id}`}>
            {/* Point de départ au centre du mariage */}
            <circle
              cx={marriageCenterX}
              cy={marriageCenterY}
              r="4"
              fill="#10b981"
              stroke="white"
              strokeWidth="2"
            />
            
            {/* Ligne verticale principale */}
            <line
              x1={marriageCenterX}
              y1={marriageCenterY}
              x2={marriageCenterX}
              y2={horizontalLineY}
              stroke="#10b981"
              strokeWidth="3"
              strokeLinecap="round"
            />
            
            {/* Ligne horizontale reliant tous les enfants */}
            <line
              x1={leftmostX}
              y1={horizontalLineY}
              x2={rightmostX}
              y2={horizontalLineY}
              stroke="#10b981"
              strokeWidth="3"
              strokeLinecap="round"
            />
            
            {/* Lignes verticales vers chaque enfant */}
            {sortedChildren.map((child, index) => {
              const childCenterX = child.node.position.x + 70;
              const childTopY = child.node.position.y;
              
              return (
                <g key={`child-line-${child.id}-${index}`}>
                  <line
                    x1={childCenterX}
                    y1={horizontalLineY}
                    x2={childCenterX}
                    y2={childTopY}
                    stroke="#10b981"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <circle
                    cx={childCenterX}
                    cy={horizontalLineY}
                    r="3"
                    fill="#10b981"
                    stroke="white"
                    strokeWidth="1"
                  />
                </g>
              );
            })}
            
            {/* Point de jonction au centre de la ligne horizontale */}
            <circle
              cx={marriageCenterX}
              cy={horizontalLineY}
              r="4"
              fill="#10b981"
              stroke="white"
              strokeWidth="2"
            />
          </g>
        );
      })}
    </svg>
  );
};

export default MarriageChildrenGroupEdge;