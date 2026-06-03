import React from 'react';

export default function TreeTweaksPanel({ isOpen, onClose, tweaks = {}, onSetTweak }) {
  const layout = tweaks.layout || 'vertical';
  const density = tweaks.density || 'spacious';
  const cardStyle = tweaks.cardStyle || 'square';
  const connStyle = tweaks.connStyle || 'elbow';
  const theme = tweaks.theme || 'light';

  return (
    <div className={`tweaks-panel ${isOpen ? 'open' : ''}`}>
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'between' }}>
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Réglages de l'affichage</h3>
        <button 
          onClick={onClose} 
          style={{ 
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: '16px', padding: '4px', marginLeft: 'auto'
          }}
        >
          ✕
        </button>
      </div>

      {/* Apparence */}
      <div className="tweaks-section">
        <div className="tweaks-section-title">Apparence</div>
        
        <div className="tweak-row">
          <div className="tweak-label">Thème</div>
          <div className="segmented" style={{ width: '100%' }}>
            <button 
              className={theme === 'light' ? 'on' : ''} 
              onClick={() => onSetTweak('theme', 'light')}
            >
              Clair
            </button>
            <button 
              className={theme === 'dark' ? 'on' : ''} 
              onClick={() => onSetTweak('theme', 'dark')}
            >
              Sombre
            </button>
          </div>
        </div>

        <div className="tweak-row">
          <div className="tweak-label">Densité</div>
          <div className="segmented" style={{ width: '100%' }}>
            <button 
              className={density === 'compact' ? 'on' : ''} 
              onClick={() => onSetTweak('density', 'compact')}
            >
              Compact
            </button>
            <button 
              className={density === 'spacious' ? 'on' : ''} 
              onClick={() => onSetTweak('density', 'spacious')}
            >
              Aéré
            </button>
          </div>
        </div>
      </div>

      {/* Arbre */}
      <div className="tweaks-section">
        <div className="tweaks-section-title">Arbre</div>

        <div className="tweak-row">
          <div className="tweak-label">Disposition</div>
          <select 
            value={layout} 
            onChange={(e) => onSetTweak('layout', e.target.value)}
            style={{ 
              width: '100%', padding: '6px 8px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '13px'
            }}
          >
            <option value="vertical">Vertical (haut → bas)</option>
            <option value="horizontal">Horizontal (gauche → droite)</option>
            <option value="radial">Radial (anneaux)</option>
          </select>
        </div>

        <div className="tweak-row">
          <div className="tweak-label">Style de carte</div>
          <select 
            value={cardStyle} 
            onChange={(e) => onSetTweak('cardStyle', e.target.value)}
            style={{ 
              width: '100%', padding: '6px 8px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '13px'
            }}
          >
            <option value="square">Carré</option>
            <option value="round">Rond</option>
            <option value="horizontal">Horizontal</option>
            <option value="minimal">Minimal</option>
          </select>
        </div>

        <div className="tweak-row">
          <div className="tweak-label">Connexions</div>
          <div className="segmented" style={{ width: '100%' }}>
            <button 
              className={connStyle === 'elbow' ? 'on' : ''} 
              onClick={() => onSetTweak('connStyle', 'elbow')}
            >
              Équerre
            </button>
            <button 
              className={connStyle === 'curve' ? 'on' : ''} 
              onClick={() => onSetTweak('connStyle', 'curve')}
            >
              Courbe
            </button>
            <button 
              className={connStyle === 'straight' ? 'on' : ''} 
              onClick={() => onSetTweak('connStyle', 'straight')}
            >
              Droite
            </button>
          </div>
        </div>
      </div>

      {/* Affichage */}
      <div className="tweaks-section">
        <div className="tweaks-section-title">Affichage</div>
        
        <label style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer', fontSize: '13px' }}>
          <input 
            type="checkbox" 
            checked={!!tweaks.hideDates} 
            onChange={(e) => onSetTweak('hideDates', e.target.checked)} 
            style={{ accentColor: 'var(--accent)' }}
          />
          Masquer les dates
        </label>

        <label style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer', fontSize: '13px' }}>
          <input 
            type="checkbox" 
            checked={!!tweaks.hidePlaces} 
            onChange={(e) => onSetTweak('hidePlaces', e.target.checked)} 
            style={{ accentColor: 'var(--accent)' }}
          />
          Masquer les lieux
        </label>

        <label style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer', fontSize: '13px' }}>
          <input 
            type="checkbox" 
            checked={!!tweaks.hidePhotos} 
            onChange={(e) => onSetTweak('hidePhotos', e.target.checked)} 
            style={{ accentColor: 'var(--accent)' }}
          />
          Masquer les photos
        </label>
      </div>
    </div>
  );
}
