import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

/**
 * Composant qui protège les routes qui nécessitent une authentification
 * Redirige vers la page de connexion si l'utilisateur n'est pas authentifié
 * 
 * @param {boolean} isAuthenticated - État d'authentification de l'utilisateur
 * @param {string} redirectPath - Chemin de redirection en cas d'absence d'authentification
 * @returns {JSX.Element} Composant React
 */
const ProtectedRoute = ({ 
  isAuthenticated, 
  redirectPath = '/login' 
}) => {
  if (!isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  // Si l'utilisateur est authentifié, afficher les routes enfants
  return <Outlet />;
};

export default ProtectedRoute;