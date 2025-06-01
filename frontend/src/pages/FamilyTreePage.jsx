import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  applyNodeChanges,
  applyEdgeChanges,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { AnimatePresence } from 'framer-motion';

// Importer le CSS personnalisé
import '../styles/FamilyTree.css';

// Composants
import PersonNode from '../components/FamilyTree/PersonNode';
import MarriageEdge from '../components/FamilyTree/MarriageEdge';
import NodeContextMenu from '../components/FamilyTree/NodeContextMenu';
import EdgeContextMenu from '../components/FamilyTree/EdgeContextMenu';
import AddPersonModal from '../components/FamilyTree/AddPersonModal';
import EditPersonModal from '../components/FamilyTree/EditPersonModal';
import HelpTooltip from '../components/FamilyTree/HelpTooltip';
import ShortcutNotification from '../components/FamilyTree/ShortcutNotification';
import GenderColorsToggle from '../components/ui/GenderColorsToggle';
import LegendTooltip from '../components/FamilyTree/LegendTooltip';
import { useFamilyTreeStore } from '../store/familyTreeStore';
import { useToast } from '../hooks/useToast';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';
import { calculateGenerationLayout, alignSpouses, calculateOptimalPosition, avoidNodeOverlap } from '../utils/familyTreeLayout';
import { 
  findMarriageChildren, 
  calculateChildrenPositions, 
  repositionMarriageChildren,
  calculateNewChildPosition,
  groupChildrenByMarriage 
} from '../utils/marriageChildrenUtils';
import { v4 as uuidv4 } from 'uuid';

// Options ReactFlow
const proOptions = { hideAttribution: true };

// Types d'arêtes personnalisées
const edgeTypes = {
  marriageEdge: MarriageEdge,
};

// Fonction améliorée pour les styles d'arêtes
const getEdgeStyle = (type) => {
  const styles = {
    'spouse_connection': { 
      stroke: '#e11d48', 
      strokeWidth: 4,
      strokeDasharray: '8,4'
    },
    'parent_child_connection': { 
      stroke: '#3b82f6', 
      strokeWidth: 3
    },
    'marriage_child_connection': { 
      stroke: '#10b981', 
      strokeWidth: 3
    },
    'sibling_connection': { 
      stroke: '#8b5cf6', 
      strokeWidth: 2,
      strokeDasharray: '4,2'
    },
    'default': { 
      stroke: '#6b7280', 
      strokeWidth: 2
    }
  };
  
  return styles[type] || styles.default;
};

/**
 * Page d'arbre généalogique avec lignes droites et points de mariage
 * Version améliorée avec toutes les nouvelles fonctionnalités
 */
