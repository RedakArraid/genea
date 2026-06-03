import React from 'react';

/**
 * Composant de ligne de distribution des enfants complètement refactorisé
 * Utilise une approche intégrée dans ReactFlow plutôt qu'un overlay
 */
const ChildrenDistributionLines = ({ marriageEdge, children, nodes }) => {
  console.log('ChildrenDistributionLines rendu avec:', {
    marriageEdgeId: marriageEdge?.id,
    childrenCount: children?.length,
    nodesCount: nodes?.length
  });
  
  if (!marriageEdge || !children || children.length === 0) {
    return null;
  }

  const sourceNode = nodes.find(n => n.id === marriageEdge.source);
  const targetNode = nodes.find(n => n.id === marriageEdge.target);
  
  if (!sourceNode || !targetNode) {
    return null;
  }

  // Calculer le centre exact du lien conjugal (coordonnées ReactFlow pures)
  const centerX = (sourceNode.position.x + targetNode.position.x) / 2 + 70;
  const centerY = (sourceNode.position.y + targetNode.position.y) / 2 + 80;

  // Filtrer les enfants valides et éviter les doublons
  const validChildren = children
    .filter((child, index, arr) => arr.findIndex(c => c.id === child.id) === index)
    .map(child => {
      const childNode = nodes.find(n => n.id === child.id);
      return childNode ? { ...child, node: childNode } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.node.position.x - b.node.position.x);

  if (validChildren.length === 0) {
    return null;
  }

  // Cas d'un enfant unique - ligne directe
  if (validChildren.length === 1) {
    const childNode = validChildren[0].node;
    const childCenterX = childNode.position.x + 70;
    const childTopY = childNode.position.y;

    return (
      <>
        {/* Ligne directe du centre du mariage vers l'enfant */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 1,
            overflow: 'visible'
          }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="#10b981"
              />
            </marker>
          </defs>
          
          <line
            x1={centerX}
            y1={centerY}
            x2={childCenterX}
            y2={childTopY}
            stroke="#10b981"
            strokeWidth="4"
            strokeLinecap="round"
            markerEnd="url(#arrowhead)"
          />
          
          {/* Point de départ visible */}
          <circle
            cx={centerX}
            cy={centerY}
            r="6"
            fill="#10b981"
            stroke="white"
            strokeWidth="2"
          />
        </svg>
      </>
    );
  }

  // Cas de plusieurs enfants - système de distribution
  const verticalLineLength = 100;
  const horizontalLineY = centerY + verticalLineLength;

  const leftmostChild = validChildren[0].node;
  const rightmostChild = validChildren[validChildren.length - 1].node;
  const horizontalLineStart = leftmostChild.position.x + 70;
  const horizontalLineEnd = rightmostChild.position.x + 70;

  return (
    <>
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1,
          overflow: 'visible'
        }}
      >
        <defs>
          <marker
            id="arrowhead-multi"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#10b981"
            />
          </marker>
        </defs>
        
        {/* Point de départ au centre du mariage */}
        <circle
          cx={centerX}
          cy={centerY}
          r="6"
          fill="#10b981"
          stroke="white"
          strokeWidth="2"
        />
        
        {/* Ligne verticale du centre vers le bas */}
        <line
          x1={centerX}
          y1={centerY}
          x2={centerX}
          y2={horizontalLineY}
          stroke="#10b981"
          strokeWidth="4"
          strokeLinecap="round"
        />
        
        {/* Ligne horizontale de distribution */}
        <line
          x1={horizontalLineStart}
          y1={horizontalLineY}
          x2={horizontalLineEnd}
          y2={horizontalLineY}
          stroke="#10b981"
          strokeWidth="4"
          strokeLinecap="round"
        />
        
        {/* Lignes verticales vers chaque enfant */}
        {validChildren.map((child, index) => {
          const childCenterX = child.node.position.x + 70;
          const childTopY = child.node.position.y;
          
          return (
            <line
              key={`child-line-${child.id}-${index}`}
              x1={childCenterX}
              y1={horizontalLineY}
              x2={childCenterX}
              y2={childTopY}
              stroke="#10b981"
              strokeWidth="4"
              strokeLinecap="round"
              markerEnd="url(#arrowhead-multi)"
            />
          );
        })}
        
        {/* Petits cercles aux intersections */}
        {validChildren.map((child, index) => {
          const childCenterX = child.node.position.x + 70;
          
          return (
            <circle
              key={`intersection-${child.id}-${index}`}
              cx={childCenterX}
              cy={horizontalLineY}
              r="4"
              fill="#10b981"
              stroke="white"
              strokeWidth="1"
            />
          );
        })}
      </svg>
    </>
  );
};

export default ChildrenDistributionLines;