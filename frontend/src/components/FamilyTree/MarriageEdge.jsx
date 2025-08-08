import React from 'react';
import { getSmoothStepPath, BaseEdge } from 'reactflow';
import { motion } from 'framer-motion';
import { Plus, Heart, Sparkles } from 'lucide-react';

/**
 * Arête personnalisée ultra moderne pour les mariages
 * Design glassmorphism avec animations fluides
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
      {/* Ligne de mariage principale avec gradient */}
      <defs>
        <linearGradient id={`marriage-gradient-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#ec4899', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: '#f472b6', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#ec4899', stopOpacity: 1 }} />
        </linearGradient>
        
        {/* Filtre pour l'effet de lueur */}
        <filter id={`glow-${id}`}>
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Ligne de mariage avec effet de lueur */}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: `url(#marriage-gradient-${id})`,
          strokeWidth: 4,
          strokeDasharray: '8,4',
          filter: `url(#glow-${id})`
        }}
      />

      {/* Bouton d'ajout d'enfant ultra moderne */}
      <motion.g
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Cercle de fond avec effet glassmorphism */}
        <circle
          cx={centerX}
          cy={centerY}
          r="12"
          fill="url(#marriage-gradient-${id})"
          stroke="white"
          strokeWidth="2"
          style={{ 
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
            cursor: 'pointer'
          }}
        />
        
        {/* Icône plus avec animation */}
        <motion.text
          x={centerX}
          y={centerY + 2}
          textAnchor="middle"
          fill="white"
          fontSize="12"
          fontWeight="bold"
          style={{ pointerEvents: 'none' }}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.2 }}
          transition={{ duration: 0.2 }}
        >
          +
        </motion.text>
        
        {/* Zone cliquable invisible avec événements multiples */}
        <circle
          cx={centerX}
          cy={centerY}
          r="16"
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
      </motion.g>

      {/* Indicateur du nombre d'enfants avec design moderne */}
      {children.length > 0 && (
        <motion.g
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <circle
            cx={centerX + 20}
            cy={centerY - 15}
            r="8"
            fill="#10b981"
            stroke="white"
            strokeWidth="1.5"
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
          />
          <text
            x={centerX + 20}
            y={centerY - 12}
            textAnchor="middle"
            fill="white"
            fontSize="10"
            fontWeight="bold"
          >
            {children.length}
          </text>
        </motion.g>
      )}

      {/* Lignes vers les enfants avec design moderne */}
      {children.length === 1 ? (
        // Un seul enfant - ligne directe avec gradient
        children.map((child, index) => {
          return (
            <motion.g key={`child-${index}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              <defs>
                <linearGradient id={`child-gradient-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#059669', stopOpacity: 1 }} />
                </linearGradient>
              </defs>
              
              {/* Ligne directe vers l'enfant unique */}
              <line
                x1={centerX}
                y1={centerY}
                x2={child.x}
                y2={child.y}
                stroke={`url(#child-gradient-${index})`}
                strokeWidth="3"
                strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
              />
              
              {/* Petit cercle sur l'enfant */}
              <circle
                cx={child.x}
                cy={child.y}
                r="4"
                fill="#10b981"
                stroke="white"
                strokeWidth="1"
                style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }}
              />
            </motion.g>
          );
        })
      ) : children.length > 1 ? (
        // Plusieurs enfants - système de distribution moderne
        (() => {
          const verticalLineLength = 120;
          const distributionY = centerY + verticalLineLength;
          
          // Calculer les positions X des enfants pour la ligne horizontale
          const sortedChildren = [...children].sort((a, b) => a.x - b.x);
          const leftmostX = sortedChildren[0].x;
          const rightmostX = sortedChildren[sortedChildren.length - 1].x;
          
          return (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              <defs>
                <linearGradient id={`distribution-gradient-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#059669', stopOpacity: 1 }} />
                </linearGradient>
              </defs>
              
              {/* Ligne verticale du centre vers le bas */}
              <line
                x1={centerX}
                y1={centerY}
                x2={centerX}
                y2={distributionY}
                stroke={`url(#distribution-gradient-${id})`}
                strokeWidth="3"
                strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
              />
              
              {/* Ligne horizontale de distribution */}
              <line
                x1={leftmostX}
                y1={distributionY}
                x2={rightmostX}
                y2={distributionY}
                stroke={`url(#distribution-gradient-${id})`}
                strokeWidth="3"
                strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
              />
              
              {/* Lignes verticales vers chaque enfant */}
              {children.map((child, index) => {
                return (
                  <motion.g key={`child-${index}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 + index * 0.1 }}>
                    {/* Ligne verticale de la barre horizontale vers l'enfant */}
                    <line
                      x1={child.x}
                      y1={distributionY}
                      x2={child.x}
                      y2={child.y}
                      stroke={`url(#distribution-gradient-${id})`}
                      strokeWidth="3"
                      strokeLinecap="round"
                      style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                    />
                    
                    {/* Petit cercle sur l'enfant */}
                    <circle
                      cx={child.x}
                      cy={child.y}
                      r="4"
                      fill="#10b981"
                      stroke="white"
                      strokeWidth="1"
                      style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }}
                    />
                    
                    {/* Point d'intersection sur la ligne horizontale */}
                    <circle
                      cx={child.x}
                      cy={distributionY}
                      r="3"
                      fill="#10b981"
                      stroke="white"
                      strokeWidth="1"
                      style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }}
                    />
                  </motion.g>
                );
              })}
            </motion.g>
          );
        })()
      ) : null}
    </g>
  );
};

export default MarriageEdge;