const FamilyTreePage = () => {
  const { id: treeId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  // Référence au conteneur ReactFlow
  const reactFlowWrapper = useRef(null);
  
  // États locaux
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [edgeContextMenu, setEdgeContextMenu] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [relationType, setRelationType] = useState(null);
  const [selectedMarriageEdge, setSelectedMarriageEdge] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  
  // Référence au composant d'aide
  const helpRef = useRef(null);
  
  // Store de l'arbre généalogique
  const {
    currentTree,
    nodes,
    edges,
    isLoading,
    error,
    fetchTreeById,
    resetState,
    updateNodePositions,
    addPerson,
    updatePerson,
    deletePerson,
    addRelationship,
    deleteRelationship,
  } = useFamilyTreeStore();

  // Chargement initial de l'arbre
  useEffect(() => {
    if (treeId) {
      fetchTreeById(treeId);
    }
    
    // Nettoyage au démontage
    return () => resetState();
  }, [treeId, fetchTreeById, resetState]);

  // Appliquer les styles aux arêtes avec les handles ET utiliser des arêtes personnalisées
  const styledEdges = edges.map(edge => {
    // Masquer complètement les arêtes d'enfants de mariage car nous utilisons nos lignes personnalisées
    if (edge.data?.type === 'marriage_child_connection') {
      return {
        ...edge,
        type: 'straight',
        style: { 
          strokeWidth: 0, 
          stroke: 'transparent', 
          opacity: 0 
        },
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        hidden: true // Cacher complètement
      };
    }
    
    // Utiliser l'arête personnalisée pour les mariages avec injection des enfants
    if (edge.data?.type === 'spouse_connection') {
      const children = findMarriageChildren(edge.id, nodes, edges);
      const childrenWithPositions = children.map(child => {
        const childNode = nodes.find(n => n.id === child.id);
        return childNode ? {
          id: child.id,
          x: childNode.position.x + 70, // Centre de la carte
          y: childNode.position.y, // Haut de la carte
          name: `${childNode.data.firstName} ${childNode.data.lastName}`
        } : null;
      }).filter(Boolean);
      
      return {
        ...edge,
        type: 'marriageEdge',
        data: {
          ...edge.data,
          children: childrenWithPositions
        },
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle
      };
    }
    
    // Styles normaux pour les autres arêtes
    return {
      ...edge,
      type: 'straight',
      style: getEdgeStyle(edge.data?.type || 'parent_child_connection'),
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle
    };
  });

  // Gestion des modifications de nœuds (positions)
  const onNodesChange = useCallback(
    (changes) => {
      const updatedNodes = applyNodeChanges(changes, nodes);
      
      // Mise à jour des positions si c'est une position qui a changé
      const positionChanges = changes.filter(change => change.type === 'position' && change.position);
      
      if (positionChanges.length > 0) {
        const nodePositions = positionChanges.map(change => ({
          id: change.id,
          position: change.position
        }));
        
        updateNodePositions(nodePositions);
      }
      
      return updatedNodes;
    },
    [nodes, updateNodePositions]
  );

  // Gestion des modifications d'arêtes
  const onEdgesChange = useCallback(
    (changes) => {
      return applyEdgeChanges(changes, styledEdges);
    },
    [styledEdges]
  );

  // Gestion de la connexion entre nœuds avec handles intelligents - VERSION CORRIGÉE
  const onConnect = useCallback(
    (params) => {
      console.log('Tentative de connexion:', params);
      
      // Détecter le type de relation en fonction des handles utilisés
      const sourceNode = nodes.find(n => n.id === params.source);
      const targetNode = nodes.find(n => n.id === params.target);
      
      if (sourceNode && targetNode) {
        console.log('Nœuds trouvés:', {
          source: sourceNode.data,
          target: targetNode.data,
          sourceHandle: params.sourceHandle,
          targetHandle: params.targetHandle
        });
        
        // Déterminer le type de relation basé sur les handles utilisés
        const isSpouseConnection = 
          (params.sourceHandle && params.sourceHandle.includes('spouse')) ||
          (params.targetHandle && params.targetHandle.includes('spouse'));
        
        console.log('Type de connexion détectée:', isSpouseConnection ? 'Conjugale' : 'Familiale');
        
        let connectionParams = { ...params };
        
        if (isSpouseConnection) {
          // Assurer que les handles conjugaux corrects sont utilisés
          const sourceIsLeft = sourceNode.position.x < targetNode.position.x;
          
          connectionParams = {
            ...params,
            sourceHandle: sourceIsLeft ? 'spouse-right-source' : 'spouse-left-source',
            targetHandle: sourceIsLeft ? 'spouse-left-target' : 'spouse-right-target'
          };
          
          console.log('Handles conjugaux configurés:', {
            sourceIsLeft,
            sourceHandle: connectionParams.sourceHandle,
            targetHandle: connectionParams.targetHandle
          });
        }
        
        const relationshipType = isSpouseConnection ? 'spouse' : 'parent';
        const edgeType = isSpouseConnection ? 'spouse_connection' : 'parent_child_connection';
        
        // Créer un ID unique pour la nouvelle relation
        const newEdgeId = uuidv4();
        
        // Déterminer les handles pour les connexions parent-enfant
        let handles = {};
        if (!isSpouseConnection) {
          // Pour les relations parent-enfant, forcer l'utilisation des handles corrects
          handles = {
            sourceHandle: 'child-source',
            targetHandle: 'parent-target'
          };
        } else {
          handles = {
            sourceHandle: connectionParams.sourceHandle,
            targetHandle: connectionParams.targetHandle
          };
        }
        
        // Ajouter la relation au store
        addRelationship({
          id: newEdgeId,
          sourceId: params.source,
          targetId: params.target,
          type: relationshipType,
          data: { type: edgeType },
          ...handles
        });
        
        showToast(`Nouveau lien ${isSpouseConnection ? 'conjugal' : 'familial'} ajouté`, "success");
      }
    },
    [nodes, addRelationship, showToast]
  );

  // Gestion du clic droit sur un nœud
  const onNodeContextMenu = useCallback(
    (event, node) => {
      // Empêcher l'ouverture du menu contextuel du navigateur
      event.preventDefault();
      
      // Rechercher les arêtes de mariage (spouse) liées à ce nœud
      const marriageEdges = edges.filter(
        edge => 
          (edge.source === node.id || edge.target === node.id) && 
          edge.data?.type === 'spouse_connection'
      );
      
      // Positionner le menu contextuel
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        node,
        marriageEdges
      });
    },
    [edges]
  );

  // Fermer le menu contextuel
  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Fermer le menu contextuel des liens
  const closeEdgeContextMenu = useCallback(() => {
    setEdgeContextMenu(null);
  }, []);

  // Gérer le clic droit sur un lien
  const onEdgeContextMenu = useCallback(
    (event, edge) => {
      // Uniquement pour les liens de mariage
      if (edge.data?.type === 'spouse_connection') {
        event.preventDefault();
        setEdgeContextMenu({
          x: event.clientX,
          y: event.clientY,
          edge
        });
      }
    },
    []
  );

  // Gérer le clic sur le canevas pour fermer les menus contextuels
  const onPaneClick = useCallback(() => {
    closeContextMenu();
    closeEdgeContextMenu();
  }, [closeContextMenu, closeEdgeContextMenu]);

  // Supprimer un lien de mariage
  const handleDeleteEdge = useCallback((edgeId) => {
    if (window.confirm('Supprimer ce lien conjugal ? Les enfants de cette union ne seront pas supprimés.')) {
      deleteRelationship(edgeId).then(({ success, message }) => {
        if (success) {
          showToast('Le lien conjugal a été supprimé', 'success');
        } else {
          showToast(message || 'Erreur lors de la suppression', 'error');
        }
      });
    }
    closeEdgeContextMenu();
  }, [deleteRelationship, showToast, closeEdgeContextMenu]);

  // Ajouter un enfant à partir d'un lien de mariage
  const handleAddChildToMarriage = useCallback((edgeId, sourceId, targetId) => {
    setSelectedMarriageEdge(edgeId);
    setRelationType('marriage_child');
    setSelectedNode(null);
    setIsAddModalOpen(true);
    closeEdgeContextMenu();
  }, [closeEdgeContextMenu]);

  // Ouvrir le modal d'ajout de personne
  const openAddModal = useCallback((nodeId, type, marriageEdgeId = null) => {
    setSelectedNode(nodeId);
    setRelationType(type);
    setSelectedMarriageEdge(marriageEdgeId);
    setIsAddModalOpen(true);
    closeContextMenu();
  }, [closeContextMenu]);

  // Ouvrir le modal d'ajout de personne sans relation (bouton +)
  const openAddModalStandalone = useCallback(() => {
    setSelectedNode(null);
    setRelationType(null);
    setSelectedMarriageEdge(null);
    setIsAddModalOpen(true);
  }, []);

  // Fonction d'alignement automatique
  const autoAlignGenerations = useCallback(() => {
    if (nodes.length === 0) return;
    
    const alignedNodes = calculateGenerationLayout(nodes, edges);
    const finalNodes = alignSpouses(alignedNodes, edges);
    
    // Mettre à jour les positions
    const nodePositions = finalNodes.map(node => ({
      id: node.id,
      position: node.position
    }));
    
    updateNodePositions(nodePositions);
    showToast("Les générations ont été alignées automatiquement", "success");
  }, [nodes, edges, updateNodePositions, showToast]);

  // Basculer l'aide
  const toggleHelp = useCallback(() => {
    setShowHelp(prev => !prev);
  }, []);

  // Ajuster la vue
  const fitView = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView();
    }
  }, [reactFlowInstance]);

  // Utiliser les raccourcis clavier
  useKeyboardShortcuts({
    onAddPerson: openAddModalStandalone,
    onToggleHelp: toggleHelp,
    onFitView: fitView,
    reactFlowInstance
  });

  // Ouvrir le modal de modification de personne
  const openEditModal = useCallback((node) => {
    setSelectedNode(node);
    setIsEditModalOpen(true);
    closeContextMenu();
  }, [closeContextMenu]);

  // Fermer tous les modals
  const closeModals = useCallback(() => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedNode(null);
    setRelationType(null);
    setSelectedMarriageEdge(null);
  }, []);

  // Gérer l'ajout d'une nouvelle personne
  const handleAddPerson = useCallback((personData, parentNodeId, relationType, marriageEdgeId) => {
    // Calculer la position optimale
    let position = { x: 400, y: 200 };
    
    if (relationType === 'marriage_child' && marriageEdgeId) {
      // Trouver l'arête de mariage
      const marriageEdge = edges.find(e => e.id === marriageEdgeId);
      if (marriageEdge) {
        // Trouver les enfants existants de ce mariage
        const existingChildren = findMarriageChildren(marriageEdgeId, nodes, edges);
        // Calculer la position optimale pour le nouvel enfant
        position = calculateNewChildPosition(marriageEdge, existingChildren, nodes);
      }
    } else if (relationType && parentNodeId) {
      position = calculateOptimalPosition(nodes, parentNodeId, relationType);
    } else if (reactFlowInstance) {
      // Placer au centre du viewport si pas de relation
      const { x, y, zoom } = reactFlowInstance.getViewport();
      position = {
        x: -x / zoom + reactFlowWrapper.current.offsetWidth / 2 / zoom,
        y: -y / zoom + reactFlowWrapper.current.offsetHeight / 2 / zoom
      };
    }
    
    // Éviter les chevauchements
    position = avoidNodeOverlap(nodes, position);
    
    // Ajouter la personne au store
    addPerson(treeId, {
      ...personData,
      position
    }).then(({ success, person, node }) => {
      if (success && person) {
        showToast(`${person.firstName} ${person.lastName} a été ajouté(e) à l'arbre`, 'success');
        
        // Ajouter automatiquement une relation si nécessaire
        if (relationType && parentNodeId) {
          const newEdgeId = uuidv4();
          const parentNode = nodes.find(n => n.id === parentNodeId);
          
          let relationshipData = {
            id: newEdgeId,
            sourceId: '',
            targetId: '',
            type: '',
            data: { type: '' }
          };
          
          switch (relationType) {
            case 'child':
              relationshipData = {
                ...relationshipData,
                sourceId: parentNodeId,
                targetId: person.id,
                type: 'parent',
                data: { type: 'parent_child_connection' },
                sourceHandle: 'child-source',
                targetHandle: 'parent-target'
              };
              break;
            case 'parent':
              relationshipData = {
                ...relationshipData,
                sourceId: person.id,
                targetId: parentNodeId,
                type: 'parent',
                data: { type: 'parent_child_connection' },
                sourceHandle: 'child-source',
                targetHandle: 'parent-target'
              };
              break;
            case 'spouse':
              const newPersonIsLeft = position.x < parentNode.position.x;
              relationshipData = {
                ...relationshipData,
                sourceId: parentNodeId,
                targetId: person.id,
                type: 'spouse',
                data: { type: 'spouse_connection' },
                sourceHandle: newPersonIsLeft ? 'spouse-left-source' : 'spouse-right-source',
                targetHandle: newPersonIsLeft ? 'spouse-right-target' : 'spouse-left-target'
              };
              break;
            case 'sibling':
              relationshipData = {
                ...relationshipData,
                sourceId: parentNodeId,
                targetId: person.id,
                type: 'sibling',
                data: { type: 'sibling_connection' }
              };
              break;
          }
          
          addRelationship(relationshipData);
        } else if (relationType === 'marriage_child' && marriageEdgeId) {
          const marriageEdge = edges.find(e => e.id === marriageEdgeId);
          if (marriageEdge) {
            addRelationship({
              id: uuidv4(),
              sourceId: marriageEdge.source,
              targetId: person.id,
              type: 'parent',
              data: { 
                type: 'marriage_child_connection',
                marriageEdgeId: marriageEdgeId
              },
              sourceHandle: 'child-source',
              targetHandle: 'parent-target'
            });
            
            addRelationship({
              id: uuidv4(),
              sourceId: marriageEdge.target,
              targetId: person.id,
              type: 'parent',
              data: { 
                type: 'marriage_child_connection',
                marriageEdgeId: marriageEdgeId,
                isSecondParent: true
              },
              sourceHandle: 'child-source',
              targetHandle: 'parent-target'
            });
          }
        }
      } else {
        showToast(person?.message || 'Erreur lors de l\'ajout de la personne', 'error');
      }
    });
    
    closeModals();
  }, [nodes, edges, reactFlowInstance, reactFlowWrapper, addPerson, treeId, showToast, closeModals, addRelationship]);

  // Gérer la mise à jour d'une personne
  const handleEditPerson = useCallback((nodeId, updatedData) => {
    updatePerson(nodeId, updatedData).then(({ success, message }) => {
      if (success) {
        showToast(`Les informations ont été mises à jour`, 'success');
      } else {
        showToast(message || 'Erreur lors de la mise à jour', 'error');
      }
    });
    
    closeModals();
  }, [updatePerson, showToast, closeModals]);

  // Gérer la suppression d'une personne
  const handleDeletePerson = useCallback((nodeId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette personne ? Cette action est irréversible.')) {
      deletePerson(nodeId).then(({ success, message }) => {
        if (success) {
          showToast('La personne a été supprimée de l\'arbre', 'success');
        } else {
          showToast(message || 'Erreur lors de la suppression', 'error');
        }
      });
    }
    
    closeContextMenu();
  }, [deletePerson, showToast, closeContextMenu]);

  // Types de nœuds personnalisés avec callbacks
  const nodeTypesWithCallbacks = useMemo(() => ({
    person: (props) => (
      <PersonNode 
        {...props} 
        onAddPerson={openAddModal}
        onEditPerson={openEditModal} 
        onDeletePerson={handleDeletePerson}
      />
    ),
  }), [openAddModal, openEditModal, handleDeletePerson]);

  // Afficher un message d'erreur si nécessaire
  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="max-w-md text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Erreur</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => fetchTreeById(treeId)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Réessayer
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-secondary text-foreground rounded hover:bg-secondary/90"
            >
              Retour au tableau de bord
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Afficher un indicateur de chargement pendant le chargement
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Chargement de l'arbre généalogique...</p>
      </div>
    );
  }

  return (
    <div 
      className="h-screen w-full bg-background flex flex-col" 
      ref={reactFlowWrapper}
    >
      {currentTree && (
        <div className="py-2 px-4 border-b border-border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-foreground">{currentTree.name}</h1>
              {currentTree.description && (
                <p className="text-sm text-muted-foreground mt-1">{currentTree.description}</p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <GenderColorsToggle />
              <button
                onClick={openAddModalStandalone}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200"
                title="Ajouter une personne à l'arbre (Ctrl+N)"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Ajouter une personne
              </button>
              <button
                onClick={autoAlignGenerations}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200"
                title="Aligner automatiquement les générations"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Aligner
              </button>
              <button
                onClick={fitView}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200"
                title="Ajuster la vue (F)"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  />
                </svg>
                Ajuster
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200"
                title="Retour au tableau de bord"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Retour
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex-grow relative">
        <ReactFlow
          nodes={nodes}
          edges={styledEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onPaneClick={onPaneClick}
          onNodeContextMenu={onNodeContextMenu}
          onEdgeContextMenu={onEdgeContextMenu}
          nodeTypes={nodeTypesWithCallbacks}
          edgeTypes={edgeTypes}
          fitView
          proOptions={proOptions}
          deleteKeyCode={['Backspace', 'Delete']}
          nodesDraggable={true}
          connectionLineType="straight"
          connectionMode="loose"
          connectOnClick={false}
          defaultEdgeOptions={{
            type: 'straight',
            style: { strokeWidth: 2 }
          }}
          connectionLineStyle={{ 
            strokeWidth: 2, 
            stroke: '#94a3b8',
            strokeDasharray: '5,5'
          }}
        >
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={24} 
            size={1} 
            color="hsl(var(--foreground) / 0.1)"
          />
          <Controls position="bottom-right" className="react-flow__controls"/>
          <MiniMap position="bottom-left" className="react-flow__minimap"/>
        </ReactFlow>
        
        {/* Composant de légende sous forme de bouton */}
        <LegendTooltip />
        
        {/* Message d'accueil si l'arbre est vide */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-8 max-w-md text-center">
              <div className="mb-4">
                <svg
                  className="w-16 h-16 mx-auto text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Commencez votre arbre généalogique
              </h3>
              <p className="text-gray-600 mb-6">
                Votre arbre est vide pour le moment. Ajoutez votre première personne pour commencer à construire votre histoire familiale.
              </p>
              <button
                onClick={openAddModalStandalone}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200 pointer-events-auto"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Ajouter ma première personne
              </button>
            </div>
          </div>
        )}
        
        {/* Composant d'aide */}
        <HelpTooltip isOpen={showHelp} onToggle={toggleHelp} />
        
        {/* Notification des raccourcis */}
        <ShortcutNotification />
        
        {/* Menu contextuel */}
        <AnimatePresence>
          {contextMenu && (
            <NodeContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              node={contextMenu.node}
              onClose={closeContextMenu}
              onAddPerson={openAddModal}
              onEditPerson={openEditModal}
              onDeletePerson={handleDeletePerson}
              marriageEdges={contextMenu.marriageEdges}
            />
          )}
        </AnimatePresence>
        
        {/* Menu contextuel pour les liens */}
        <AnimatePresence>
          {edgeContextMenu && (
            <EdgeContextMenu
              x={edgeContextMenu.x}
              y={edgeContextMenu.y}
              edge={edgeContextMenu.edge}
              onClose={closeEdgeContextMenu}
              onDeleteEdge={handleDeleteEdge}
              onAddChild={handleAddChildToMarriage}
            />
          )}
        </AnimatePresence>
      </div>
      
      {/* Modals */}
      <AnimatePresence>
        {isAddModalOpen && (
          <AddPersonModal
            isOpen={isAddModalOpen}
            onClose={closeModals}
            onSubmit={handleAddPerson}
            parentNodeId={typeof selectedNode === 'string' ? selectedNode : selectedNode?.id}
            relationType={relationType}
            marriageEdgeId={selectedMarriageEdge}
            treeName={currentTree?.name}
          />
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {isEditModalOpen && selectedNode && (
          <EditPersonModal
            isOpen={isEditModalOpen}
            onClose={closeModals}
            onSubmit={handleEditPerson}
            nodeData={selectedNode.data}
            nodeId={selectedNode.id}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default FamilyTreePage;