import { useEffect } from 'react';

/**
 * Hook pour gérer les raccourcis clavier dans l'arbre généalogique
 */
const useKeyboardShortcuts = ({
  onAddPerson,
  onToggleHelp,
  onFitView,
  reactFlowInstance
}) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ignorer si l'utilisateur tape dans un champ de saisie
      if (event.target.tagName === 'INPUT' || 
          event.target.tagName === 'TEXTAREA' || 
          event.target.isContentEditable) {
        return;
      }

      // Combinaisons avec Ctrl/Cmd
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'n': // Ctrl+N : Nouvelle personne
            event.preventDefault();
            onAddPerson();
            break;
          case 'h': // Ctrl+H : Aide
            event.preventDefault();
            onToggleHelp();
            break;
          case '0': // Ctrl+0 : Ajuster la vue
            event.preventDefault();
            if (reactFlowInstance) {
              reactFlowInstance.fitView();
            }
            break;
          default:
            break;
        }
      }
      // Touches simples
      else {
        switch (event.key) {
          case '+':
          case '=':
            event.preventDefault();
            onAddPerson();
            break;
          case '?':
            event.preventDefault();
            onToggleHelp();
            break;
          case 'f':
          case 'F':
            event.preventDefault();
            if (reactFlowInstance) {
              reactFlowInstance.fitView();
            }
            break;
          default:
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onAddPerson, onToggleHelp, onFitView, reactFlowInstance]);
};

export default useKeyboardShortcuts;
