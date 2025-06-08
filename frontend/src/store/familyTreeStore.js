import { create } from 'zustand';
import api from '../services/api';
import { calculateAllSmartHandles } from '../utils/handleCalculator';

// Limite approximative de la longueur d'une chaîne de caractères dans PostgreSQL (ajustée par sécurité)
// La limite réelle est de 1 Go, mais on prend une marge de sécurité
const MAX_STRING_LENGTH = 800000; // ~800 KB de marge de sécurité

export const useFamilyTreeStore = create((set, get) => ({
  // État
  trees: [],
  currentTree: null,
  nodes: [],
  edges: [],
  isLoading: false,
  error: null,

  // Actions pour gérer les arbres généalogiques
  fetchTrees: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.get('/family-trees');
      set({ trees: response.data.trees, isLoading: false });
    } catch (error) {
      console.error('Erreur lors de la récupération des arbres:', error);
      set({ 
        error: error.response?.data?.message || 'Erreur lors du chargement des arbres généalogiques', 
        isLoading: false 
      });
    }
  },

  fetchTreeById: async (treeId) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.get(`/family-trees/${treeId}`);
      const { tree } = response.data;

      // Transformer les données pour ReactFlow
      const nodes = tree.Person.map(person => ({
        id: person.id,
        type: 'person',
        position: getNodePosition(person.id, tree.NodePosition),
        data: { 
          ...person,
          label: `${person.firstName} ${person.lastName}`
        }
      }));

      const edges = tree.Edge.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
        data: edge.data,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle
      }));

      // Calculer les handles intelligents pour les arêtes sans handles
      const smartEdges = calculateAllSmartHandles(edges, nodes);

      set({ 
        currentTree: tree,
        nodes,
        edges: smartEdges,
        isLoading: false 
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'arbre:', error);
      set({ 
        error: error.response?.data?.message || 'Erreur lors du chargement de l\'arbre généalogique', 
        isLoading: false 
      });
    }
  },

  createTree: async (treeData) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.post('/family-trees', treeData);
      set(state => ({ 
        trees: [...state.trees, response.data.tree],
        isLoading: false 
      }));
      return { success: true, tree: response.data.tree };
    } catch (error) {
      console.error('Erreur lors de la création de l\'arbre:', error);
      set({ 
        error: error.response?.data?.message || 'Erreur lors de la création de l\'arbre généalogique', 
        isLoading: false 
      });
      return { success: false, message: error.response?.data?.message || 'Erreur lors de la création' };
    }
  },

  updateTree: async (treeId, treeData) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.put(`/family-trees/${treeId}`, treeData);
      set(state => ({ 
        trees: state.trees.map(tree => tree.id === treeId ? response.data.tree : tree),
        currentTree: state.currentTree?.id === treeId ? response.data.tree : state.currentTree,
        isLoading: false 
      }));
      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'arbre:', error);
      set({ 
        error: error.response?.data?.message || 'Erreur lors de la mise à jour de l\'arbre généalogique', 
        isLoading: false 
      });
      return { success: false, message: error.response?.data?.message || 'Erreur lors de la mise à jour' };
    }
  },

  deleteTree: async (treeId) => {
    set({ isLoading: true, error: null });

    try {
      await api.delete(`/family-trees/${treeId}`);
      set(state => ({ 
        trees: state.trees.filter(tree => tree.id !== treeId),
        currentTree: state.currentTree?.id === treeId ? null : state.currentTree,
        isLoading: false 
      }));
      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'arbre:', error);
      set({ 
        error: error.response?.data?.message || 'Erreur lors de la suppression de l\'arbre généalogique', 
        isLoading: false 
      });
      return { success: false, message: error.response?.data?.message || 'Erreur lors de la suppression' };
    }
  },

  // Actions pour gérer les personnes
  addPerson: async (treeId, personData) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.post(`/persons/tree/${treeId}`, personData);
      const newPerson = response.data.person;
      
      // Création du nœud pour ReactFlow
      const newNode = {
        id: newPerson.id,
        type: 'person',
        position: personData.position || { x: 0, y: 0 },
        data: { 
          ...newPerson,
          label: `${newPerson.firstName} ${newPerson.lastName}`
        }
      };

      // Enregistrer la position du nœud
      await api.post(`/node-positions`, {
        nodeId: newPerson.id,
        treeId: treeId,
        x: newNode.position.x,
        y: newNode.position.y
      });

      set(state => ({ 
        nodes: [...state.nodes, newNode],
        isLoading: false 
      }));
      return { success: true, person: newPerson, node: newNode };
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la personne:', error);
      set({ 
        error: error.response?.data?.message || 'Erreur lors de l\'ajout de la personne', 
        isLoading: false 
      });
      return { success: false, message: error.response?.data?.message || 'Erreur lors de l\'ajout' };
    }
  },

  updatePerson: async (personId, personData) => {
    set({ isLoading: true, error: null });

    try {
      console.log('updatePerson appelé avec ID:', personId);
      // Ne conserver que les champs fournis
      const fieldsToUpdate = {};
      
      Object.entries(personData).forEach(([key, value]) => {
        if (value !== undefined) fieldsToUpdate[key] = value;
      });
      
      console.log('Champs à mettre à jour:', Object.keys(fieldsToUpdate));
      
      // Traitement spécifique de la photo
      if (fieldsToUpdate.photoUrl) {
        const photoSize = fieldsToUpdate.photoUrl.length;
        console.log('Taille de la photo:', Math.round(photoSize / 1024), 'KB');
        
        // Vérifier si la photo n'est pas trop grande
        const MAX_SIZE = 400000; // 400 KB max
        if (photoSize > MAX_SIZE) {
          console.warn('Photo trop grande pour être envoyée directement, tentative sans photo');
          delete fieldsToUpdate.photoUrl;
        }
      }
      
      // Requête API
      try {
        console.log('Envoi de la requête PUT à', `/persons/${personId}`);
        const response = await api.put(`/persons/${personId}`, fieldsToUpdate);
        console.log('Réponse reçue:', response.status);
        const updatedPerson = response.data.person;
        
        // Mise à jour du state
        set(state => ({ 
          nodes: state.nodes.map(node => 
            node.id === personId 
              ? { 
                  ...node, 
                  data: { 
                    ...node.data, 
                    ...updatedPerson,
                    label: `${updatedPerson.firstName} ${updatedPerson.lastName}`
                  } 
                } 
              : node
          ),
          isLoading: false 
        }));
        
        return { 
          success: true,
          message: fieldsToUpdate.photoUrl ? 'Mise à jour avec photo réussie' : 'Mise à jour sans photo réussie'
        };
      } catch (reqError) {
        console.error('Erreur API:', reqError);
        if (reqError.response) {
          console.error('Détails:', {
            status: reqError.response.status,
            message: reqError.response.data?.message,
            errors: reqError.response.data?.errors
          });
        }
        
        throw reqError;
      }
    } catch (error) {
      console.error('Erreur globale:', error);
      set({ 
        error: error.response?.data?.message || 'Erreur lors de la mise à jour', 
        isLoading: false 
      });
      return { 
        success: false, 
        message: error.response?.data?.message || 'Erreur lors de la mise à jour' 
      };
    }
  },

  deletePerson: async (personId) => {
    set({ isLoading: true, error: null });

    try {
      await api.delete(`/persons/${personId}`);
      
      // Supprimer le nœud et les arêtes connectées
      set(state => ({ 
        nodes: state.nodes.filter(node => node.id !== personId),
        edges: state.edges.filter(edge => edge.source !== personId && edge.target !== personId),
        isLoading: false 
      }));
      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      set({ 
        error: error.response?.data?.message || 'Erreur lors de la suppression', 
        isLoading: false 
      });
      return { success: false, message: error.response?.data?.message || 'Erreur lors de la suppression' };
    }
  },

  // Actions pour gérer les relations
  addRelationship: async (relationshipData) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.post('/relationships', relationshipData);
      const newRelationship = response.data.relationship;
      
      // Supprimer la logique de création d'arête côté client, car elle est maintenant gérée par le backend
      // et l'arbre sera rechargé pour refléter les changements du backend.

      // Recharger l'arbre complet pour s'assurer que les nœuds et les arêtes sont à jour
      await get().fetchTreeById(get().currentTree.id);

      showToast(`Nouveau lien ${relationshipData.type === 'spouse' ? 'conjugal' : 'familial'} ajouté`, "success");
      return { success: true };
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la relation:', error);
      set({ 
        error: error.response?.data?.message || 'Erreur lors de l\'ajout de la relation', 
        isLoading: false 
      });
      return { success: false, message: error.response?.data?.message || 'Erreur lors de l\'ajout' };
    }
  },

  deleteRelationship: async (relationshipId) => {
    set({ isLoading: true, error: null });

    try {
      await api.delete(`/relationships/${relationshipId}`);
      
      // Supprimer l'arête
      set(state => ({ 
        edges: state.edges.filter(edge => edge.id !== relationshipId),
        isLoading: false 
      }));
      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la suppression de la relation:', error);
      set({ 
        error: error.response?.data?.message || 'Erreur lors de la suppression de la relation', 
        isLoading: false 
      });
      return { success: false, message: error.response?.data?.message || 'Erreur lors de la suppression' };
    }
  },

  // Actions pour gérer les positions des nœuds
  updateNodePositions: async (nodePositions) => {
    // Mettre à jour l'état local immédiatement
    set(state => ({
      nodes: state.nodes.map(node => {
        const updatedPosition = nodePositions.find(pos => pos.id === node.id);
        if (updatedPosition) {
          return {
            ...node,
            position: {
              x: updatedPosition.position.x,
              y: updatedPosition.position.y
            }
          };
        }
        return node;
      })
    }));

    // Enregistrer dans la base de données
    try {
      const treeId = get().currentTree?.id;
      if (!treeId) return;

      // Récupérer les positions existantes
      const response = await api.get(`/node-positions/tree/${treeId}`);
      const existingPositions = response.data.nodePositions || [];

      for (const pos of nodePositions) {
        // Chercher si position existante
        const existingPosition = existingPositions.find(p => p.nodeId === pos.id);

        if (existingPosition) {
          // Mettre à jour
          await api.put(`/node-positions/${existingPosition.id}`, {
            x: pos.position.x,
            y: pos.position.y
          });
        } else {
          // Créer nouvelle
          await api.post(`/node-positions`, {
            nodeId: pos.id,
            treeId: treeId,
            x: pos.position.x,
            y: pos.position.y
          });
        }
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des positions:', error);
    }
  },

  // Réinitialiser le state
  resetState: () => {
    set({
      currentTree: null,
      nodes: [],
      edges: [],
      isLoading: false,
      error: null
    });
  }
}));

// Fonction utilitaire pour obtenir la position d'un nœud
function getNodePosition(nodeId, nodePositions) {
  const nodePosition = nodePositions.find(np => np.nodeId === nodeId);
  
  if (nodePosition) {
    return { x: nodePosition.x, y: nodePosition.y };
  }
  
  return { x: 0, y: 0 };
}