import axios from 'axios';

// Création d'une instance axios avec une configuration par défaut
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Ajouter un intercepteur pour les requêtes
api.interceptors.request.use(
  (config) => {
    // Récupérer le token depuis le localStorage
    const token = localStorage.getItem('token');
    
    // Si le token existe, l'ajouter aux headers de la requête
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Ajouter un intercepteur pour les réponses
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Gestion des erreurs 401 (non authentifié)
    if (error.response && error.response.status === 401) {
      // Si le token est expiré ou invalide, on déconnecte l'utilisateur
      localStorage.removeItem('token');
      
      // Rediriger vers la page de connexion (à ajuster selon votre logique de routing)
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;