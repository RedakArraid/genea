import React from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';

const MarriageConnectionPoint = ({ 
  x, 
  y, 
  onClick, 
  edgeId, 
  sourcePersonName, 
  targetPersonName 
}) => {
  return (
    <motion.div
      className="absolute w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg cursor-pointer hover:bg-red-600 transition-all duration-200 z-30 group"
      style={{ left: x - 12, top: y - 12 }}
      onClick={() => onClick(edgeId)}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      title={`Ajouter un enfant à l'union de ${sourcePersonName} et ${targetPersonName}`}
    >
      <Plus className="w-4 h-4 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
      
      {/* Tooltip */}
      <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none">
        Ajouter enfant
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
      </div>
      
      {/* Pulse animation */}
      <div className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-30"></div>
    </motion.div>
  );
};

export default MarriageConnectionPoint;
