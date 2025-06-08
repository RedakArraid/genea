import React, { useState } from 'react';
import { getSmoothStepPath, BaseEdge } from 'reactflow';

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
  onAddChild
}) => {
  // État de survol local
  const [isHovered, setIsHovered] = useState(false);
  
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
    <g
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
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
      
      {/* Point central cliquable avec icône + - Masqué par défaut */}
      <g 
        className={`transition-opacity duration-200 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <circle
          cx={centerX}
          cy={centerY}
          r="6"
          fill="#e11d48"
          stroke="white"
          strokeWidth="1"
          className="cursor-pointer hover:opacity-80 transition-opacity"
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
          fontSize="8"
          fontWeight="bold"
          className="cursor-pointer pointer-events-none select-none"
        >
          +
        </text>
      </g>
      
      {/* Texte de debug plus discret */}
      <text
        x={centerX + 10}
        y={centerY - 10}
        fill="#666"
        fontSize="10"
        fontWeight="normal"
      >
        {children.length}
      </text>
      
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
    </g>
  );
};

export default MarriageEdge;