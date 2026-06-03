import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * Formulaire modal pour modifier une personne existante dans l'arbre généalogique
 */
const EditPersonModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  nodeData,
  nodeId
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

  // Initialiser le formulaire avec les données existantes
  useEffect(() => {
    if (isOpen && nodeData) {
      const photoUrl = nodeData.photoUrl || '';
      setFormData({
        firstName: nodeData.firstName || '',
        lastName: nodeData.lastName || '',
        birthDate: nodeData.birthDate ? new Date(nodeData.birthDate).toISOString().split('T')[0] : '',
        birthPlace: nodeData.birthPlace || '',
        deathDate: nodeData.deathDate ? new Date(nodeData.deathDate).toISOString().split('T')[0] : '',
        gender: nodeData.gender || 'male',
        occupation: nodeData.occupation || '',
        biography: nodeData.biography || '',
        photoUrl: photoUrl
      });
      
      // Si une photo existe déjà, l'afficher en prévisualisation
      if (photoUrl) {
        setPhotoPreview(photoUrl);
      } else {
        setPhotoPreview(null);
      }
      setPhotoFile(null);
    }
  }, [isOpen, nodeData]);

  // Gestion des changements dans les champs du formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
        setFormData(prev => ({
          ...prev,
          photoUrl: event.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Supprimer la photo
  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setFormData(prev => ({
      ...prev,
      photoUrl: ''
    }));
    // Réinitialiser l'input file
    const fileInput = document.getElementById('photoUploadEdit');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Soumission du formulaire
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(nodeId, formData);
  };

  // Animation pour le modal
  const modalVariants = {
    hidden: { 
      opacity: 0,
      scale: 0.8 
    },
    visible: { 
      opacity: 1,
      scale: 1,
      transition: { 
        duration: 0.2 
      }
    },
    exit: { 
      opacity: 0,
      scale: 0.8,
      transition: { 
        duration: 0.2 
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <motion.div
        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={modalVariants}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête du modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Modifier les informations
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>
        
        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Informations de base */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  Prénom*
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Nom de famille*
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
            </div>
            
            {/* Genre */}
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                Genre
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              >
                <option value="male">Homme</option>
                <option value="female">Femme</option>
                <option value="other">Autre</option>
              </select>
            </div>
            
            {/* Photo de profil */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photo de profil
              </label>
              
              {photoPreview ? (
                <div className="flex items-center space-x-4">
                  {/* Prévisualisation */}
                  <div className="flex-shrink-0">
                    <img
                      src={photoPreview}
                      alt="Photo de profil"
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                    />
                  </div>
                  
                  {/* Boutons d'action */}
                  <div className="flex flex-col space-y-2">
                    <label
                      htmlFor="photoUploadEdit"
                      className="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Changer
                      <input
                        id="photoUploadEdit"
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="sr-only"
                      />
                    </label>
                    
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Supprimer
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div className="mt-2">
                    <label
                      htmlFor="photoUploadEdit"
                      className="cursor-pointer text-sm font-medium text-primary hover:text-primary/80"
                    >
                      Cliquez pour sélectionner une photo
                    </label>
                    <input
                      id="photoUploadEdit"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="sr-only"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, GIF jusqu'à 5MB
                  </p>
                </div>
              )}
            </div>
            
            {/* Dates de naissance et de décès */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700">
                  Date de naissance
                </label>
                <input
                  id="birthDate"
                  name="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="deathDate" className="block text-sm font-medium text-gray-700">
                  Date de décès
                </label>
                <input
                  id="deathDate"
                  name="deathDate"
                  type="date"
                  value={formData.deathDate}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
            </div>
            
            {/* Lieu de naissance */}
            <div>
              <label htmlFor="birthPlace" className="block text-sm font-medium text-gray-700">
                Lieu de naissance
              </label>
              <input
                id="birthPlace"
                name="birthPlace"
                type="text"
                value={formData.birthPlace}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
            
            {/* Profession */}
            <div>
              <label htmlFor="occupation" className="block text-sm font-medium text-gray-700">
                Profession
              </label>
              <input
                id="occupation"
                name="occupation"
                type="text"
                value={formData.occupation}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
            
            {/* Biographie */}
            <div>
              <label htmlFor="biography" className="block text-sm font-medium text-gray-700">
                Biographie
              </label>
              <textarea
                id="biography"
                name="biography"
                rows="3"
                value={formData.biography}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
          </div>
          
          {/* Boutons d'action */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default EditPersonModal;