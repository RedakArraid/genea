import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFamilyTreeStore } from '../store/familyTreeStore';
import { normalizePersons } from '../utils/layoutEngine';

export default function TimelinePage() {
  const { id: treeId } = useParams();
  const navigate = useNavigate();
  const { currentTree, fetchTreeById, isLoading } = useFamilyTreeStore();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (treeId) {
      fetchTreeById(treeId);
    }
  }, [treeId, fetchTreeById]);

  if (isLoading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '80vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!currentTree) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Arbre non trouvé</h2>
        <button className="btn primary" onClick={() => navigate('/dashboard')}>
          Retour au tableau de bord
        </button>
      </div>
    );
  }

  const rawPeople = currentTree.Person || [];
  // Normaliser les personnes avec leurs relations pour avoir le même format
  const normalized = normalizePersons(rawPeople);
  
  // Trier par année de naissance
  const sorted = [...normalized]
    .filter(p => p.born !== null)
    .sort((a, b) => (+a.born) - (+b.born));

  // Filtrer les personnes par recherche
  const filtered = sorted.filter(p => {
    const q = searchQuery.toLowerCase();
    const fullName = `${p.given} ${p.sur}`.toLowerCase();
    const place = (p.place || '').toLowerCase();
    const bornStr = String(p.born);
    return fullName.includes(q) || place.includes(q) || bornStr.includes(q);
  });

  return (
    <div className="dash" style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div className="head" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-3)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '6px' }}>
            Chronologie · {currentTree.name}
          </div>
          <h1>Chronologie historique</h1>
          <div className="sub">Toutes les personnes de votre arbre, classées par année de naissance.</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div className="search" style={{ width: '280px', background: 'var(--surface)', padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: 'var(--text-3)' }}>
              <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M9 9l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <input 
              placeholder="Rechercher une personne, lieu, date..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ marginLeft: '8px', border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '13px' }}
            />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '40px', textAlign: 'center', color: 'var(--text-3)' }}>
          Aucune personne trouvée pour cette recherche.
        </div>
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
          <div style={{ position: 'relative', paddingLeft: '60px', paddingTop: '6px', paddingBottom: '6px' }}>
            <div style={{ position: 'absolute', left: '50px', top: 0, bottom: 0, width: '1px', background: 'var(--border-strong)' }}></div>
            {filtered.map((p, i) => {
              const ini = (p.given || "?")[0].toUpperCase();
              return (
                <div 
                  key={p.id} 
                  onClick={() => navigate(`/family-tree/${treeId}?select=${p.id}`)} 
                  style={{
                    display: "flex", 
                    alignItems: "center", 
                    gap: "14px",
                    padding: "12px 0", 
                    cursor: "pointer",
                    borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                >
                  <div style={{ width: "42px", fontVariantNumeric: "tabular-nums", fontSize: "12px", color: "var(--text-3)", textAlign: "right", marginLeft: "-60px" }}>
                    {p.born}
                  </div>
                  <div style={{ width: "9px", height: "9px", borderRadius: "50%", background: `var(--tone-${p.tone}-fg)`, marginLeft: "-2px", flex: "0 0 9px" }}></div>
                  <div style={{
                    width: "32px", 
                    height: "32px", 
                    borderRadius: "8px",
                    background: `var(--tone-${p.tone}-bg)`, 
                    color: `var(--tone-${p.tone}-fg)`,
                    display: "grid", 
                    placeItems: "center", 
                    fontWeight: 600, 
                    fontSize: "12px",
                  }}>
                    {ini}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "14px", color: 'var(--text)' }}>
                      {p.given} {p.sur !== '—' ? p.sur : ''}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-3)" }}>
                      {p.place ? `Né·e à ${p.place}` : 'Lieu de naissance inconnu'}
                    </div>
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-3)", background: 'var(--surface-2)', padding: '2px 6px', borderRadius: '4px' }}>
                    G{p.generation}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-2)", fontVariantNumeric: "tabular-nums" }}>
                    {p.died ? `† ${p.died}` : "En vie"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
