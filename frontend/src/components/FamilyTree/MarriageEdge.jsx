import React from 'react';
import { getSmoothStepPath, BaseEdge } from 'reactflow';
import { Plus } from 'lucide-react';

/**
 * Arête personnalisée pour les mariages avec gestion des enfants
 */
const MarriageEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
  onAddChild // Prop pour gérer l'ajout d'enfant
}) => {
  // Créer le chemin de l'arête
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 0 // Lignes droites
  });

  // Centre du lien pour les enfants
  const centerX = (sourceX + targetX) / 2;
  const centerY = (sourceY + targetY) / 2;

  // Données des enfants depuis les props
  const children = data?.children || [];

  return (
    <>
      {/* Ligne de mariage principale */}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: '#e11d48',
          strokeWidth: 3,
          strokeDasharray: '8,4'
        }}
      />
      
      {/* Bouton HTML pour ajouter des enfants */}
      <foreignObject
        x={centerX - 8}
        y={centerY - 8}
        width={16}
        height={16}
        style={{ pointerEvents: 'all' }}
      >
        <button
          className="w-4 h-4 bg-red-500 border-2 border-white rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-110 z-50"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onAddChild) {
              const sourceId = data?.sourceId || null;
              const targetId = data?.targetId || null;
              onAddChild(id, sourceId, targetId);
            }
          }}
          title="Ajouter un enfant à l'union"
        >
          <Plus className="w-2 h-2 text-white" strokeWidth={3} />
        </button>
      </foreignObject>
      
      {/* Nombre d'enfants (optionnel) */}
      {children.length > 0 && (
        <text
          x={centerX + 12}
          y={centerY - 8}
          fill="#666"
          fontSize="10"
          fontWeight="normal"
        >
          {children.length}
        </text>
      )}
      
      {/* Lignes vers les enfants */}
      {children.length === 1 ? (
        // Un seul enfant - ligne directe
        children.map((child, index) => {
          return (
            <g key={`child-${index}`}>
              {/* Ligne directe vers l'enfant unique */}
              <line
                x1={centerX}
                y1={centerY}
                x2={child.x}
                y2={child.y}
                stroke="#10b981"
                strokeWidth="2"
                strokeLinecap="round"
              />
              
              {/* Petit cercle sur l'enfant */}
              <circle
                cx={child.x}
                cy={child.y}
                r="3"
                fill="#10b981"
                stroke="white"
                strokeWidth="1"
              />
            </g>
          );
        })
      ) : children.length > 1 ? (
        // Plusieurs enfants - système de distribution
        (() => {
          const verticalLineLength = 120; // Rallongé de 80 à 120
          const distributionY = centerY + verticalLineLength;
          
          // Calculer les positions X des enfants pour la ligne horizontale
          const sortedChildren = [...children].sort((a, b) => a.x - b.x);
          const leftmostX = sortedChildren[0].x;
          const rightmostX = sortedChildren[sortedChildren.length - 1].x;
          
          return (
            <g>
              {/* Ligne verticale du centre vers le bas */}
              <line
                x1={centerX}
                y1={centerY}
                x2={centerX}
                y2={distributionY}
                stroke="#10b981"
                strokeWidth="2"
                strokeLinecap="round"
              />
              
              {/* Ligne horizontale de distribution */}
              <line
                x1={leftmostX}
                y1={distributionY}
                x2={rightmostX}
                y2={distributionY}
                stroke="#10b981"
                strokeWidth="2"
                strokeLinecap="round"
              />
              
              {/* Lignes verticales vers chaque enfant */}
              {children.map((child, index) => {
                return (
                  <g key={`child-${index}`}>
                    {/* Ligne verticale de la barre horizontale vers l'enfant */}
                    <line
                      x1={child.x}
                      y1={distributionY}
                      x2={child.x}
                      y2={child.y}
                      stroke="#10b981"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    
                    {/* Petit cercle sur l'enfant */}
                    <circle
                      cx={child.x}
                      cy={child.y}
                      r="3"
                      fill="#10b981"
                      stroke="white"
                      strokeWidth="1"
                    />
                    
                    {/* Point d'intersection sur la ligne horizontale */}
                    <circle
                      cx={child.x}
                      cy={distributionY}
                      r="2"
                      fill="#10b981"
                      stroke="white"
                      strokeWidth="1"
                    />
                  </g>
                );
              })}
            </g>
          );
        })()
      ) : null}
    </>
  );
};

export default MarriageEdge;