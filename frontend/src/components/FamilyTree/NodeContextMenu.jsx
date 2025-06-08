import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Link as LinkIcon, Users, PlusCircle, Baby, Edit3, Trash2 } from 'lucide-react';

/**
 * Composant NodeContextMenu - Affiche un menu contextuel pour les actions sur les nœuds
 */
const NodeContextMenu = ({ x, y, node, onClose, onAddPerson, onEditPerson, onDeletePerson, marriageEdges = [] }) => {
  // Empêcher la propagation des événements
  const stopPropagation = (e) => {
    e.stopPropagation();
  };

  // Gérer l'ajout d'une personne avec une relation spécifique
  const handleAddPerson = (relationType, marriageEdgeId = null) => {
    onAddPerson(node.id, relationType, marriageEdgeId);
  };

  // Gérer la modification d'une personne
  const handleEditPerson = () => {
    onEditPerson(node);
  };

  // Gérer la suppression d'une personne
  const handleDeletePerson = () => {
    onDeletePerson(node.id);
  };

  return (
    <motion.div 
      className="context-menu"
      style={{ 
        top: y, 
        left: x 
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      onClick={stopPropagation}
    >

      
      <div className="context-menu-item" onClick={handleEditPerson}>
        <Edit3 size={16} />
        <span>Modifier</span>
      </div>
      
      <div className="context-menu-item text-destructive" onClick={handleDeletePerson}>
        <Trash2 size={16} />
        <span>Supprimer</span>
      </div>
    </motion.div>
  );
};

export default NodeContextMenu;