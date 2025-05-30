import React, { createContext, useState, useCallback, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

// Création du contexte d'authentification
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Vérifier l'authenticité du token et récupérer les infos utilisateur
  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const storedToken = localStorage.getItem('token');
      
      if (!storedToken) {
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        return;
      }
      
      // Vérifier si le token est expiré
      const decodedToken = jwtDecode(storedToken);
      const currentTime = Date.now() / 1000;
      
      if (decodedToken.exp < currentTime) {
        // Token expiré
        logout();
        setIsLoading(false);
        return;
      }
      
      // Configurer le token dans les headers
      api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      
      // Récupérer les informations utilisateur
      const response = await api.get('/auth/me');
      
      setUser(response.data.user);
      setToken(storedToken);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'authentification:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fonction de connexion
  const login = useCallback(async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setToken(token);
      setUser(user);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      console.error('Erreur de connexion:', error);
      
      let errorMessage = 'Une erreur est survenue lors de la connexion';
      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
      }
      
      return { success: false, message: errorMessage };
    }
  }, []);

  // Fonction d'inscription
  const register = useCallback(async (name, email, password) => {
    try {
      const response = await api.post('/auth/register', { name, email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setToken(token);
      setUser(user);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      
      let errorMessage = 'Une erreur est survenue lors de l\'inscription';
      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
      }
      
      return { success: false, message: errorMessage };
    }
  }, []);

  // Fonction de déconnexion
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  // Mettre à jour le profil utilisateur
  const updateProfile = useCallback(async (profileData) => {
    try {
      const response = await api.put('/users/profile', profileData);
      
      setUser(response.data.user);
      
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      
      let errorMessage = 'Une erreur est survenue lors de la mise à jour du profil';
      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
      }
      
      return { success: false, message: errorMessage };
    }
  }, []);

  // Configurer le token dans les headers à chaque changement de token
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Vérifier l'authentification au chargement initial
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Valeurs à exposer via le contexte
  const contextValue = {
    isAuthenticated,
    user,
    isLoading,
    login,
    register,
    logout,
    checkAuth,
    updateProfile
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};