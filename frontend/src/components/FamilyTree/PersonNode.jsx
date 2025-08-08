import React, { useState, useCallback, memo } from 'react';
import { Handle, Position } from 'reactflow';
import { 
  User, 
  Edit3, 
  PlusCircle, 
  Trash2, 
  Users, 
  UserPlus, 
  Link as LinkIcon, 
  Calendar, 
  MapPin, 
  Baby, 
  Heart,
  Crown,
  Sparkles,
  MoreHorizontal,
  Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFamilyTreeStore } from '../../store/familyTreeStore';
import { useGenderColors } from '../../hooks/useGenderColors';
import { compressImage, ensureBase64Size } from '../../utils/imageCompression';

/**
 * Composant PersonNode - Version ultra moderne
 * Design glassmorphism avec animations fluides
 */
const PersonNode = ({ data, isConnectable, selected, id, onAddPerson, onEditPerson, onDeletePerson }) => {
  const { updatePerson, nodes, edges } = useFamilyTreeStore();
  const { getPersonCardStyles } = useGenderColors();
  const [showActions, setShowActions] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // Vérifier si la personne est décédée
  const isDeceased = Boolean(data.deathDate);
  
  // Obtenir les styles selon le genre et l'état
  const cardStyles = getPersonCardStyles(data.gender, isDeceased);
  
  // Gérer les erreurs de chargement d'image
  const handleImageError = (e) => {
    e.target.style.display = 'none'; 
    const placeholder = e.target.nextElementSibling;
    if (placeholder) placeholder.style.display = 'flex';
  };

  // Gérer l'upload d'image avec optimisation
  const handleImageUpload = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      setIsUploading(true);
      
      // Première compression avec qualité faible
      const compressedImage = await compressImage(file, 200, 200, 0.3);
      
      // Compression encore plus forte si nécessaire
      const optimizedImage = await ensureBase64Size(compressedImage, 500000);
      
      if (!optimizedImage) {
        alert("L'image est trop volumineuse. Veuillez choisir une image plus petite.");
        setIsUploading(false);
        return;
      }
      
      // Construire les données à envoyer
      const personData = {
        firstName: data.firstName,
        lastName: data.lastName,
        photoUrl: optimizedImage
      };
      
      // Ajouter les autres champs seulement s'ils existent déjà
      if (data.birthDate) personData.birthDate = data.birthDate;
      if (data.birthPlace) personData.birthPlace = data.birthPlace;
      if (data.deathDate) personData.deathDate = data.deathDate;
      if (data.occupation) personData.occupation = data.occupation;
      if (data.biography) personData.biography = data.biography;
      if (data.gender) personData.gender = data.gender;
      
      // Mettre à jour la personne avec l'image optimisée
      const result = await updatePerson(id, personData);
      
      if (!result.success) {
        throw new Error(result.message || "Erreur lors de la mise à jour");
      }
      
    } catch (error) {
      console.error("Erreur lors du traitement de l'image:", error);
      alert("Une erreur est survenue lors du traitement de l'image. Veuillez réessayer avec une image plus petite.");
    } finally {
      setIsUploading(false);
    }
  }, [id, updatePerson, data]);

  // Gérer le clic sur le nœud pour afficher/masquer les détails
  const handleNodeClick = useCallback((event) => {
    event.stopPropagation();
    setShowDetails(!showDetails);
  }, [showDetails]);

  // Calculer l'âge ou la durée de vie
  const getAgeOrLifespan = () => {
    const birthYear = data.birthDate ? new Date(data.birthDate).getFullYear() : null;
    const deathYear = data.deathDate ? new Date(data.deathDate).getFullYear() : null;
    
    if (!birthYear) return null;
    
    const currentYear = new Date().getFullYear();
    if (deathYear) {
      const age = deathYear - birthYear;
      return `${birthYear} - ${deathYear} (${age} ans)`;
    } else {
      const age = currentYear - birthYear;
      return `Né(e) en ${birthYear} (${age} ans)`;
    }
  };

  // Vérifier si cette personne peut avoir un enfant de mariage
  const canAddChildToMarriage = useCallback(() => {
    const marriageEdges = edges.filter(edge => 
      (edge.source === id || edge.target === id) && 
      edge.data?.type === 'spouse_connection'
    );
    
    return marriageEdges.length > 0;
  }, [id, edges]);

  // Fonctions pour gérer les actions du menu
  const handleActionClick = useCallback((event, actionType) => {
    event.preventDefault();
    event.stopPropagation();
    
    const node = { id, data };
    
    switch (actionType) {
      case 'parent':
        onAddPerson?.(id, 'parent');
        break;
      case 'spouse':
        onAddPerson?.(id, 'spouse');
        break;
      case 'child':
        onAddPerson?.(id, 'child');
        break;
      case 'sibling':
        onAddPerson?.(id, 'sibling');
        break;
      case 'marriage_child':
        // Trouver les arêtes de mariage pour cette personne
        const marriageEdges = edges.filter(edge => 
          (edge.source === id || edge.target === id) && 
          edge.data?.type === 'spouse_connection'
        );
        if (marriageEdges.length > 0) {
          onAddPerson?.(id, 'marriage_child', marriageEdges[0].id);
        }
        break;
      case 'edit':
        onEditPerson?.(node);
        break;
      case 'delete':
        onDeletePerson?.(id);
        break;
      default:
        break;
    }
  }, [id, data, edges, onAddPerson, onEditPerson, onDeletePerson]);

  // Déterminer les couleurs selon le genre
  const getGenderColors = () => {
    switch (data.gender) {
      case 'male':
        return {
          primary: 'from-blue-500 to-blue-600',
          secondary: 'bg-blue-100',
          accent: 'text-blue-600',
          border: 'border-blue-200'
        };
      case 'female':
        return {
          primary: 'from-pink-500 to-pink-600',
          secondary: 'bg-pink-100',
          accent: 'text-pink-600',
          border: 'border-pink-200'
        };
      default:
        return {
          primary: 'from-purple-500 to-purple-600',
          secondary: 'bg-purple-100',
          accent: 'text-purple-600',
          border: 'border-purple-200'
        };
    }
  };

  const colors = getGenderColors();

  return (
    <motion.div
      className={`
        relative group
        ${selected ? 'z-50' : 'z-10'}
      `}
      style={{ width: 180, height: showDetails ? 'auto' : 220 }}
      onMouseEnter={() => {
        setIsHovered(true);
        setShowActions(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowActions(false);
      }}
      onClick={handleNodeClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      {/* Carte principale avec effet glassmorphism */}
      <motion.div
        className={`
          relative w-full h-full rounded-2xl
          bg-white/80 backdrop-blur-md
          border border-white/20 shadow-xl
          ${selected ? 'ring-2 ring-blue-500/50 shadow-2xl' : ''}
          ${isDeceased ? 'opacity-75 grayscale' : ''}
          overflow-hidden
        `}
        style={{
          background: `linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)`,
          boxShadow: isHovered 
            ? '0 20px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.2)' 
            : '0 10px 30px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.1)'
        }}
      >
        {/* En-tête avec gradient */}
        <div className={`h-16 bg-gradient-to-r ${colors.primary} relative overflow-hidden`}>
          {/* Motif de fond */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-white/20"></div>
            <div className="absolute top-4 right-4 w-4 h-4 rounded-full bg-white/20"></div>
            <div className="absolute bottom-2 left-4 w-6 h-6 rounded-full bg-white/20"></div>
          </div>
          
          {/* Icône de statut */}
          <div className="absolute top-2 right-2">
            {isDeceased ? (
              <Crown className="w-4 h-4 text-white/80" />
            ) : (
              <Sparkles className="w-4 h-4 text-white/80" />
            )}
          </div>
        </div>

        {/* Photo de profil */}
        <div className="relative -mt-8 mx-auto mb-4">
          <div className="relative">
            <label htmlFor={`file-upload-${id}`} className="cursor-pointer">
              <div className={`
                w-16 h-16 rounded-full flex items-center justify-center
                bg-gradient-to-br ${colors.primary}
                border-4 border-white shadow-lg
                ${isUploading ? 'opacity-50' : ''}
                transition-all duration-200
                ${isHovered ? 'scale-110' : 'scale-100'}
              `}>
                {data.photoUrl ? (
                  <img 
                    src={data.photoUrl} 
                    alt={`${data.firstName} ${data.lastName}`} 
                    className="w-full h-full object-cover rounded-full"
                    onError={handleImageError}
                  />
                ) : (
                  <User className="w-8 h-8 text-white" />
                )}
                
                {/* Overlay de modification */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-full transition-all duration-200 flex items-center justify-center">
                  {isUploading ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
                  ) : (
                    <Camera className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  )}
                </div>
              </div>
            </label>
          </div>
        </div>
        
        <input 
          id={`file-upload-${id}`} 
          type="file" 
          accept="image/*" 
          onChange={handleImageUpload} 
          className="hidden"
          disabled={isUploading}
        />
        
        {/* Informations principales */}
        <div className="px-4 pb-4 text-center">
          <h3 className={`font-bold text-lg ${isDeceased ? 'text-gray-600' : 'text-gray-800'} mb-1`}>
            {data.firstName} {data.lastName}
          </h3>
          
          {data.birthDate && (
            <div className="flex items-center justify-center gap-1 text-sm text-gray-500 mb-2">
              <Calendar className="w-3 h-3" />
              <span>{new Date(data.birthDate).getFullYear()}</span>
              {data.deathDate && (
                <>
                  <span>-</span>
                  <span>{new Date(data.deathDate).getFullYear()}</span>
                </>
              )}
            </div>
          )}
          
          {data.birthPlace && (
            <div className="flex items-center justify-center gap-1 text-xs text-gray-400 mb-2">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{data.birthPlace}</span>
            </div>
          )}
          
          {data.occupation && (
            <div className="text-xs text-gray-500 italic mb-2">
              {data.occupation}
            </div>
          )}
        </div>

        {/* Détails supplémentaires */}
        <AnimatePresence>
          {showDetails && (
            <motion.div 
              className="px-4 pb-4 space-y-2"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              {getAgeOrLifespan() && (
                <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  <span>{getAgeOrLifespan()}</span>
                </div>
              )}
              
              {data.biography && (
                <p className="text-xs text-gray-500 text-center line-clamp-2 italic">
                  {data.biography}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Points de connexion modernes */}
        {/* Parent (haut) */}
        <Handle 
          type="target" 
          position={Position.Top} 
          isConnectable={isConnectable} 
          className="!w-4 !h-4 !bg-gradient-to-r !from-blue-500 !to-blue-600 !border-2 !border-white !top-[-8px] hover:!scale-125 transition-transform shadow-lg"
          id="parent-target"
        />
        <Handle 
          type="source" 
          position={Position.Top} 
          isConnectable={isConnectable} 
          className="!w-4 !h-4 !bg-gradient-to-r !from-blue-500 !to-blue-600 !border-2 !border-white !top-[-8px] hover:!scale-125 transition-transform shadow-lg"
          id="parent-source"
        />
        
        {/* Enfant (bas) */}
        <Handle 
          type="target" 
          position={Position.Bottom} 
          isConnectable={isConnectable} 
          className="!w-4 !h-4 !bg-gradient-to-r !from-green-500 !to-green-600 !border-2 !border-white !bottom-[-8px] hover:!scale-125 transition-transform shadow-lg"
          id="child-target"
        />
        <Handle 
          type="source" 
          position={Position.Bottom} 
          isConnectable={isConnectable} 
          className="!w-4 !h-4 !bg-gradient-to-r !from-green-500 !to-green-600 !border-2 !border-white !bottom-[-8px] hover:!scale-125 transition-transform shadow-lg"
          id="child-source"
        />
        
        {/* Conjoint (gauche et droite) */}
        <Handle 
          type="target" 
          position={Position.Left} 
          isConnectable={isConnectable} 
          className="!w-5 !h-5 !bg-gradient-to-r !from-pink-500 !to-pink-600 !border-2 !border-white !left-[-10px] hover:!scale-125 transition-transform shadow-lg"
          id="spouse-left-target"
          style={{ zIndex: 10 }}
        />
        <Handle 
          type="source" 
          position={Position.Left} 
          isConnectable={isConnectable} 
          className="!w-5 !h-5 !bg-gradient-to-r !from-pink-500 !to-pink-600 !border-2 !border-white !left-[-10px] hover:!scale-125 transition-transform shadow-lg"
          id="spouse-left-source"
          style={{ zIndex: 10 }}
        />
        <Handle 
          type="target" 
          position={Position.Right} 
          isConnectable={isConnectable} 
          className="!w-5 !h-5 !bg-gradient-to-r !from-pink-500 !to-pink-600 !border-2 !border-white !right-[-10px] hover:!scale-125 transition-transform shadow-lg"
          id="spouse-right-target"
          style={{ zIndex: 10 }}
        />
        <Handle 
          type="source" 
          position={Position.Right} 
          isConnectable={isConnectable} 
          className="!w-5 !h-5 !bg-gradient-to-r !from-pink-500 !to-pink-600 !border-2 !border-white !right-[-10px] hover:!scale-125 transition-transform shadow-lg"
          id="spouse-right-source"
          style={{ zIndex: 10 }}
        />

        {/* Menu d'actions flottant moderne */}
        <AnimatePresence>
          {showActions && !isUploading && (
            <motion.div 
              className="absolute -bottom-16 left-1/2 transform -translate-x-1/2"
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex gap-1 bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-2 border border-white/20">
                <motion.button 
                  className="p-2 hover:bg-blue-50 rounded-xl transition-colors group" 
                  title="Ajouter parent"
                  onClick={(e) => handleActionClick(e, 'parent')}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Users className="w-4 h-4 text-blue-600" />
                </motion.button>
                
                <motion.button 
                  className="p-2 hover:bg-pink-50 rounded-xl transition-colors group" 
                  title="Ajouter conjoint"
                  onClick={(e) => handleActionClick(e, 'spouse')}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Heart className="w-4 h-4 text-pink-600" />
                </motion.button>
                
                <motion.button 
                  className="p-2 hover:bg-green-50 rounded-xl transition-colors group" 
                  title="Ajouter enfant"
                  onClick={(e) => handleActionClick(e, 'child')}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Baby className="w-4 h-4 text-green-600" />
                </motion.button>
                
                {canAddChildToMarriage() && (
                  <motion.button 
                    className="p-2 hover:bg-purple-50 rounded-xl transition-colors group" 
                    title="Enfant d'union"
                    onClick={(e) => handleActionClick(e, 'marriage_child')}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <PlusCircle className="w-4 h-4 text-purple-600" />
                  </motion.button>
                )}
                
                <motion.button 
                  className="p-2 hover:bg-gray-50 rounded-xl transition-colors group" 
                  title="Modifier"
                  onClick={(e) => handleActionClick(e, 'edit')}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Edit3 className="w-4 h-4 text-gray-600" />
                </motion.button>
                
                <motion.button 
                  className="p-2 hover:bg-red-50 rounded-xl transition-colors group" 
                  title="Supprimer"
                  onClick={(e) => handleActionClick(e, 'delete')}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default memo(PersonNode);
