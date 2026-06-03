import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      loading: false,
      error: null,

      // Initialiser l'état avec les valeurs stockées dans le localStorage
      initialize: () => {
        const token = localStorage.getItem('token');
        if (token) {
          set({ token });
          get().getCurrentUser();
        }
      },

      // Connexion
      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const response = await axios.post(`${API_URL}/auth/login`, {
            email,
            password
          });
          
          const { token, user } = response.data;
          
          localStorage.setItem('token', token);
          
          set({
            token,
            user,
            loading: false
          });
          
          return true;
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Une erreur est survenue lors de la connexion',
            loading: false
          });
          return false;
        }
      },

      // Inscription
      register: async (name, email, password) => {
        set({ loading: true, error: null });
        try {
          const response = await axios.post(`${API_URL}/auth/register`, {
            name,
            email,
            password
          });
          
          const { token, user } = response.data;
          
          localStorage.setItem('token', token);
          
          set({
            token,
            user,
            loading: false
          });
          
          return true;
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Une erreur est survenue lors de l\'inscription',
            loading: false
          });
          return false;
        }
      },

      // Déconnexion
      logout: () => {
        localStorage.removeItem('token');
        set({ token: null, user: null });
      },

      // Récupérer l'utilisateur courant
      getCurrentUser: async () => {
        const { token } = get();
        if (!token) return;
        
        set({ loading: true });
        try {
          const response = await axios.get(`${API_URL}/users/me`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          set({
            user: response.data,
            loading: false
          });
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Erreur lors de la récupération du profil',
            loading: false
          });
          
          // Si le token est invalide/expiré, déconnexion
          if (error.response?.status === 401) {
            get().logout();
          }
        }
      },

      // Vérifier si l'utilisateur est authentifié
      isAuthenticated: () => {
        return !!get().token;
      },

      // Mettre à jour le profil
      updateProfile: async (userData) => {
        const { token } = get();
        if (!token) return false;
        
        set({ loading: true, error: null });
        try {
          const response = await axios.put(`${API_URL}/users/me`, userData, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          set({
            user: response.data,
            loading: false
          });
          
          return true;
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Erreur lors de la mise à jour du profil',
            loading: false
          });
          return false;
        }
      },

      // Réinitialiser le mot de passe
      resetPassword: async (email) => {
        set({ loading: true, error: null });
        try {
          await axios.post(`${API_URL}/auth/reset-password`, { email });
          set({ loading: false });
          return true;
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Erreur lors de la réinitialisation du mot de passe',
            loading: false
          });
          return false;
        }
      }
    }),
    {
      name: 'auth-storage',
      getStorage: () => localStorage,
    }
  )
);

export default useAuthStore;