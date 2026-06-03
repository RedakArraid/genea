import { useState, useEffect } from 'react';

export const useTheme = () => {
  const [theme, setTheme] = useState(() => {
    // Récupérer le thème sauvegardé ou utiliser clair par défaut
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
      return savedTheme;
    }
    
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Retirer les classes précédentes
    root.classList.remove('light', 'dark');
    
    // Ajouter la nouvelle classe
    root.classList.add(theme);
    
    // Sauvegarder dans localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return { 
    theme, 
    toggleTheme,
    isDark: theme === 'dark'
  };
};