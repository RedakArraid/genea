import React, { useState, useCallback, memo } from 'react';
import { Handle, Position } from 'reactflow';
import { User, Edit3, PlusCircle, Trash2, Users, UserPlus, Link as LinkIcon, Calendar, MapPin, Baby, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFamilyTreeStore } from '../../store/familyTreeStore';
import { useGenderColors } from '../../hooks/useGenderColors';
import { compressImage, ensureBase64Size } from '../../utils/imageCompression';

/**
 * Composant PersonNode - Représente une personne dans l'arbre généalogique
 * Version améliorée avec lignes droites et points de connexion colorés
 */
const PersonNode = ({ data, isConnectable, selected, id, onAddPerson, onEditPerson, onDeletePerson }) => {
  const { updatePerson, nodes, edges } = useFamilyTreeStore();
  const { getPersonCardStyles } = useGenderColors();
  const [showActions, setShowActions] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
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
      console.log('Début du processus d\'upload, taille du fichier:', Math.round(file.size / 1024), 'KB, type:', file.type);
      
      // Première compression avec qualité faible
      const compressedImage = await compressImage(file, 200, 200, 0.3);
      console.log('Image compressée, taille estimée:', Math.round((compressedImage.length * 0.75) / 1024), 'KB');
      
      // Compression encore plus forte si nécessaire
      const optimizedImage = await ensureBase64Size(compressedImage, 500000);
      
      if (!optimizedImage) {
        console.error('Impossible de compresser suffisamment l\'image');
        alert("L'image est trop volumineuse. Veuillez choisir une image plus petite.");
        setIsUploading(false);
        return;
      }
      
      console.log('Image finalement optimisée, taille:', Math.round((optimizedImage.length * 0.75) / 1024), 'KB');
      
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
      
      console.log('Envoi des données de mise à jour pour la personne:', id, 
                'Champs inclus:', Object.keys(personData), 
                'Taille des données:', Math.round(JSON.stringify(personData).length / 1024), 'KB');
      
      // Mettre à jour la personne avec l'image optimisée
      const result = await updatePerson(id, personData);
      console.log('Résultat de la mise à jour:', result);
      
      if (!result.success) {
        throw new Error(result.message || "Erreur lors de la mise à jour");
      }
      
      console.log('Mise à jour réussie');
      
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

  // Gérer le clic sur les handles
  const handleHandleClick = useCallback((event, actionType) => {
    event.preventDefault();
    event.stopPropagation();
    handleActionClick(event, actionType);
  }, [handleActionClick]);

  return (
    <motion.div
      className={`
        person-node relative border-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200
        ${selected ? 'border-blue-500 ring-2 ring-blue-200 dark:border-blue-400 dark:ring-blue-300' : 'border-gray-200 dark:border-slate-500'}
        ${cardStyles.card}
        dark:shadow-slate-900/50
      `}
      style={{ width: 140, height: showDetails ? 'auto' : 160 }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={handleNodeClick}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      {/* Photo ou avatar */}
      <div className="flex justify-center pt-3">
        <label htmlFor={`file-upload-${id}`} className={`cursor-pointer ${isUploading ? 'opacity-50' : ''}`}>
          <div className={`
            w-16 h-16 rounded-full flex items-center justify-center overflow-hidden group relative
            ${cardStyles.avatar}
          `}>
            {data.photoUrl ? (
              <img 
                src={data.photoUrl} 
                alt={`${data.firstName} ${data.lastName}`} 
                className="w-full h-full object-cover"
                onError={handleImageError}
              />
            ) : (
              <User className="w-8 h-8 text-gray-600 dark:text-slate-300" />
            )}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {isUploading ? (
                <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
              ) : (
                <Edit3 className="w-4 h-4 text-white" />
              )}
            </div>
          </div>
        </label>
      </div>
      
      <input 
        id={`file-upload-${id}`} 
        type="file" 
        accept="image/*" 
        onChange={handleImageUpload} 
        className="hidden"
        disabled={isUploading}
      />
      
      {/* Informations de base */}
      <div className="px-3 py-2 text-center">
        <div className={`person-name font-semibold text-sm line-clamp-2 leading-tight ${
          isDeceased ? 'text-gray-600 dark:text-gray-400' : 'text-gray-800 dark:text-slate-100'
        }`} title={`${data.firstName} ${data.lastName}`}>
          {data.firstName} {data.lastName}
        </div>
        {data.birthDate && (
          <div className="person-details text-xs text-gray-500 dark:text-slate-300 mt-1">
            {new Date(data.birthDate).getFullYear()}
            {data.deathDate && ` - ${new Date(data.deathDate).getFullYear()}`}
          </div>
        )}
      </div>
      
      {/* Détails supplémentaires */}
      <AnimatePresence>
        {showDetails && (
          <motion.div 
            className="px-3 pb-2 space-y-1"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {getAgeOrLifespan() && (
              <div className="flex items-center justify-center gap-1">
                <Calendar className="w-3 h-3 text-gray-400 dark:text-slate-400 flex-shrink-0" />
                <span className="person-details text-xs text-gray-600 dark:text-slate-200">{getAgeOrLifespan()}</span>
              </div>
            )}
            
            {data.birthPlace && (
              <div className="flex items-center justify-center gap-1">
                <MapPin className="w-3 h-3 text-gray-400 dark:text-slate-400 flex-shrink-0" />
                <span className="person-details text-xs text-gray-600 dark:text-slate-200 truncate" title={data.birthPlace}>{data.birthPlace}</span>
              </div>
            )}
            
            {data.occupation && (
              <div className="person-details text-xs text-gray-600 dark:text-slate-200 text-center italic" title={data.occupation}>
                {data.occupation}
              </div>
            )}
            
            {data.biography && (
              <p className="person-details text-xs text-gray-600 dark:text-slate-200 text-center line-clamp-2 italic" title={data.biography}>
                {data.biography}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Boutons d'action visibles pour ajouter des relations */}
      {/* Bouton Parent (haut) - Bleu */}
      <button
        className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full flex items-center justify-center cursor-pointer transition-colors z-20 hover:bg-blue-600"
        onClick={(e) => {
          e.stopPropagation();
          handleActionClick(e, 'parent');
        }}
        title="Ajouter un parent"
      >
        <Plus className="w-2 h-2 text-white" strokeWidth={3} />
      </button>
      
      {/* Enfant (bas) - Vert */}
      <button
        className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-green-500 border-2 border-white rounded-full flex items-center justify-center cursor-pointer transition-colors z-20 hover:bg-green-600"
        onClick={(e) => {
          e.stopPropagation();
          handleActionClick(e, 'child');
        }}
        title="Ajouter un enfant"
      >
        <Plus className="w-2 h-2 text-white" strokeWidth={3} />
      </button>
      
      {/* Conjoint (gauche) - Rose */}
      <button
        className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-pink-500 border-2 border-white rounded-full flex items-center justify-center cursor-pointer transition-colors z-20 hover:bg-pink-600"
        onClick={(e) => {
          e.stopPropagation();
          handleActionClick(e, 'spouse');
        }}
        title="Ajouter un conjoint"
      >
        <Plus className="w-2 h-2 text-white" strokeWidth={3} />
      </button>
      
      {/* Conjoint (droite) - Rose */}
      <button
        className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-pink-500 border-2 border-white rounded-full flex items-center justify-center cursor-pointer transition-colors z-20 hover:bg-pink-600"
        onClick={(e) => {
          e.stopPropagation();
          handleActionClick(e, 'spouse');
        }}
        title="Ajouter un conjoint"
      >
        <Plus className="w-2 h-2 text-white" strokeWidth={3} />
      </button>
      
      {/* Handles ReactFlow transparents pour les connexions automatiques */}
      <Handle 
        type="target" 
        position={Position.Top} 
        isConnectable={isConnectable} 
        className="!w-4 !h-4 !bg-transparent !border-0 !opacity-0 !absolute"
        id="parent-target"
        style={{ 
          zIndex: 1,
          top: '-8px',
          left: 'calc(50% - 8px)'
        }}
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        isConnectable={isConnectable} 
        className="!w-4 !h-4 !bg-transparent !border-0 !opacity-0 !absolute"
        id="child-source"
        style={{ 
          zIndex: 1,
          bottom: '-8px',
          left: 'calc(50% - 8px)'
        }}
      />
      <Handle 
        type="source" 
        position={Position.Left} 
        isConnectable={isConnectable} 
        className="!w-4 !h-4 !bg-transparent !border-0 !opacity-0 !absolute"
        id="spouse-left-source"
        style={{ 
          zIndex: 1,
          left: '-8px',
          top: 'calc(50% - 8px)'
        }}
      />
      <Handle 
        type="target" 
        position={Position.Left} 
        isConnectable={isConnectable} 
        className="!w-4 !h-4 !bg-transparent !border-0 !opacity-0 !absolute"
        id="spouse-left-target"
        style={{ 
          zIndex: 1,
          left: '-8px',
          top: 'calc(50% - 8px)'
        }}
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        isConnectable={isConnectable} 
        className="!w-4 !h-4 !bg-transparent !border-0 !opacity-0 !absolute"
        id="spouse-right-source"
        style={{ 
          zIndex: 1,
          right: '-8px',
          top: 'calc(50% - 8px)'
        }}
      />
      <Handle 
        type="target" 
        position={Position.Right} 
        isConnectable={isConnectable} 
        className="!w-4 !h-4 !bg-transparent !border-0 !opacity-0 !absolute"
        id="spouse-right-target"
        style={{ 
          zIndex: 1,
          right: '-8px',
          top: 'calc(50% - 8px)'
        }}
      />

      {/* Menu d'actions simplifié au survol */}
      <AnimatePresence>
        {showActions && !isUploading && (
          <motion.div 
            className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 flex gap-1 bg-white dark:bg-slate-700 rounded-lg shadow-lg p-1 z-20 border border-gray-200 dark:border-slate-600"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            <button 
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-600 rounded transition-colors" 
              title="Modifier"
              onClick={(e) => handleActionClick(e, 'edit')}
            >
              <Edit3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </button>
            <button 
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-600 rounded transition-colors" 
              title="Supprimer"
              onClick={(e) => handleActionClick(e, 'delete')}
            >
              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default memo(PersonNode);
