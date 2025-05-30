import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Baby, Users } from 'lucide-react';

/**
 * Composant UnionLine avec menu contextuel
 * Trait rouge horizontal entre conjoints avec actions
 */
const UnionLineWithMenu = ({ 
  width, 
  hasChildren, 
  onAddChild, 
  onDeleteUnion,
  spouse1Name,
  spouse2Name,
  unionId 
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const handleRightClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({
      x: e.clientX,
      y: e.clientY
    });
    setShowMenu(true);
  };

  const handleClick = (e) => {
    e.stopPropagation();
    if (!hasChildren && onAddChild) {
      onAddChild();
    }
  };

  const closeMenu = () => {
    setShowMenu(false);
  };

  const handleAddChild = () => {
    onAddChild?.();
    closeMenu();
  };

  const handleDeleteUnion = () => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'union entre ${spouse1Name} et ${spouse2Name} ?`)) {
      onDeleteUnion?.(unionId);
    }
    closeMenu();
  };

  return (
    <>
      <div className="relative">
        {/* Trait rouge principal */}
        <div 
          className="border-t-4 border-red-500 cursor-pointer hover:border-red-600 transition-colors relative"
          style={{ width: `${width}px` }}
          onClick={handleClick}
          onContextMenu={handleRightClick}
          title={hasChildren ? `Union: ${spouse1Name} & ${spouse2Name}` : "Clic pour ajouter un enfant, clic droit pour plus d'options"}
        >
          {/* Points décoratifs */}
          <div className="absolute -left-2 -top-2 w-4 h-4 bg-red-500 rounded-full"></div>
          <div className="absolute -right-2 -top-2 w-4 h-4 bg-red-500 rounded-full"></div>
          
          {/* Point central pour les enfants */}
          {hasChildren && (
            <div className="absolute top-0 left-1/2 transform -translate-x-0.5 w-1 h-8 bg-blue-500" />
          )}
          
          {/* Bouton d'ajout si pas d'enfants */}
          {!hasChildren && (
            <div className="absolute top-1 left-1/2 transform -translate-x-1/2">
              <motion.button
                className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors shadow-md"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddChild();
                }}
              >
                <Plus className="w-3 h-3" />
              </motion.button>
            </div>
          )}
        </div>
        
        {/* Indicateur de survol */}
        <div className="absolute inset-0 bg-red-200 opacity-0 hover:opacity-20 transition-opacity rounded" 
             style={{ width: `${width}px`, height: '4px', top: '-2px' }} />
      </div>

      {/* Menu contextuel */}
      <AnimatePresence>
        {showMenu && (
          <>
            {/* Overlay pour fermer le menu */}
            <div 
              className="fixed inset-0 z-40"
              onClick={closeMenu}
            />
            
            {/* Menu */}
            <motion.div
              className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-48"
              style={{
                left: menuPosition.x,
                top: menuPosition.y
              }}
              initial={{ opacity: 0, scale: 0.8, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              {/* En-tête du menu */}
              <div className="px-3 py-2 border-b border-gray-100">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Users className="w-4 h-4 text-red-500" />
                  <span>Union</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {spouse1Name} & {spouse2Name}
                </div>
              </div>
              
              {/* Actions */}
              <div className="py-1">
                <button
                  onClick={handleAddChild}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 transition-colors"
                >
                  <Baby className="w-4 h-4 text-blue-500" />
                  <span>Ajouter un enfant</span>
                </button>
                
                <div className="border-t border-gray-100 my-1"></div>
                
                <button
                  onClick={handleDeleteUnion}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Supprimer l'union</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default UnionLineWithMenu;
