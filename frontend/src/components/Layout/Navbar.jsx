import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

/**
 * Composant Navbar - Barre de navigation principale de l'application
 * Adapte son contenu selon que l'utilisateur est connecté ou non
 */
const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Gestion de la déconnexion
  const handleLogout = () => {
    logout();
    showToast('Vous avez été déconnecté', 'success');
    navigate('/');
  };

  return (
    <nav className="bg-primary text-primary-foreground shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Logo et nom du site */}
            <div className="flex-shrink-0 flex items-center">
              <Link 
                to={isAuthenticated ? "/dashboard" : "/"} 
                className="text-xl font-bold hover:opacity-80 transition-opacity"
              >
                GeneaIA
              </Link>
            </div>
            
            {/* Liens de navigation principal */}
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              {isAuthenticated ? (
                <Link 
                  to="/dashboard" 
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-foreground/10"
                >
                  Mes arbres
                </Link>
              ) : (
                <Link 
                  to="/" 
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-foreground/10"
                >
                  Accueil
                </Link>
              )}
              
              {isAuthenticated && (
                <Link 
                  to="/profile" 
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-foreground/10"
                >
                  Profil
                </Link>
              )}
            </div>
          </div>
          
          {/* Partie droite de la barre de navigation */}
          <div className="flex items-center">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                {/* Nom de l'utilisateur */}
                <span className="hidden md:block text-sm">
                  {user?.name || 'Utilisateur'}
                </span>
                
                {/* Lien vers le profil - déplacé dans la navigation principale */}
                {/* Bouton de déconnexion */}
                <button 
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-md text-sm font-medium bg-primary-foreground/20 hover:bg-primary-foreground/30"
                >
                  Déconnexion
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                {/* Liens d'authentification */}
                <Link 
                  to="/login" 
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-foreground/10"
                >
                  Connexion
                </Link>
                
                <Link 
                  to="/register" 
                  className="px-3 py-2 rounded-md text-sm font-medium bg-primary-foreground/20 hover:bg-primary-foreground/30"
                >
                  Inscription
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;