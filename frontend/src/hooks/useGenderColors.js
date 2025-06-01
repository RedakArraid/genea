import { useState, useEffect } from 'react';

export const useGenderColors = () => {
  const [isGenderColorsEnabled, setIsGenderColorsEnabled] = useState(() => {
    const saved = localStorage.getItem('genderColorsEnabled');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('genderColorsEnabled', JSON.stringify(isGenderColorsEnabled));
  }, [isGenderColorsEnabled]);

  const toggleGenderColors = () => {
    setIsGenderColorsEnabled(prev => !prev);
  };

  const getPersonCardStyles = (gender, isDeceased = false) => {
    if (!isGenderColorsEnabled) {
      // Style par défaut sans couleurs de genre
      return {
        card: isDeceased 
          ? 'bg-gray-200 dark:bg-gray-600' 
          : 'bg-white dark:bg-slate-600',
        avatar: isDeceased 
          ? 'bg-gray-300 border-2 border-gray-400 dark:bg-gray-500 dark:border-gray-400' 
          : 'bg-gray-100 border-2 border-gray-200 dark:bg-slate-500 dark:border-slate-400'
      };
    }

    // Couleurs avec distinction de genre
    if (isDeceased) {
      return {
        card: 'bg-gray-200 dark:bg-gray-600',
        avatar: 'bg-gray-300 border-2 border-gray-400 dark:bg-gray-500 dark:border-gray-400'
      };
    }

    if (gender === 'male') {
      return {
        card: 'bg-blue-50 dark:bg-slate-600',
        avatar: 'bg-blue-100 border-2 border-blue-200 dark:bg-slate-500 dark:border-slate-400'
      };
    } else {
      // Femme ou non spécifié = rose clair
      return {
        card: 'bg-pink-50 dark:bg-slate-600', 
        avatar: 'bg-pink-100 border-2 border-pink-200 dark:bg-slate-500 dark:border-slate-400'
      };
    }
  };

  return {
    isGenderColorsEnabled,
    toggleGenderColors,
    getPersonCardStyles
  };
};