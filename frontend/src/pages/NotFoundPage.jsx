import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Page 404 - Affichée lorsqu'une route n'existe pas
 */
const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-background px-4 py-16 sm:px-6 sm:py-24 md:grid md:place-items-center lg:px-8">
      <div className="max-w-max mx-auto">
        <main className="sm:flex">
          <p className="text-4xl font-bold text-primary sm:text-5xl">404</p>
          <div className="sm:ml-6">
            <div className="sm:border-l sm:border-border sm:pl-6">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                Page introuvable
              </h1>
              <p className="mt-1 text-base text-muted-foreground">
                Désolé, nous n'avons pas trouvé la page que vous recherchez.
              </p>
            </div>
            <div className="mt-10 flex space-x-3 sm:border-l sm:border-transparent sm:pl-6">
              <Link
                to="/"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Retour à l'accueil
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-foreground bg-secondary hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
              >
                Tableau de bord
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default NotFoundPage;