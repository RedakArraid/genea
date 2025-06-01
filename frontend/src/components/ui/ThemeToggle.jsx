import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

const ThemeToggle = ({ className = '', size = 'default' }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  const sizeClasses = {
    small: 'h-8 w-8',
    default: 'h-10 w-10',
    large: 'h-12 w-12'
  };

  const iconSizes = {
    small: 'h-4 w-4',
    default: 'h-5 w-5', 
    large: 'h-6 w-6'
  };

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative inline-flex items-center justify-center
        ${sizeClasses[size]} rounded-lg border border-border bg-background
        hover:bg-accent hover:text-accent-foreground
        focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
        transition-all duration-200 group
        ${className}
      `}
      aria-label={`Passer en mode ${isDark ? 'clair' : 'sombre'}`}
      title={`Mode ${isDark ? 'clair' : 'sombre'}`}
    >
      <div className="relative">
        {isDark ? (
          <Sun className={`${iconSizes[size]} transition-transform duration-200 group-hover:rotate-12`} />
        ) : (
          <Moon className={`${iconSizes[size]} transition-transform duration-200 group-hover:-rotate-12`} />
        )}
      </div>
    </button>
  );
};

export default ThemeToggle;