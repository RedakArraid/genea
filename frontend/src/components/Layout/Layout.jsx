import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import GeneaTopBar from './GeneaTopBar';
import GeneaSideNav from './GeneaSideNav';
import { useFamilyTreeStore } from '../../store/familyTreeStore';

/**
 * Main Layout component that wraps pages
 * Renders the premium app shell when authenticated, and simple outlet when not
 */
const Layout = () => {
  const { isAuthenticated } = useAuth();
  const { currentTree } = useFamilyTreeStore();

  const handleGrow = () => {
    if (window.__triggerGrow) {
      window.__triggerGrow();
    }
  };

  if (isAuthenticated) {
    return (
      <div className="app-shell">
        <GeneaTopBar treeName={currentTree?.name} />
        <div className="app-body">
          <GeneaSideNav onGrow={handleGrow} />
          <main className="main">
            <Outlet />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-grow">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;