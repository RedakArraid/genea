import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * Formulaire modal pour ajouter une nouvelle personne à l'arbre généalogique
 * avec support des relations
 */
const AddPersonModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  parentNodeId: initialParentNodeId, 
  parentNode2Id: initialParent2NodeId,
  relationType: initialRelationType,
  marriageEdgeId,
  treeName,
  people = []
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

  // Pour lier à une relation
  const [hasRelation, setHasRelation] = useState(false);
  const [relType, setRelType] = useState('child'); // child, parent, spouse
  const [relToId, setRelToId] = useState('');
  const [relTo2Id, setRelTo2Id] = useState('');

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

      if (initialRelationType && initialParentNodeId) {
        setHasRelation(true);
        setRelType(initialRelationType);
        setRelToId(initialParentNodeId);
        setRelTo2Id(initialParent2NodeId || '');
      } else {
        setHasRelation(false);
        setRelType('child');
        setRelToId(people[0]?.id || '');
        setRelTo2Id('');
      }
    }
  }, [isOpen, initialParentNodeId, initialParent2NodeId, initialRelationType, people]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

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

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner un fichier image valide.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('La taille de l\'image ne doit pas dépasser 5MB.');
        return;
      }
      
      setPhotoFile(file);
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

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setFormData(prev => ({
      ...prev,
      photoUrl: ''
    }));
    const fileInput = document.getElementById('photoUpload');
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (initialRelationType && initialParentNodeId) {
      onSubmit(formData, initialParentNodeId, initialRelationType, initialParent2NodeId || null);
    } else if (hasRelation && relToId) {
      onSubmit(formData, relToId, relType, relTo2Id || null);
    } else {
      onSubmit(formData, null, null, null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <motion.div
        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Ajouter une personne
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Renseignez les informations de base.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500 ml-4">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Prénom*</label>
              <input
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nom de famille*</label>
              <input
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                required
                disabled={useTreeName}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
          </div>
          
          {treeName && (
            <label className="flex items-center text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={useTreeName}
                onChange={handleUseTreeNameChange}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary mr-2"
              />
              Utiliser le nom de l'arbre ({treeName})
            </label>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Genre</label>
              <select
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

            <div>
              <label className="block text-sm font-medium text-gray-700">Lieu de naissance</label>
              <input
                name="birthPlace"
                type="text"
                value={formData.birthPlace}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Date de naissance</label>
              <input
                name="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date de décès</label>
              <input
                name="deathDate"
                type="date"
                value={formData.deathDate}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
          </div>

          {/* Upload Photo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Photo de profil</label>
            {photoPreview ? (
              <div className="flex items-center space-x-4">
                <img src={photoPreview} alt="Preview" className="w-16 h-16 rounded-full object-cover border" />
                <button type="button" onClick={handleRemovePhoto} className="text-sm text-red-600 hover:underline">Supprimer</button>
              </div>
            ) : (
              <div className="border border-dashed border-gray-300 rounded-md p-3 text-center">
                <label className="cursor-pointer text-sm text-primary hover:underline">
                  Choisir un fichier
                  <input id="photoUpload" type="file" accept="image/*" onChange={handlePhotoChange} className="sr-only" />
                </label>
              </div>
            )}
          </div>

          {/* Relation Field */}
          {!initialRelationType && people.length > 0 && (
            <div className="border-t border-gray-200 pt-3">
              <label className="flex items-center text-sm font-medium text-gray-700 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={hasRelation}
                  onChange={e => setHasRelation(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary mr-2"
                />
                Relier à une personne existante
              </label>

              {hasRelation && (
                <div className="space-y-3 mt-2 bg-gray-50 p-3 rounded-md">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase">Relation</label>
                    <div className="segmented mt-1" style={{ width: '100%' }}>
                      <button type="button" className={relType === 'child' ? 'on' : ''} onClick={() => setRelType('child')}>Enfant de</button>
                      <button type="button" className={relType === 'parent' ? 'on' : ''} onClick={() => setRelType('parent')}>Parent de</button>
                      <button type="button" className={relType === 'spouse' ? 'on' : ''} onClick={() => setRelType('spouse')}>Conjoint·e de</button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase">Personne cible</label>
                    <select
                      value={relToId}
                      onChange={e => setRelToId(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    >
                      <option value="">Sélectionnez...</option>
                      {people.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.given} {p.sur !== '—' ? p.sur : ''} ({p.born || '?'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {relType === 'child' && relToId && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase">Second parent (Optionnel)</label>
                      <select
                        value={relTo2Id}
                        onChange={e => setRelTo2Id(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      >
                        <option value="">Sélectionnez un second parent...</option>
                        {people.find(p => p.id === relToId)?.spouseIds?.length > 0 && (
                          <optgroup label="Conjoint·es recommandés">
                            {people.filter(p => (people.find(x => x.id === relToId)?.spouseIds || []).includes(p.id)).map(p => (
                              <option key={p.id} value={p.id}>
                                {p.given} {p.sur !== '—' ? p.sur : ''} ({p.born || '?'})
                              </option>
                            ))}
                          </optgroup>
                        )}
                        <optgroup label="Autres membres">
                          {people.filter(p => p.id !== relToId && !(people.find(x => x.id === relToId)?.spouseIds || []).includes(p.id)).map(p => (
                            <option key={p.id} value={p.id}>
                              {p.given} {p.sur !== '—' ? p.sur : ''} ({p.born || '?'})
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="mt-6 flex justify-end space-x-3 pt-3 border-t">
            <button type="button" onClick={onClose} className="btn">Annuler</button>
            <button type="submit" className="btn primary">Créer</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AddPersonModal;