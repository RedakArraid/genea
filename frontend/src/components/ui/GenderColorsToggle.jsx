import React from 'react';
import { Palette } from 'lucide-react';
import { useGenderColors } from '../../hooks/useGenderColors';

const GenderColorsToggle = ({ className = '' }) => {
  const { isGenderColorsEnabled, toggleGenderColors } = useGenderColors();

  return (
    <button
      onClick={toggleGenderColors}
      className={`
        relative inline-flex items-center justify-center gap-2
        h-10 px-3 rounded-lg border border-border bg-background
        hover:bg-accent hover:text-accent-foreground
        focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
        transition-all duration-200
        ${isGenderColorsEnabled ? 'bg-primary/10 border-primary text-primary' : ''}
        ${className}
      `}
      aria-label={`${isGenderColorsEnabled ? 'Désactiver' : 'Activer'} les couleurs par genre`}
      title={`${isGenderColorsEnabled ? 'Désactiver' : 'Activer'} les couleurs par genre`}
    >
      <Palette className="h-4 w-4" />
      <span className="text-sm font-medium hidden sm:block">
        Couleurs
      </span>
      {isGenderColorsEnabled && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
      )}
    </button>
  );
};

export default GenderColorsToggle;