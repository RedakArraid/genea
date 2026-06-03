import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamilyTreeStore } from '../store/familyTreeStore';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';

// Decorative tree illustration on dashboard cards
function DashTreeArt({ color }) {
  return (
    <svg viewBox="0 0 260 120" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%' }}>
      <g stroke={color} fill="none" strokeWidth="1.2">
        <line x1="60" y1="20" x2="60" y2="40"/>
        <line x1="60" y1="40" x2="30" y2="60"/>
        <line x1="60" y1="40" x2="90" y2="60"/>
        <line x1="30" y1="60" x2="30" y2="80"/>
        <line x1="90" y1="60" x2="90" y2="80"/>
        <line x1="30" y1="80" x2="15" y2="100"/>
        <line x1="30" y1="80" x2="45" y2="100"/>
        <line x1="90" y1="80" x2="75" y2="100"/>
        <line x1="90" y1="80" x2="105" y2="100"/>
        <line x1="170" y1="20" x2="170" y2="40"/>
        <line x1="170" y1="40" x2="140" y2="60"/>
        <line x1="170" y1="40" x2="200" y2="60"/>
        <line x1="140" y1="60" x2="140" y2="80"/>
        <line x1="200" y1="60" x2="200" y2="80"/>
      </g>
      <g fill={color}>
        <rect x="55" y="14" width="10" height="6" rx="1"/>
        <rect x="25" y="74" width="10" height="6" rx="1"/>
        <rect x="85" y="74" width="10" height="6" rx="1"/>
        <rect x="10" y="94" width="10" height="6" rx="1"/>
        <rect x="40" y="94" width="10" height="6" rx="1"/>
        <rect x="70" y="94" width="10" height="6" rx="1"/>
        <rect x="100" y="94" width="10" height="6" rx="1"/>
        <rect x="165" y="14" width="10" height="6" rx="1"/>
        <rect x="135" y="74" width="10" height="6" rx="1"/>
        <rect x="195" y="74" width="10" height="6" rx="1"/>
      </g>
    </svg>
  );
}

const swatchMap = {
  stone: { bg: "#eeece8", fg: "#bcb6a8" },
  rose:  { bg: "#f6e8e4", fg: "#d99d92" },
  ocean: { bg: "#e3ebf2", fg: "#7aa3c5" },
  sage:  { bg: "#e6ebe2", fg: "#9fb194" },
  amber: { bg: "#f3ead7", fg: "#d4b777" },
  plum:  { bg: "#ece5ed", fg: "#b39bbf" },
};

const pickCover = (id) => {
  if (!id) return 'stone';
  const hash = String(id).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const keys = Object.keys(swatchMap);
  return keys[hash % keys.length];
};

