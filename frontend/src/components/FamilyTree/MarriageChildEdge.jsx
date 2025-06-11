import React from 'react';
import { getBezierPath } from 'reactflow';

/**
 * Composant d'arête personnalisé pour les relations marriage_child_connection
 * Utilise les vraies coordonnées calculées par ReactFlow
 */
const MarriageChildEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data = {},
  markerEnd,
}) => {
  console.log('🔥 MarriageChildEdge rendu avec:', {
    id: id.slice(0, 8),
    sourceX, sourceY, targetX, targetY,
    marriageEdgeId: data.marriageEdgeId?.slice(0, 8)
  });

  // Utiliser une ligne droite simple au lieu de Bezier pour plus de clarté
  const edgePath = `M${sourceX},${sourceY} L${targetX},${targetY}`;

  return (
    <>
      <path
        id={id}
        style={{
          stroke: '#10b981',
          strokeWidth: 4,
          strokeLinecap: 'round',
          fill: 'none',
          ...style
        }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      
      {/* Point de départ */}
      <circle
        cx={sourceX}
        cy={sourceY}
        r="4"
        fill="#10b981"
        stroke="white"
        strokeWidth="2"
      />
      
      {/* Point d'arrivée */}
      <circle
        cx={targetX}
        cy={targetY}
        r="3"
        fill="#10b981"
        stroke="white"
        strokeWidth="1"
      />
      
      {/* Label de debug au milieu de l'arête */}
      <text
        x={(sourceX + targetX) / 2}
        y={(sourceY + targetY) / 2 - 10}
        fill="#10b981"
        fontSize="10"
        textAnchor="middle"
        style={{ fontWeight: 'bold' }}
      >
        Child
      </text>
    </>
  );
};

export default MarriageChildEdge;