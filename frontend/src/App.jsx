import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import FamilyTreePage from './pages/FamilyTreePage';

import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Toaster from './components/ui/Toaster';

function App() {
  const { checkAuth, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Si l'authentification est en cours de vérification, afficher un indicateur de chargement
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        {/* Routes publiques */}
        <Route element={<Layout />}>
          <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <HomePage />} />
          <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" />} />
          <Route path="/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/dashboard" />} />
          
          {/* Routes protégées */}
          <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/family-tree/:id" element={<FamilyTreePage />} />

          </Route>
          
          {/* Gestion des routes inexistantes */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
      
      {/* Composant de notifications toast */}
      <Toaster />
    </>
  );
}

export default App;