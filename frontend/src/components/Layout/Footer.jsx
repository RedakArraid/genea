import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Composant Footer - Pied de page de l'application
 */
const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          {/* Logo et copyright */}
          <div className="mb-4 md:mb-0">
            <Link to="/" className="text-lg font-semibold text-foreground">
              GeneaIA
            </Link>
            <p className="text-sm text-muted-foreground mt-1">
              &copy; {currentYear} GeneaIA. Tous droits réservés.
            </p>
          </div>
          
          {/* Liens du pied de page */}
          <div className="flex flex-wrap gap-6">
            <Link to="/" className="text-sm text-foreground hover:text-primary">
              Accueil
            </Link>
            <Link to="/about" className="text-sm text-foreground hover:text-primary">
              À propos
            </Link>
            <Link to="/privacy" className="text-sm text-foreground hover:text-primary">
              Confidentialité
            </Link>
            <Link to="/terms" className="text-sm text-foreground hover:text-primary">
              Conditions d'utilisation
            </Link>
            <Link to="/contact" className="text-sm text-foreground hover:text-primary">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;