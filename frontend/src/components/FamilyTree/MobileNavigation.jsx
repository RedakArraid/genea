import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  List, 
  Navigation,
  MapPin,
  Search,
  X
} from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';

/**
 * Composant de navigation mobile pour ReactFlow
 * Fournit des contrôles tactiles optimisés et une navigation rapide
 */
const MobileNavigation = ({ reactFlowInstance, nodes, currentTree }) => {
  const { isTouchDevice, isMobile } = useIsMobile();
  const [showNodeList, setShowNodeList] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // N'afficher que sur les appareils tactiles
  if (!isTouchDevice) return null;

  // Filtrer les nœuds selon le terme de recherche
  const filteredNodes = nodes.filter(node => {
    const fullName = `${node.data.firstName} ${node.data.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  // Naviguer vers un nœud spécifique
  const zoomToNode = useCallback((nodeId) => {
    const node = reactFlowInstance?.getNode(nodeId);
    if (node) {
      reactFlowInstance.setCenter(
        node.position.x + 70, // Centre de la carte
        node.position.y + 80,
        { zoom: 1.2, duration: 500 }
      );
    }
    setShowNodeList(false);
    setSearchTerm('');
  }, [reactFlowInstance]);

  // Actions de zoom
  const handleZoomIn = useCallback(() => {
    reactFlowInstance?.zoomIn({ duration: 200 });
  }, [reactFlowInstance]);

  const handleZoomOut = useCallback(() => {
    reactFlowInstance?.zoomOut({ duration: 200 });
  }, [reactFlowInstance]);

  const handleFitView = useCallback(() => {
    reactFlowInstance?.fitView({ 
      duration: 300, 
      padding: 0.1,
      minZoom: 0.5,
      maxZoom: 2
    });
  }, [reactFlowInstance]);

  // Styles de base
  const buttonStyle = {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'white',
    border: '1px solid #e5e7eb',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    color: '#374151'
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    background: '#3b82f6',
    color: 'white',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
  };

  return (
    <>
      {/* Contrôles de zoom - Coin inférieur gauche */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        zIndex: 1000
      }}>
        <motion.button
          onClick={handleZoomIn}
          style={buttonStyle}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
        >
          <ZoomIn size={20} />
        </motion.button>
        
        <motion.button
          onClick={handleZoomOut}
          style={buttonStyle}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
        >
          <ZoomOut size={20} />
        </motion.button>
        
        <motion.button
          onClick={handleFitView}
          style={buttonStyle}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
        >
          <Maximize size={20} />
        </motion.button>
      </div>

      {/* Bouton de navigation rapide - Coin supérieur droit */}
      <div style={{
        position: 'fixed',
        top: '80px', // Sous la barre de titre
        right: '20px',
        zIndex: 1000
      }}>
        <motion.button
          onClick={() => setShowNodeList(!showNodeList)}
          style={showNodeList ? { ...primaryButtonStyle, background: '#dc2626' } : primaryButtonStyle}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
        >
          {showNodeList ? <X size={20} /> : <List size={20} />}
        </motion.button>
      </div>

      {/* Panel de navigation */}
      <AnimatePresence>
        {showNodeList && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.3)',
                zIndex: 998
              }}
              onClick={() => setShowNodeList(false)}
            />
            
            {/* Panel principal */}
            <motion.div
              initial={{ 
                opacity: 0, 
                x: isMobile ? 0 : 300, 
                y: isMobile ? -100 : 0,
                scale: isMobile ? 0.9 : 1
              }}
              animate={{ 
                opacity: 1, 
                x: 0, 
                y: 0,
                scale: 1
              }}
              exit={{ 
                opacity: 0, 
                x: isMobile ? 0 : 300, 
                y: isMobile ? -100 : 0,
                scale: isMobile ? 0.9 : 1
              }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{
                position: 'fixed',
                ...(isMobile ? {
                  // Mobile : centré
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '90vw',
                  maxWidth: '400px',
                  maxHeight: '70vh'
                } : {
                  // Tablette : côté droit
                  top: '140px',
                  right: '20px',
                  width: '320px',
                  maxHeight: '60vh'
                }),
                background: 'white',
                borderRadius: '16px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                border: '1px solid #e5e7eb',
                overflow: 'hidden',
                zIndex: 999
              }}
            >
              {/* En-tête avec recherche */}
              <div style={{
                padding: '20px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px'
                }}>
                  <div>
                    <h3 style={{
                      margin: 0,
                      fontSize: '18px',
                      fontWeight: '600'
                    }}>
                      Navigation
                    </h3>
                    <p style={{
                      margin: '4px 0 0 0',
                      fontSize: '14px',
                      opacity: 0.9
                    }}>
                      {currentTree?.name || 'Arbre généalogique'}
                    </p>
                  </div>
                  <span style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {filteredNodes.length} personne{filteredNodes.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Barre de recherche */}
                <div style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <Search 
                    size={16} 
                    style={{
                      position: 'absolute',
                      left: '12px',
                      color: '#6b7280',
                      zIndex: 1
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Rechercher une personne..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 12px 12px 40px',
                      border: 'none',
                      borderRadius: '12px',
                      background: 'white',
                      fontSize: '14px',
                      outline: 'none',
                      color: '#374151'
                    }}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: '#f3f4f6',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#6b7280'
                      }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Liste des personnes */}
              <div style={{
                maxHeight: isMobile ? '40vh' : '50vh',
                overflowY: 'auto',
                padding: searchTerm ? '8px 0' : '12px 0'
              }}>
                {filteredNodes.length === 0 ? (
                  <div style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    color: '#6b7280'
                  }}>
                    {searchTerm ? (
                      <>
                        <Search size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                        <p style={{ margin: 0, fontSize: '14px' }}>
                          Aucune personne trouvée pour "{searchTerm}"
                        </p>
                      </>
                    ) : (
                      <>
                        <List size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                        <p style={{ margin: 0, fontSize: '14px' }}>
                          Aucune personne dans l'arbre
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  filteredNodes.map((node, index) => (
                    <motion.button
                      key={node.id}
                      onClick={() => zoomToNode(node.id)}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      style={{
                        width: '100%',
                        padding: '16px 20px',
                        background: 'transparent',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        borderBottom: index < filteredNodes.length - 1 ? '1px solid #f3f4f6' : 'none',
                        transition: 'background-color 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                      whileTap={{ scale: 0.98 }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: node.data.photo ? 'transparent' : '#e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        flexShrink: 0
                      }}>
                        {node.data.photo ? (
                          <img 
                            src={node.data.photo} 
                            alt={`${node.data.firstName} ${node.data.lastName}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        ) : (
                          <MapPin size={18} style={{ color: '#6b7280' }} />
                        )}
                      </div>
                      
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '15px',
                          fontWeight: '500',
                          color: '#374151',
                          marginBottom: '2px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {node.data.firstName} {node.data.lastName}
                        </div>
                        {node.data.birthDate && (
                          <div style={{
                            fontSize: '13px',
                            color: '#6b7280'
                          }}>
                            Né(e) en {new Date(node.data.birthDate).getFullYear()}
                            {node.data.birthPlace && ` à ${node.data.birthPlace}`}
                          </div>
                        )}
                        {node.data.profession && (
                          <div style={{
                            fontSize: '12px',
                            color: '#8b5cf6',
                            marginTop: '2px'
                          }}>
                            {node.data.profession}
                          </div>
                        )}
                      </div>
                      
                      <Navigation 
                        size={16} 
                        style={{ 
                          color: '#9ca3af',
                          flexShrink: 0
                        }} 
                      />
                    </motion.button>
                  ))
                )}
              </div>

              {/* Footer */}
              <div style={{
                padding: '16px 20px',
                background: '#f9fafb',
                borderTop: '1px solid #f3f4f6'
              }}>
                <div style={{
                  display: 'flex',
                  gap: '8px'
                }}>
                  <button
                    onClick={handleFitView}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: '#f3f4f6',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#374151',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Maximize size={14} />
                    Vue d'ensemble
                  </button>
                  <button
                    onClick={() => setShowNodeList(false)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: 'transparent',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#6b7280',
                      cursor: 'pointer'
                    }}
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileNavigation;
