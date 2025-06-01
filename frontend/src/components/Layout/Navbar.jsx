import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import ThemeToggle from '../ui/ThemeToggle';

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
    <nav className="bg-primary text-primary-foreground shadow-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Logo et nom du site */}
            <div className="flex-shrink-0 flex items-center">
              <Link 
                to={isAuthenticated ? "/dashboard" : "/"} 
                className="text-xl font-bold hover:opacity-80 transition-opacity flex items-center gap-2"
              >
                <div className="w-8 h-8 bg-primary-foreground/20 rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold">G</span>
                </div>
                GeneaIA
              </Link>
            </div>
            
            {/* Navigation principale */}
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              {isAuthenticated ? (
                <>
                  <Link 
                    to="/dashboard" 
                    className="px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-foreground/10 transition-colors"
                  >
                    Mes arbres
                  </Link>
                  <Link 
                    to="/profile" 
                    className="px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-foreground/10 transition-colors"
                  >
                    Profil
                  </Link>
                </>
              ) : (
                <Link 
                  to="/" 
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-foreground/10 transition-colors"
                >
                  Accueil
                </Link>
              )}
            </div>
          </div>
          
          {/* Partie droite */}
          <div className="flex items-center gap-3">
            {/* Toggle thème - toujours visible */}
            <ThemeToggle />
            
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                {/* Nom de l'utilisateur - caché sur mobile */}
                <span className="hidden lg:block text-sm font-medium">
                  {user?.name || 'Utilisateur'}
                </span>
                
                {/* Bouton de déconnexion */}
                <button 
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-md text-sm font-medium bg-primary-foreground/20 hover:bg-primary-foreground/30 transition-colors"
                >
                  Déconnexion
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                {/* Liens d'authentification */}
                <Link 
                  to="/login" 
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-foreground/10 transition-colors"
                >
                  Connexion
                </Link>
                
                <Link 
                  to="/register" 
                  className="px-3 py-2 rounded-md text-sm font-medium bg-primary-foreground/20 hover:bg-primary-foreground/30 transition-colors"
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