import React from 'react';
import { getSmoothStepPath, BaseEdge } from 'reactflow';

/**
 * Arête personnalisée pour les mariages avec gestion optimisée des enfants
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
  onAddChild
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
    <g>
      {/* Ligne de mariage principale */}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: '#e11d48',
          strokeWidth: 4,
          strokeDasharray: '8,4'
        }}
      />
      
      {/* Point central cliquable avec icône + - TOUJOURS VISIBLE */}
      <g>
        <circle
          cx={centerX}
          cy={centerY}
          r="10"
          fill="#10b981"
          stroke="white"
          strokeWidth="2"
          className="cursor-pointer hover:opacity-80 hover:scale-110 transition-all duration-200"
          onClick={(e) => {
            e.stopPropagation();
            if (onAddChild) {
              onAddChild(id);
            }
          }}
        />
        <text
          x={centerX}
          y={centerY + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize="12"
          fontWeight="bold"
          className="cursor-pointer pointer-events-none select-none"
        >
          +
        </text>
      </g>
      
      {/* Nombre d'enfants */}
      {children.length > 0 && (
        <text
          x={centerX + 15}
          y={centerY - 5}
          fill="#10b981"
          fontSize="10"
          fontWeight="bold"
        >
          {children.length}
        </text>
      )}
      
      {/* Lignes vers les enfants - Nouvelle logique */}
      {children.length === 1 ? (
        // Un seul enfant - ligne en T
        children.map((child, index) => {
          const verticalLineLength = 120; // DOUBLÉ : était 60px
          const branchY = centerY + verticalLineLength;
          // Distance entre la ligne horizontale et l'enfant (+80px total)
          const childDistanceFromLine = 180;
          const finalChildY = branchY + childDistanceFromLine;
          
          return (
            <g key={`child-${index}`}>
              {/* Ligne verticale du mariage vers le bas */}
              <line
                x1={centerX}
                y1={centerY}
                x2={centerX}
                y2={branchY}
                stroke="#10b981"
                strokeWidth="2"
                strokeLinecap="round"
              />
              
              {/* Ligne horizontale vers l'enfant */}
              <line
                x1={centerX}
                y1={branchY}
                x2={child.x}
                y2={branchY}
                stroke="#10b981"
                strokeWidth="2"
                strokeLinecap="round"
              />
              
              {/* Ligne verticale vers l'enfant */}
              <line
                x1={child.x}
                y1={branchY}
                x2={child.x}
                y2={finalChildY}
                stroke="#10b981"
                strokeWidth="2"
                strokeLinecap="round"
              />
              
              {/* Points de connexion */}
              <circle
                cx={centerX}
                cy={branchY}
                r="2"
                fill="#10b981"
                stroke="white"
                strokeWidth="1"
              />
              <circle
                cx={child.x}
                cy={branchY}
                r="2"
                fill="#10b981"
                stroke="white"
                strokeWidth="1"
              />
            </g>
          );
        })
      ) : children.length > 1 ? (
        // Plusieurs enfants - système de distribution en T
        (() => {
          const verticalLineLength = 120; // DOUBLÉ : était 60px
          const distributionY = centerY + verticalLineLength;
          
          // Calculer les positions X des enfants pour la ligne horizontale
          const sortedChildren = [...children].sort((a, b) => a.x - b.x);
          const leftmostX = Math.min(...children.map(c => c.x));
          const rightmostX = Math.max(...children.map(c => c.x));
          
          return (
            <g>
              {/* Ligne verticale du centre du mariage vers le bas */}
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
              
              {/* Point central */}
              <circle
                cx={centerX}
                cy={distributionY}
                r="3"
                fill="#10b981"
                stroke="white"
                strokeWidth="1"
              />
              
              {/* Lignes verticales vers chaque enfant */}
              {children.map((child, index) => {
                // Distance entre la ligne horizontale et l'enfant (+80px total)
                const childDistanceFromLine = 180;
                const finalChildY = distributionY + childDistanceFromLine;
                
                return (
                  <g key={`child-${index}`}>
                    {/* Ligne verticale de la barre horizontale vers l'enfant */}
                    <line
                      x1={child.x}
                      y1={distributionY}
                      x2={child.x}
                      y2={finalChildY}
                      stroke="#10b981"
                      strokeWidth="2"
                      strokeLinecap="round"
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
    </g>
  );
};

export default MarriageEdge;