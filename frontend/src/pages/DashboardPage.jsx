import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFamilyTreeStore } from '../store/familyTreeStore';
import { useToast } from '../hooks/useToast';

/**
 * Page de tableau de bord
 * Affiche les arbres généalogiques de l'utilisateur et permet d'en créer de nouveaux
 */
const DashboardPage = () => {
  // État local
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTreeData, setNewTreeData] = useState({
    name: '',
    description: '',
    isPublic: false
  });
  
  // Hooks
  const { 
    trees, 
    isLoading, 
    error, 
    fetchTrees, 
    createTree, 
    deleteTree 
  } = useFamilyTreeStore();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Charger les arbres au montage du composant
  useEffect(() => {
    fetchTrees();
  }, [fetchTrees]);

  // Gestion des changements dans le formulaire de création
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewTreeData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Créer un nouvel arbre
  const handleCreateTree = async (e) => {
    e.preventDefault();
    
    try {
      const { success, tree, message } = await createTree(newTreeData);
      
      if (success) {
        showToast('Arbre généalogique créé avec succès !', 'success');
        setIsCreateModalOpen(false);
        setNewTreeData({
          name: '',
          description: '',
          isPublic: false
        });
        
        // Rediriger vers le nouvel arbre
        navigate(`/family-tree/${tree.id}`);
      } else {
        showToast(message || 'Échec de la création de l\'arbre', 'error');
      }
    } catch (error) {
      console.error('Erreur lors de la création de l\'arbre:', error);
      showToast('Une erreur est survenue', 'error');
    }
  };

  // Supprimer un arbre
  const handleDeleteTree = async (treeId, treeName) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'arbre "${treeName}" ? Cette action est irréversible.`)) {
      try {
        const { success, message } = await deleteTree(treeId);
        
        if (success) {
          showToast('Arbre généalogique supprimé avec succès', 'success');
        } else {
          showToast(message || 'Échec de la suppression', 'error');
        }
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        showToast('Une erreur est survenue', 'error');
      }
    }
  };

  // Afficher un message d'erreur si nécessaire
  if (error) {
    return (
      <div className="min-h-screen bg-background px-4 py-16 sm:px-6 sm:py-24 md:grid md:place-items-center lg:px-8">
        <div className="max-w-max mx-auto">
          <main className="sm:flex">
            <p className="text-4xl font-bold text-primary sm:text-5xl">Erreur</p>
            <div className="sm:ml-6">
              <div className="sm:border-l sm:border-gray-200 sm:pl-6">
                <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                  Une erreur est survenue
                </h1>
                <p className="mt-1 text-base text-muted-foreground">
                  {error}
                </p>
              </div>
              <div className="mt-10 flex space-x-3 sm:border-l sm:border-transparent sm:pl-6">
                <button
                  onClick={() => fetchTrees()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Réessayer
                </button>
                <Link
                  to="/"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-foreground bg-secondary hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
                >
                  Retour à l'accueil
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mes arbres généalogiques</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Gérez vos arbres généalogiques et créez-en de nouveaux.
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Créer un arbre
            </button>
          </div>
        </div>

        {/* Liste des arbres */}
        <div className="mt-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Chargement de vos arbres généalogiques...</p>
            </div>
          ) : trees.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-lg shadow-sm">
              <svg
                className="mx-auto h-12 w-12 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-foreground">Aucun arbre généalogique</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Créez votre premier arbre généalogique pour commencer.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Créer un arbre généalogique
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {trees.map((tree) => (
                <div
                  key={tree.id}
                  className="bg-card overflow-hidden rounded-lg shadow transition hover:shadow-md"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-foreground">
                        {tree.name}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        tree.isPublic ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {tree.isPublic ? 'Public' : 'Privé'}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {tree.description || 'Aucune description'}
                    </p>
                    <div className="mt-4 text-xs text-muted-foreground">
                      Créé le {new Date(tree.createdAt).toLocaleDateString()}
                    </div>
                    <div className="mt-4 flex flex-col space-y-2">
                      <Link
                        to={`/family-tree/${tree.id}`}
                        className="w-full inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                      >
                        Ouvrir l'arbre
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDeleteTree(tree.id, tree.name)}
                        className="w-full inline-flex justify-center items-center px-3 py-2 border border-red-300 text-sm leading-4 font-medium rounded-md shadow-sm text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de création d'arbre */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-card rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">
                Créer un nouvel arbre généalogique
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateTree} className="p-6">
              <div className="space-y-4">
                {/* Nom de l'arbre */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground">
                    Nom de l'arbre*
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={newTreeData.name}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-input shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    placeholder="Ma famille"
                  />
                </div>
                
                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-foreground">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows="3"
                    value={newTreeData.description}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-input shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    placeholder="Une description de votre arbre généalogique"
                  />
                </div>
                
                {/* Option public/privé */}
                <div className="flex items-center">
                  <input
                    id="isPublic"
                    name="isPublic"
                    type="checkbox"
                    checked={newTreeData.isPublic}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                  />
                  <label htmlFor="isPublic" className="ml-2 block text-sm text-foreground">
                    Rendre cet arbre public
                  </label>
                </div>
              </div>
              
              {/* Boutons d'action */}
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-input rounded-md shadow-sm text-sm font-medium text-foreground bg-card hover:bg-background focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;