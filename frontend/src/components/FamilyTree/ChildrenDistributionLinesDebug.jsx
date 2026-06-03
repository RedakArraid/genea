import React from 'react';

/**
 * Version simplifiée qui utilise les coordonnées relatives au conteneur ReactFlow
 */
const ChildrenDistributionLinesDebug = ({ marriageEdge, children, nodes }) => {
  if (!marriageEdge || !children || children.length === 0) {
    console.log('Pas de rendu - manque de données');
    return null;
  }

  const sourceNode = nodes.find(n => n.id === marriageEdge.source);
  const targetNode = nodes.find(n => n.id === marriageEdge.target);
  
  if (!sourceNode || !targetNode) {
    console.log('Pas de rendu - nœuds introuvables');
    return null;
  }

  // Utiliser les coordonnées ReactFlow directement 
  // Ajouter un grand offset pour rendre visible même avec coordonnées négatives
  const OFFSET_X = 2000;
  const OFFSET_Y = 2000;

  const sourceX = sourceNode.position.x + 70 + OFFSET_X;
  const sourceY = sourceNode.position.y + 80 + OFFSET_Y;
  const targetX = targetNode.position.x + 70 + OFFSET_X;
  const targetY = targetNode.position.y + 80 + OFFSET_Y;
  
  // Centre du lien de mariage
  const centerX = (sourceX + targetX) / 2;
  const centerY = (sourceY + targetY) / 2;

  console.log('COORDONNÉES AVEC OFFSET:', {
    sourceOriginal: sourceNode.position,
    sourceAvecOffset: { x: sourceX, y: sourceY },
    center: { x: centerX, y: centerY }
  });

  // Position de l'enfant
  let childX = null, childY = null;
  if (children.length > 0) {
    const firstChild = children[0];
    const childNode = nodes.find(n => n.id === firstChild.id);
    if (childNode) {
      childX = childNode.position.x + 70 + OFFSET_X;
      childY = childNode.position.y + OFFSET_Y;
      
      console.log('ENFANT AVEC OFFSET:', {
        originalPos: childNode.position,
        avecOffset: { x: childX, y: childY }
      });
    }
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '4000px', // Grande zone pour contenir les offsets
        height: '4000px',
        pointerEvents: 'none',
        zIndex: 9999
      }}
    >
      <svg
        width="4000"
        height="4000"
        style={{
          position: 'absolute',
          top: 0,
          left: 0
        }}
      >
        {/* Cercle très visible au centre */}
        <circle
          cx={centerX}
          cy={centerY}
          r="20"
          fill="red"
          stroke="yellow"
          strokeWidth="5"
          opacity="1"
        />
        
        {/* Texte pour identifier */}
        <text
          x={centerX + 25}
          y={centerY - 25}
          fill="red"
          fontSize="18"
          fontWeight="bold"
          stroke="white"
          strokeWidth="1"
        >
          CENTRE MARIAGE
        </text>
        
        {/* Ligne vers l'enfant */}
        {childX !== null && childY !== null && (
          <>
            <line
              x1={centerX}
              y1={centerY}
              x2={childX}
              y2={childY}
              stroke="red"
              strokeWidth="8"
              strokeDasharray="15,10"
              opacity="1"
            />
            
            {/* Cercle sur l'enfant */}
            <circle
              cx={childX}
              cy={childY}
              r="15"
              fill="blue"
              stroke="white"
              strokeWidth="3"
            />
            
            <text
              x={childX + 20}
              y={childY - 20}
              fill="blue"
              fontSize="16"
              fontWeight="bold"
              stroke="white"
              strokeWidth="1"
            >
              ENFANT
            </text>
          </>
        )}
        
        {/* Croix de référence au centre de l'SVG pour debug */}
        <line x1="1990" y1="2000" x2="2010" y2="2000" stroke="green" strokeWidth="3" />
        <line x1="2000" y1="1990" x2="2000" y2="2010" stroke="green" strokeWidth="3" />
        <text x="2015" y="2005" fill="green" fontSize="12">CENTRE SVG</text>
      </svg>
    </div>
  );
};

export default ChildrenDistributionLinesDebug;