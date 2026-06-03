import React, { useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useFamilyTreeStore } from '../../store/familyTreeStore';

export default function GeneaSideNav({ onGrow }) {
  const { id: routeTreeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { trees, currentTree, fetchTrees } = useFamilyTreeStore();

  useEffect(() => {
    fetchTrees();
  }, [fetchTrees]);

  const treeId = routeTreeId || currentTree?.id || (trees.length > 0 ? trees[0].id : null);

  // Déterminer la vue active
  let activeTab = 'dashboard';
  if (location.pathname === '/dashboard') {
    activeTab = 'dashboard';
  } else if (location.pathname.includes('/matches')) {
    activeTab = 'matches';
  } else if (location.pathname.includes('/timeline')) {
    activeTab = 'timeline';
  } else if (location.pathname.includes('/family-tree')) {
    activeTab = 'canvas';
  }

  const navItems = [
    {
      id: 'dashboard',
      label: 'Mes arbres',
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1.5" y="2.5" width="5" height="3.5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
          <rect x="7.5" y="2.5" width="5" height="3.5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
          <rect x="1.5" y="8" width="5" height="3.5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
          <rect x="7.5" y="8" width="5" height="3.5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
        </svg>
      ),
      path: '/dashboard',
      count: trees.length,
    },
    {
      id: 'canvas',
      label: 'Vue arbre',
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
          <circle cx="3" cy="10" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
          <circle cx="11" cy="10" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
          <path d="M7 4.5v2L4 9M7 6.5L10 9" stroke="currentColor" strokeWidth="1.2"/>
        </svg>
      ),
      path: treeId ? `/family-tree/${treeId}` : null,
      disabled: !treeId,
    },
    {
      id: 'matches',
      label: 'Correspondances',
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 12s-5-3-5-7a3 3 0 0 1 5-2 3 3 0 0 1 5 2c0 4-5 7-5 7Z" stroke="currentColor" strokeWidth="1.2"/>
        </svg>
      ),
      path: treeId ? `/family-tree/${treeId}/matches` : null,
      disabled: !treeId,
    },
    {
      id: 'timeline',
      label: 'Chronologie',
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 7h10M2 7v-2M2 7v2M5 7v-3M8 7v2M11 7v-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      ),
      path: treeId ? `/family-tree/${treeId}/timeline` : null,
      disabled: !treeId,
    },
  ];

  const swatches = { 
    stone: "#bcb6a8", 
    rose: "#d99d92", 
    ocean: "#7aa3c5", 
    sage: "#9fb194", 
    amber: "#d4b777", 
    plum: "#b39bbf" 
  };

  const pickCover = (id) => {
    if (!id) return 'stone';
    const hash = String(id).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const keys = Object.keys(swatches);
    return keys[hash % keys.length];
  };

  const handleItemClick = (item) => {
    if (item.disabled || !item.path) return;
    navigate(item.path);
  };

  return (
    <aside className="sidenav">
      {navItems.map(it => (
        <button 
          key={it.id} 
          className={`nav-item ${activeTab === it.id ? "active" : ""} ${it.disabled ? "disabled" : ""}`} 
          onClick={() => handleItemClick(it)}
          disabled={it.disabled}
        >
          <span className="icon">{it.icon}</span>
          <span>{it.label}</span>
          {it.count != null && <span className="count">{it.count}</span>}
        </button>
      ))}

      <div className="section-label">Mes arbres</div>
      {trees.map(tr => {
        const coverType = pickCover(tr.id);
        const isActive = treeId === tr.id;
        return (
          <button 
            key={tr.id} 
            className={`tree-pill ${isActive ? "active" : ""}`} 
            onClick={() => navigate(`/family-tree/${tr.id}`)}
          >
            <span className="swatch" style={{ background: swatches[coverType] }} />
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {tr.name}
            </span>
          </button>
        );
      })}

      <div style={{ flex: 1 }}></div>
      
      {activeTab === 'canvas' && onGrow && (
        <button 
          className="btn sm" 
          style={{ width: "100%", justifyContent: "flex-start", marginBottom: 6 }} 
          onClick={onGrow}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 11V5M6 5L3 7M6 5L9 7M6 5V1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Animer l'arbre
        </button>
      )}
    </aside>
  );
}
