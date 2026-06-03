import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useFamilyTreeStore } from '../store/familyTreeStore';

export default function MatchesPage() {
  const { id: treeId } = useParams();
  const { currentTree } = useFamilyTreeStore();
  const [privacyEnabled, setPrivacyEnabled] = useState(true);

  const matches = [
    { id: "m1", tree: "Famille Martin", owner: "Jean Martin", region: "Bretagne", shared: 3, confidence: 94, via: "Jean-Pierre — 1902" },
    { id: "m2", tree: "Arbre Lefevre", owner: "Marie Lefevre", region: "Hauts-de-France", shared: 2, confidence: 81, via: "Marie-Louise — 1928" },
    { id: "m3", tree: "Lignée Picard", owner: "Pierre Picard", region: "Île-de-France", shared: 1, confidence: 68, via: "Pierre — 1954" },
    { id: "m4", tree: "Famille Roussel", owner: "Sophie Roussel", region: "Normandie", shared: 1, confidence: 42, via: "Yvonne — 1934" },
    { id: "m5", tree: "Branche Auvergnate", owner: "Laurent Pradel", region: "Auvergne", shared: 2, confidence: 65, via: "Camille — 1960" },
  ];

  return (
    <div className="dash" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="head" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-3)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '6px' }}>
            ★ Recherche de parentés
          </div>
          <h1>Correspondances familiales</h1>
          <div className="sub" style={{ maxWidth: '600px' }}>
            Des arbres publics croisent des personnes du vôtre. Avec leur accord, vous pourriez fusionner ou importer des branches entières.
          </div>
        </div>
        <button className="btn" onClick={() => setPrivacyEnabled(!privacyEnabled)}>
          Réglages de confidentialité
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "16px", marginBottom: '32px' }}>
        {matches.map(m => (
          <div key={m.id} className="match-card" style={{ padding: '20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="top" style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'between' }}>
              <div className="seal" style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: m.confidence > 80 ? "var(--tone-sage-bg)" : m.confidence > 60 ? "var(--tone-amber-bg)" : "var(--tone-stone-bg)",
                color: m.confidence > 80 ? "var(--tone-sage-fg)" : m.confidence > 60 ? "var(--tone-amber-fg)" : "var(--tone-stone-fg)",
                display: 'grid',
                placeItems: 'center',
                fontWeight: 700,
                fontSize: '13px',
                flexShrink: 0
              }}>
                {m.tree.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <div className="title-row" style={{ flex: 1, minWidth: 0 }}>
                <div className="title" style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.tree}</div>
                <div className="owner" style={{ fontSize: '12px', color: 'var(--text-3)' }}>{m.owner} · {m.region}</div>
              </div>
              <div className="conf" style={{ 
                fontWeight: 700, 
                fontSize: '14px', 
                color: m.confidence > 80 ? "var(--positive)" : m.confidence > 60 ? "var(--warning)" : "var(--text-3)" 
              }}>
                {m.confidence}%
              </div>
            </div>
            
            <div className="bar" style={{ height: '6px', background: 'var(--surface-2)', borderRadius: '3px', overflow: 'hidden' }}>
              <div className="fill" style={{ 
                height: '100%', 
                width: `${m.confidence}%`, 
                background: m.confidence > 80 ? "var(--positive)" : m.confidence > 60 ? "var(--warning)" : "var(--text-3)" 
              }}/>
            </div>
            
            <div className="stats" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-2)', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              <div><b>{m.shared}</b> personnes partagées</div>
              <div style={{ color: "var(--text-3)" }}>Via <b style={{ color: "var(--text-2)" }}>{m.via}</b></div>
            </div>
            
            <div className="actions" style={{ display: "flex", gap: "8px" }}>
              <button className="btn sm" style={{ flex: 1 }}>Comparer</button>
              <button className="btn sm primary" style={{ flex: 1 }}>Examiner</button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: "20px", border: "1px dashed var(--border-strong)", borderRadius: "10px", fontSize: "13px", color: "var(--text-2)", display: "flex", gap: "12px", alignItems: "flex-start", background: 'var(--surface)' }}>
        <input 
          type="checkbox" 
          checked={privacyEnabled} 
          onChange={e => setPrivacyEnabled(e.target.checked)} 
          style={{ marginTop: "4px", accentColor: 'var(--accent)' }}
        />
        <div>
          <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--text)", marginBottom: '4px' }}>
            Rendre mon arbre public pour recevoir des correspondances automatiques
          </div>
          <div>
            Astuce — un arbre public augmente vos correspondances de ~3× en croisant vos données avec la communauté Genea de manière anonyme et sécurisée.
          </div>
        </div>
      </div>
    </div>
  );
}