export default function DashboardPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTreeData, setNewTreeData] = useState({
    name: '',
    description: '',
    isPublic: false
  });
  
  const { user } = useAuth();
  const { 
    trees, 
    isLoading, 
    error, 
    fetchTrees, 
    createTree, 
    deleteTree 
  } = useFamilyTreeStore();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTrees();
  }, [fetchTrees]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewTreeData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCreateTree = async (e) => {
    e.preventDefault();
    try {
      const { success, tree, message } = await createTree(newTreeData);
      if (success) {
        showToast('Arbre généalogique créé avec succès !', 'success');
        setIsCreateModalOpen(false);
        setNewTreeData({ name: '', description: '', isPublic: false });
        navigate(`/family-tree/${tree.id}`);
      } else {
        showToast(message || 'Échec de la création', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Une erreur est survenue', 'error');
    }
  };

  const handleDeleteTree = async (e, treeId, treeName) => {
    e.stopPropagation(); // Empêcher le clic de rediriger vers l'arbre
    if (window.confirm(`Supprimer l'arbre "${treeName}" ? Cette action est irréversible.`)) {
      try {
        const { success, message } = await deleteTree(treeId);
        if (success) {
          showToast('Arbre supprimé avec succès', 'success');
        } else {
          showToast(message || 'Échec de la suppression', 'error');
        }
      } catch (err) {
        console.error(err);
        showToast('Une erreur est survenue', 'error');
      }
    }
  };

  const totalPeople = trees.reduce((sum, t) => sum + (t._count?.Person || 0), 0);
  const stats = [
    { k: "Arbres", v: trees.length },
    { k: "Membres au total", v: totalPeople },
    { k: "Correspondances", v: 5 },
    { k: "Générations", v: 4 },
  ];

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Erreur de chargement</h2>
        <p>{error}</p>
        <button className="btn primary" onClick={fetchTrees}>Réessayer</button>
      </div>
    );
  }

  return (
    <div className="dash" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--text-3)", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 6 }}>
            Bonjour, {user?.name || 'Utilisateur'}
          </div>
          <h1>Tableau de bord</h1>
          <div className="sub">Gérez vos arbres généalogiques et découvrez des correspondances avec d'autres lignées.</div>
        </div>
        <button className="btn primary lg" onClick={() => setIsCreateModalOpen(true)}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: '6px' }}>
            <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
          Nouvel arbre
        </button>
      </div>

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 12, padding: "16px 18px"
          }}>
            <div style={{ fontSize: 11, color: "var(--text-3)", letterSpacing: "0.04em", textTransform: "uppercase" }}>{s.k}</div>
            <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", marginTop: 4, fontVariantNumeric: "tabular-nums", color: 'var(--text)' }}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Tree Grid */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner"></div>
          <p style={{ marginTop: '12px', color: 'var(--text-3)' }}>Chargement des arbres...</p>
        </div>
      ) : (
        <div className="tree-grid">
          {trees.map(tr => {
            const coverType = pickCover(tr.id);
            const tone = swatchMap[coverType];
            return (
              <div key={tr.id} className="tree-card" onClick={() => navigate(`/family-tree/${tr.id}`)}>
                <div className="cover" style={{ background: tone.bg }}>
                  <DashTreeArt color={tone.fg}/>
                  
                  {/* Bouton de suppression discret en haut à droite */}
                  <button 
                    className="btn ghost icon sm" 
                    onClick={(e) => handleDeleteTree(e, tr.id, tr.name)}
                    style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(255,255,255,0.7)', borderRadius: '50%' }}
                    title="Supprimer l'arbre"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
                <div className="info">
                  <div className="tc-title" style={{ color: 'var(--text)' }}>{tr.name}</div>
                  <div className="tc-meta">
                    <span>{tr._count?.Person || 0} personnes</span>
                    <span>·</span>
                    <span className={`chip ${tr.isPublic ? 'public' : 'private'}`}>
                      <span className="dot"></span>{tr.isPublic ? 'Public' : 'Privé'}
                    </span>
                    <span style={{ marginLeft: "auto", color: "var(--text-3)", fontSize: '11px' }}>
                      {new Date(tr.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          
          <div className="tree-card add" onClick={() => setIsCreateModalOpen(true)}>
            <div>
              <div style={{ display: "grid", placeItems: "center", marginBottom: '8px' }}>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <path d="M11 4v14M4 11h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="label">Nouvel arbre</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent activity */}
      <h2 style={{ margin: "36px 0 14px", fontSize: 14, fontWeight: 600, color: "var(--text-2)", letterSpacing: "-0.005em" }}>
        Activité récente
      </h2>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
        {[
          { who: "Béatrice", act: "a ajouté une photo à", what: "Henri", when: "il y a 2 h" },
          { who: "Vous", act: "avez relié", what: "Sara à Jules", when: "hier" },
          { who: "Système", act: "a trouvé", what: "3 nouvelles correspondances", when: "il y a 3 j" },
          { who: "Marin", act: "a créé", what: "Anouk (G4)", when: "il y a 5 j" },
        ].map((row, i) => (
          <div key={i} style={{ padding: "12px 18px", borderTop: i ? "1px solid var(--border)" : 0, display: "flex", alignItems: "center", gap: 12, fontSize: 13 }}>
            <span style={{ width: 24, height: 24, borderRadius: 12, background: "var(--surface-2)", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 600, color: "var(--text-2)" }}>
              {row.who[0]}
            </span>
            <span>
              <b style={{ fontWeight: 600, color: 'var(--text)' }}>{row.who}</b>{' '}
              <span style={{ color: "var(--text-2)" }}>{row.act}</span>{' '}
              <b style={{ fontWeight: 500, color: 'var(--text)' }}>{row.what}</b>
            </span>
            <span style={{ marginLeft: "auto", color: "var(--text-3)", fontSize: 12 }}>{row.when}</span>
          </div>
        ))}
      </div>

      {/* Modal de création d'arbre */}
      {isCreateModalOpen && (
        <div className="modal-backdrop open" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="head">
              <h2>Créer un nouvel arbre</h2>
              <div className="sub">Saisissez les informations de base de votre arbre généalogique.</div>
            </div>
            
            <form onSubmit={handleCreateTree}>
              <div className="body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="field">
                  <label htmlFor="name">Nom de l'arbre*</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={newTreeData.name}
                    onChange={handleChange}
                    placeholder="Ex: Famille Martin"
                  />
                </div>
                
                <div className="field">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    rows="3"
                    value={newTreeData.description}
                    onChange={handleChange}
                    placeholder="Ex: Arbre généalogique de la branche maternelle."
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                  />
                </div>
                
                <label style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer', fontSize: '13px' }}>
                  <input
                    id="isPublic"
                    name="isPublic"
                    type="checkbox"
                    checked={newTreeData.isPublic}
                    onChange={handleChange}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  Rendre cet arbre public (visible par les autres pour les correspondances)
                </label>
              </div>
              
              <div className="foot">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn primary"
                >
                  Créer l'arbre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}