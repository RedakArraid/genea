import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

/**
 * Page de profil utilisateur
 * Permet à l'utilisateur de voir et modifier ses informations de profil
 */
const ProfilePage = () => {
  // État du formulaire
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  
  // Hooks
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();

  // Initialiser le formulaire avec les données de l'utilisateur
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  // Gestion des changements dans les champs du formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Effacer l'erreur lors de la modification du champ
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Basculer le mode d'édition
  const toggleEditMode = () => {
    setIsEditing(!isEditing);
    
    // Réinitialiser les champs de mot de passe et les erreurs
    if (!isEditing) {
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      setErrors({});
    }
  };

  // Validation du formulaire
  const validateForm = () => {
    const newErrors = {};
    
    // Validation du nom
    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    }
    
    // Validation de l'email
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'L\'email n\'est pas valide';
    }
    
    // Validation des mots de passe uniquement s'ils sont fournis
    if (formData.newPassword) {
      if (formData.newPassword.length < 6) {
        newErrors.newPassword = 'Le mot de passe doit contenir au moins 6 caractères';
      }
      
      if (!formData.currentPassword) {
        newErrors.currentPassword = 'Veuillez entrer votre mot de passe actuel';
      }
      
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation du formulaire
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    // Préparer les données à envoyer
    const updateData = {
      name: formData.name,
      email: formData.email
    };
    
    // Ajouter les mots de passe si fournis
    if (formData.newPassword) {
      updateData.currentPassword = formData.currentPassword;
      updateData.newPassword = formData.newPassword;
    }
    
    try {
      const { success, message } = await updateProfile(updateData);
      
      if (success) {
        showToast('Profil mis à jour avec succès', 'success');
        setIsEditing(false);
        
        // Réinitialiser les champs de mot de passe
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      } else {
        showToast(message || 'Échec de la mise à jour du profil', 'error');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      showToast('Une erreur est survenue', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-card shadow sm:rounded-lg overflow-hidden">
          <div className="px-4 py-5 border-b border-border sm:px-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-foreground">
                Profil utilisateur
              </h3>
              <button
                type="button"
                onClick={toggleEditMode}
                className="inline-flex items-center px-3 py-1.5 border border-input rounded-md text-sm font-medium text-foreground bg-card hover:bg-background"
              >
                {isEditing ? 'Annuler' : 'Modifier'}
              </button>
            </div>
          </div>
          
          <div className="px-4 py-5 sm:p-6">
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Nom */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground">
                    Nom
                  </label>
                  <div className="mt-1">
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      className={`block w-full rounded-md border-input shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${
                        errors.name ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                    )}
                  </div>
                </div>
                
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground">
                    Adresse email
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`block w-full rounded-md border-input shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${
                        errors.email ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                    )}
                  </div>
                </div>
                
                {/* Section changement de mot de passe */}
                <div className="border-t border-border pt-4">
                  <h4 className="text-base font-medium text-foreground mb-3">
                    Changer de mot de passe
                  </h4>
                  
                  {/* Mot de passe actuel */}
                  <div className="mb-4">
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-foreground">
                      Mot de passe actuel
                    </label>
                    <div className="mt-1">
                      <input
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        className={`block w-full rounded-md border-input shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${
                          errors.currentPassword ? 'border-red-500' : ''
                        }`}
                      />
                      {errors.currentPassword && (
                        <p className="mt-1 text-sm text-red-500">{errors.currentPassword}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Nouveau mot de passe */}
                  <div className="mb-4">
                    <label htmlFor="newPassword" className="block text-sm font-medium text-foreground">
                      Nouveau mot de passe
                    </label>
                    <div className="mt-1">
                      <input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        value={formData.newPassword}
                        onChange={handleChange}
                        className={`block w-full rounded-md border-input shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${
                          errors.newPassword ? 'border-red-500' : ''
                        }`}
                      />
                      {errors.newPassword && (
                        <p className="mt-1 text-sm text-red-500">{errors.newPassword}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Confirmation du nouveau mot de passe */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
                      Confirmer le nouveau mot de passe
                    </label>
                    <div className="mt-1">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`block w-full rounded-md border-input shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${
                          errors.confirmPassword ? 'border-red-500' : ''
                        }`}
                      />
                      {errors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Boutons d'action */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={toggleEditMode}
                    className="mr-3 px-4 py-2 border border-input rounded-md shadow-sm text-sm font-medium text-foreground bg-card hover:bg-background focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                  >
                    {isLoading ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <dl className="sm:divide-y sm:divide-border">
                  {/* Nom */}
                  <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-muted-foreground">
                      Nom
                    </dt>
                    <dd className="mt-1 text-sm text-foreground sm:mt-0 sm:col-span-2">
                      {user?.name || '—'}
                    </dd>
                  </div>
                  
                  {/* Email */}
                  <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-muted-foreground">
                      Adresse email
                    </dt>
                    <dd className="mt-1 text-sm text-foreground sm:mt-0 sm:col-span-2">
                      {user?.email || '—'}
                    </dd>
                  </div>
                  
                  {/* Date d'inscription */}
                  <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-muted-foreground">
                      Inscrit depuis
                    </dt>
                    <dd className="mt-1 text-sm text-foreground sm:mt-0 sm:col-span-2">
                      {user?.createdAt 
                        ? new Date(user.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })
                        : '—'
                      }
                    </dd>
                  </div>
                </dl>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;