import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
import { Sparkles, Loader2 } from 'lucide-react';

function App() {
  const { checkAuth, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Écran de chargement moderne
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            className="inline-flex items-center justify-center p-4 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-8 h-8 text-blue-600" />
              </motion.div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  GeneaTree
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Chargement...
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Layout>
        <AnimatePresence mode="wait">
          <Routes>
            {/* Routes publiques */}
            <Route 
              path="/" 
              element={
                isAuthenticated ? 
                <Navigate to="/dashboard" replace /> : 
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <HomePage />
                </motion.div>
              } 
            />
            
            <Route 
              path="/login" 
              element={
                !isAuthenticated ? 
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <LoginPage />
                </motion.div> : 
                <Navigate to="/dashboard" />
              } 
            />
            
            <Route 
              path="/register" 
              element={
                !isAuthenticated ? 
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <RegisterPage />
                </motion.div> : 
                <Navigate to="/dashboard" />
              } 
            />
            
            {/* Routes protégées */}
            <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
              <Route 
                path="/dashboard" 
                element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <DashboardPage />
                  </motion.div>
                } 
              />
              
              <Route 
                path="/profile" 
                element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ProfilePage />
                  </motion.div>
                } 
              />
              
              <Route 
                path="/family-tree/:id" 
                element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <FamilyTreePage />
                  </motion.div>
                } 
              />
            </Route>
            
            {/* Gestion des routes inexistantes */}
            <Route 
              path="*" 
              element={
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <NotFoundPage />
                </motion.div>
              } 
            />
          </Routes>
        </AnimatePresence>
      </Layout>
      
      {/* Composant de notifications toast */}
      <Toaster />
    </>
  );
}

export default App;