import React from 'react';
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
  markerEnd
}) => {
  // Debug: vérifier les données reçues
  console.log('MarriageEdge render - id:', id, 'data:', data);
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

  // Centre du lien pour les enfants - point exact sur la ligne d'union
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
          strokeWidth: 3,
          strokeDasharray: '8,4'
        }}
      />
      
      {/* Bouton d'ajout d'enfant au centre - version plus petite */}
      <g>
        {/* Cercle de fond plus petit */}
        <circle
          cx={centerX}
          cy={centerY}
          r="5"
          fill="#e11d48"
          stroke="white"
          strokeWidth="1.5"
          style={{ 
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
            cursor: 'pointer'
          }}
        />
        
        {/* Icône plus (+) plus petite */}
        <text
          x={centerX}
          y={centerY + 1}
          textAnchor="middle"
          fill="white"
          fontSize="8"
          fontWeight="bold"
          style={{ pointerEvents: 'none' }}
        >
          +
        </text>
        
        {/* Zone cliquable invisible avec événements multiples */}
        <circle
          cx={centerX}
          cy={centerY}
          r="8"
          fill="transparent"
          stroke="transparent"
          style={{ cursor: 'pointer' }}
          onMouseDown={(e) => {
            console.log('MouseDown détecté sur le bouton d\'ajout d\'enfant');
            e.stopPropagation();
            e.preventDefault();
            if (data?.onAddChild) {
              console.log('Fonction onAddChild trouvée, appel...');
              data.onAddChild(id);
            } else {
              console.log('Fonction onAddChild non trouvée dans data:', data);
            }
          }}
          onClick={(e) => {
            console.log('Click détecté sur le bouton d\'ajout d\'enfant');
            e.stopPropagation();
            e.preventDefault();
            if (data?.onAddChild) {
              console.log('Fonction onAddChild trouvée, appel...');
              data.onAddChild(id);
            } else {
              console.log('Fonction onAddChild non trouvée dans data:', data);
            }
          }}
          onPointerDown={(e) => {
            console.log('PointerDown détecté sur le bouton d\'ajout d\'enfant');
            e.stopPropagation();
            e.preventDefault();
            if (data?.onAddChild) {
              console.log('Fonction onAddChild trouvée, appel...');
              data.onAddChild(id);
            } else {
              console.log('Fonction onAddChild non trouvée dans data:', data);
            }
          }}
        />
      </g>
      
      {/* Texte de debug plus discret */}
      <text
        x={centerX + 15}
        y={centerY - 5}
        fill="#666"
        fontSize="10"
        fontWeight="normal"
      >
        {children.length}
      </text>
      
      {/* Lignes vers les enfants - partant du centre exact de la ligne d'union */}
      {children.length === 1 ? (
        // Un seul enfant - ligne directe du centre
        children.map((child, index) => {
          return (
            <g key={`child-${index}`}>
              {/* Ligne directe du centre vers l'enfant unique */}
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
        // Plusieurs enfants - système de distribution depuis le centre
        (() => {
          const verticalLineLength = 120;
          const distributionY = centerY + verticalLineLength;
          
          // Calculer les positions X des enfants pour la ligne horizontale
          const sortedChildren = [...children].sort((a, b) => a.x - b.x);
          const leftmostX = sortedChildren[0].x;
          const rightmostX = sortedChildren[sortedChildren.length - 1].x;
          
          return (
            <g>
              {/* Ligne verticale du centre exact vers le bas */}
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