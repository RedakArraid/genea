import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function GeneaTopBar({ treeName }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name 
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <header className="topbar">
      <div className="brand" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
        <div className="logo" />
        <span>Genea</span>
      </div>
      
      {treeName && (
        <div className="crumbs">
          <span onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>Mes arbres</span>
          <span className="sep">/</span>
          <span className="here">{treeName}</span>
        </div>
      )}

      <div className="spacer" />

      <button className="btn ghost icon" title="Notifications">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 6a4 4 0 1 1 8 0v2.5l1 1.5H2l1-1.5V6Zm2 4.5a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
        </svg>
      </button>

      <div 
        className="avatar-chip" 
        onClick={() => navigate('/profile')} 
        title={`${user?.name || 'Profil'} - Cliquez pour voir le profil`}
        style={{ cursor: 'pointer' }}
      >
        {initials}
      </div>

      <button 
        className="btn ghost sm" 
        onClick={handleLogout} 
        style={{ fontSize: '11px', padding: '4px 8px', marginLeft: '8px' }}
      >
        Déconnexion
      </button>
    </header>
  );
}
