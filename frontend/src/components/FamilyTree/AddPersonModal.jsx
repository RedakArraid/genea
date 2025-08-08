import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Calendar, 
  MapPin, 
  Briefcase, 
  FileText, 
  Camera, 
  X, 
  Plus,
  Heart,
  Users,
  Baby,
  Sparkles,
  Crown
} from 'lucide-react';

/**
 * Formulaire modal ultra moderne pour ajouter une nouvelle personne
 * Design glassmorphism avec animations fluides
 */
const AddPersonModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  parentNodeId, 
  relationType,
  marriageEdgeId,
  treeName
}) => {
  // État du formulaire
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    birthPlace: '',
    deathDate: '',
    gender: 'male',
    occupation: '',
    biography: '',
    photoUrl: ''
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [useTreeName, setUseTreeName] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Réinitialiser le formulaire à chaque ouverture
  useEffect(() => {
    if (isOpen) {
      setFormData({
        firstName: '',
        lastName: '',
        birthDate: '',
        birthPlace: '',
        deathDate: '',
        gender: 'male',
        occupation: '',
        biography: '',
        photoUrl: ''
      });
      setPhotoFile(null);
      setPhotoPreview(null);
      setUseTreeName(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Gestion des changements dans les champs du formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Gestion de la case à cocher pour utiliser le nom de l'arbre
  const handleUseTreeNameChange = (e) => {
    const checked = e.target.checked;
    setUseTreeName(checked);
    
    if (checked && treeName) {
      setFormData(prev => ({
        ...prev,
        lastName: treeName
      }));
    } else if (!checked) {
      setFormData(prev => ({
        ...prev,
        lastName: ''
      }));
    }
  };

  // Gestion de l'upload de photo
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner un fichier image valide.');
        return;
      }
      
      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('La taille de l\'image ne doit pas dépasser 5MB.');
        return;
      }
      
      setPhotoFile(file);
      
      // Créer une prévisualisation
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Supprimer la photo
  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      alert('Le prénom et le nom de famille sont obligatoires.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit({
        ...formData,
        photoFile,
        parentNodeId,
        relationType,
        marriageEdgeId
      });
      
      onClose();
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Obtenir le titre du modal selon le type de relation
  const getModalTitle = () => {
    switch (relationType) {
      case 'parent':
        return 'Ajouter un parent';
      case 'spouse':
        return 'Ajouter un conjoint';
      case 'child':
        return 'Ajouter un enfant';
      case 'sibling':
        return 'Ajouter un frère/sœur';
      case 'marriage_child':
        return 'Ajouter un enfant du couple';
      default:
        return 'Ajouter une personne';
    }
  };

  // Obtenir la description du modal
  const getModalDescription = () => {
    switch (relationType) {
      case 'parent':
        return 'Ajoutez un parent à cette personne dans l\'arbre généalogique.';
      case 'spouse':
        return 'Ajoutez un conjoint pour créer une union dans l\'arbre.';
      case 'child':
        return 'Ajoutez un enfant à cette personne.';
      case 'sibling':
        return 'Ajoutez un frère ou une sœur à cette personne.';
      case 'marriage_child':
        return 'Ajoutez un enfant issu de cette union.';
      default:
        return 'Ajoutez une nouvelle personne à l\'arbre généalogique.';
    }
  };

  // Obtenir l'icône selon le type de relation
  const getRelationIcon = () => {
    switch (relationType) {
      case 'parent':
        return <Users className="w-6 h-6 text-blue-600" />;
      case 'spouse':
        return <Heart className="w-6 h-6 text-pink-600" />;
      case 'child':
        return <Baby className="w-6 h-6 text-green-600" />;
      case 'sibling':
        return <Users className="w-6 h-6 text-purple-600" />;
      case 'marriage_child':
        return <Sparkles className="w-6 h-6 text-purple-600" />;
      default:
        return <User className="w-6 h-6 text-gray-600" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Overlay avec effet glassmorphism */}
          <motion.div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Modal principal */}
          <motion.div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
              {/* En-tête avec gradient */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 relative overflow-hidden">
                {/* Motif de fond */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-4 left-4 w-12 h-12 rounded-full bg-white/20"></div>
                  <div className="absolute top-8 right-8 w-8 h-8 rounded-full bg-white/20"></div>
                  <div className="absolute bottom-4 left-8 w-10 h-10 rounded-full bg-white/20"></div>
                </div>
                
                {/* Contenu de l'en-tête */}
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-2xl">
                      {getRelationIcon()}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">
                        {getModalTitle()}
                      </h2>
                      <p className="text-white/80 text-sm">
                        {getModalDescription()}
                      </p>
                    </div>
                  </div>
                  
                  <motion.button
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="w-6 h-6 text-white" />
                  </motion.button>
                </div>
              </div>

              {/* Contenu du formulaire */}
              <div className="p-6 space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Section photo */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <Camera className="w-5 h-5 text-blue-600" />
                      Photo de profil
                    </h3>
                    
                    <div className="flex items-center gap-4">
                      {/* Prévisualisation de la photo */}
                      <div className="relative">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                          {photoPreview ? (
                            <img 
                              src={photoPreview} 
                              alt="Aperçu" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-10 h-10 text-white" />
                          )}
                        </div>
                        
                        {photoPreview && (
                          <motion.button
                            type="button"
                            onClick={handleRemovePhoto}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <X className="w-3 h-3" />
                          </motion.button>
                        )}
                      </div>
                      
                      {/* Bouton d'upload */}
                      <div className="flex-1">
                        <label className="block">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoChange}
                            className="hidden"
                          />
                          <div className="cursor-pointer">
                            <motion.div
                              className="px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center gap-2"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Camera className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                {photoPreview ? 'Changer la photo' : 'Ajouter une photo'}
                              </span>
                            </motion.div>
                          </div>
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          Formats acceptés: JPG, PNG. Taille max: 5MB
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Section informations personnelles */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <User className="w-5 h-5 text-green-600" />
                      Informations personnelles
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Prénom */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Prénom *
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                          placeholder="Entrez le prénom"
                          required
                        />
                      </div>
                      
                      {/* Nom de famille */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Nom de famille *
                        </label>
                        <div className="space-y-2">
                          <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                            placeholder="Entrez le nom de famille"
                            required
                            disabled={useTreeName}
                          />
                          
                          {treeName && (
                            <label className="flex items-center gap-2 text-sm text-gray-600">
                              <input
                                type="checkbox"
                                checked={useTreeName}
                                onChange={handleUseTreeNameChange}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              Utiliser le nom de l'arbre ({treeName})
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Genre */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Genre
                      </label>
                      <div className="flex gap-4">
                        {[
                          { value: 'male', label: 'Homme', color: 'from-blue-500 to-blue-600' },
                          { value: 'female', label: 'Femme', color: 'from-pink-500 to-pink-600' },
                          { value: 'other', label: 'Autre', color: 'from-purple-500 to-purple-600' }
                        ].map((option) => (
                          <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="gender"
                              value={option.value}
                              checked={formData.gender === option.value}
                              onChange={handleChange}
                              className="sr-only"
                            />
                            <div className={`
                              px-4 py-2 rounded-xl border-2 transition-all duration-200
                              ${formData.gender === option.value 
                                ? `bg-gradient-to-r ${option.color} text-white border-transparent` 
                                : 'bg-white/50 border-gray-200 text-gray-700 hover:border-gray-300'
                              }
                            `}>
                              {option.label}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Section dates et lieux */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-orange-600" />
                      Dates et lieux
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Date de naissance */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Date de naissance
                        </label>
                        <input
                          type="date"
                          name="birthDate"
                          value={formData.birthDate}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                        />
                      </div>
                      
                      {/* Lieu de naissance */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Lieu de naissance
                        </label>
                        <input
                          type="text"
                          name="birthPlace"
                          value={formData.birthPlace}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                          placeholder="Ville, pays"
                        />
                      </div>
                    </div>
                    
                    {/* Date de décès */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Crown className="w-4 h-4 text-gray-500" />
                        Date de décès (optionnel)
                      </label>
                      <input
                        type="date"
                        name="deathDate"
                        value={formData.deathDate}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                      />
                    </div>
                  </div>

                  {/* Section profession et biographie */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-indigo-600" />
                      Profession et biographie
                    </h3>
                    
                    {/* Profession */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Profession
                      </label>
                      <input
                        type="text"
                        name="occupation"
                        value={formData.occupation}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                        placeholder="Profession ou métier"
                      />
                    </div>
                    
                    {/* Biographie */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Biographie
                      </label>
                      <textarea
                        name="biography"
                        value={formData.biography}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm resize-none"
                        placeholder="Quelques mots sur cette personne..."
                      />
                    </div>
                  </div>

                  {/* Boutons d'action */}
                  <div className="flex gap-4 pt-4">
                    <motion.button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Annuler
                    </motion.button>
                    
                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
                          Ajout en cours...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Ajouter la personne
                        </>
                      )}
                    </motion.button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddPersonModal;