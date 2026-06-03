import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Baby, X } from 'lucide-react';

/**
 * Menu contextuel pour les liens entre conjoints
 */
const EdgeContextMenu = ({ x, y, edge, onClose, onDeleteEdge, onAddChild }) => {
  const handleDeleteEdge = () => {
    onDeleteEdge(edge.id);
    onClose();
  };

  const handleAddChild = () => {
    onAddChild(edge.id, edge.source, edge.target);
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50" 
        onClick={handleBackdropClick}
      >
        <motion.div
          className="absolute bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-48 z-50"
          style={{
            left: Math.min(x, window.innerWidth - 200),
            top: Math.min(y, window.innerHeight - 120),
          }}
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.15 }}
        >
          {/* En-tête du menu */}
          <div className="px-3 py-2 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Lien conjugal
              </span>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-3 h-3 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Options du menu */}
          <div className="py-1">
            <button
              onClick={handleAddChild}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
            >
              <Baby className="w-4 h-4" />
              Ajouter un enfant
            </button>
            
            <button
              onClick={handleDeleteEdge}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer le lien
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EdgeContextMenu;