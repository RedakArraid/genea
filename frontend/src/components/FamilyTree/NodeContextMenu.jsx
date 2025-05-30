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
      <div className="context-menu-item" onClick={() => handleAddPerson('parent')}>
        <UserPlus size={16} />
        <span>Ajouter un parent</span>
      </div>
      
      <div className="context-menu-item" onClick={() => handleAddPerson('spouse')}>
        <LinkIcon size={16} />
        <span>Ajouter un(e) conjoint(e)</span>
      </div>
      
      <div className="context-menu-item" onClick={() => handleAddPerson('child')}>
        <PlusCircle size={16} />
        <span>Ajouter un enfant</span>
      </div>
      
      <div className="context-menu-item" onClick={() => handleAddPerson('sibling')}>
        <Users size={16} />
        <span>Ajouter un frère/une sœur</span>
      </div>
      
      {marriageEdges.length > 0 && (
        <>
          <div className="border-t border-border my-1"></div>
          
          {marriageEdges.map(edge => (
            <div 
              key={edge.id} 
              className="context-menu-item" 
              onClick={() => handleAddPerson('marriage_child', edge.id)}
            >
              <Baby size={16} />
              <span>Ajouter un enfant d'union</span>
            </div>
          ))}
        </>
      )}
      
      <div className="border-t border-border my-1"></div>
      
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