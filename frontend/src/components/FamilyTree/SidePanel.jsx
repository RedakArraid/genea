import React from 'react';

const TONE_CLASSES = {
  stone: { bg: 'var(--tone-stone-bg)', fg: 'var(--tone-stone-fg)' },
  rose:  { bg: 'var(--tone-rose-bg)',  fg: 'var(--tone-rose-fg)'  },
  ocean: { bg: 'var(--tone-ocean-bg)', fg: 'var(--tone-ocean-fg)' },
  sage:  { bg: 'var(--tone-sage-bg)',  fg: 'var(--tone-sage-fg)'  },
  amber: { bg: 'var(--tone-amber-bg)', fg: 'var(--tone-amber-fg)' },
  plum:  { bg: 'var(--tone-plum-bg)',  fg: 'var(--tone-plum-fg)'  },
};

const I18N = {
  fr: {
    person: {
      born: "Né·e",
      died: "Décédé·e",
      parents: "Parents",
      spouse: "Conjoint·e",
      children: "Enfants",
      siblings: "Frères et sœurs",
      noParent: "Parents inconnus",
      noSpouse: "Pas de conjoint·e",
      noChildren: "Pas d'enfants",
      edit: "Éditer",
      focus: "Centrer sur",
    }
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch (e) {
    return null;
  }
};

export default function SidePanel({ person, people, currentTree, lang = 'fr', onClose, onSelect, onEdit, onAddRelation, onAddChildRelation, onDelete, onDeleteRelation }) {
  if (!person) return <div className="sidepanel"></div>;

  const t = I18N[lang]?.person || I18N.fr.person;
  const byId = Object.fromEntries(people.map(p => [p.id, p]));
  
  const parents = (person.parentIds || []).map(id => byId[id]).filter(Boolean);
  const spouses = (person.spouseIds || []).map(id => byId[id]).filter(Boolean);
  const children = people.filter(p => (p.parentIds || []).includes(person.id));
  
  const siblings = (() => {
    if (!person.parentIds || !person.parentIds.length) return [];
    return people.filter(p =>
      p.id !== person.id &&
      p.parentIds &&
      p.parentIds.length &&
      p.parentIds.some(pp => person.parentIds.includes(pp))
    );
  })();

  const initials = (person.given || "?").slice(0, 1).toUpperCase() + 
    (person.sur && person.sur !== "—" ? person.sur.slice(0, 1).toUpperCase() : "");
  
  const lifespan = person.died ? `${person.born}–${person.died}` : `${person.born || '?'}–`;
  
  const age = person.born ? (person.died
    ? `${(+person.died) - (+person.born)} ans`
    : `${new Date().getFullYear() - (+person.born)} ans`) : '';

  const tone = TONE_CLASSES[person.tone] || TONE_CLASSES.stone;
  const toneVar = {
    "--tone-bg": tone.bg,
    "--tone-fg": tone.fg,
  };

  const findRelationshipId = (relativeId, typeOfRel) => {
    if (!currentTree || !currentTree.Relationship) return null;
    const rels = currentTree.Relationship;
    
    if (typeOfRel === 'spouse') {
      const match = rels.find(r => 
        r.type === 'spouse' && 
        ((r.sourceId === person.id && r.targetId === relativeId) || 
         (r.sourceId === relativeId && r.targetId === person.id))
      );
      return match?.id;
    }
    
    if (typeOfRel === 'parent') {
      const match = rels.find(r => 
        (r.type === 'parent' && r.sourceId === relativeId && r.targetId === person.id) ||
        (r.type === 'child' && r.sourceId === person.id && r.targetId === relativeId)
      );
      return match?.id;
    }
    
    if (typeOfRel === 'child') {
      const match = rels.find(r => 
        (r.type === 'parent' && r.sourceId === person.id && r.targetId === relativeId) ||
        (r.type === 'child' && r.sourceId === relativeId && r.targetId === person.id)
      );
      return match?.id;
    }
    
    return null;
  };

  const RelChip = ({ p, relType }) => {
    if (!p) return null;
    const ini = (p.given || "?").slice(0, 1).toUpperCase() + 
      (p.sur && p.sur !== "—" ? p.sur.slice(0, 1).toUpperCase() : "");
    const tv = TONE_CLASSES[p.tone] || TONE_CLASSES.stone;
    const relToneVar = {
      "--tone-bg": tv.bg,
      "--tone-fg": tv.fg,
    };
    const ls = p.died ? `${p.born}–${p.died}` : p.born || '?';
    const relId = relType ? findRelationshipId(p.id, relType) : null;

    const handleDelete = (e) => {
      e.stopPropagation();
      if (onDeleteRelation && relId) {
        onDeleteRelation(relId);
      }
    };

    const handleAddChildWithSpouse = (e) => {
      e.stopPropagation();
      if (onAddChildRelation) {
        onAddChildRelation(person.id, 'child', p.id);
      }
    };

    return (
      <div className="relchip-wrapper" style={{ display: 'inline-flex', alignItems: 'center', marginRight: '6px', marginBottom: '6px' }}>
        <button className="relchip" onClick={() => onSelect(p.id)} style={{ marginRight: 0 }}>
          <span className="micro" style={relToneVar}>{ini}</span>
          <span>{p.given}{p.sur && p.sur !== "—" ? ` ${p.sur}` : ""}</span>
          <span className="lifespan">· {ls}</span>
        </button>
        {relType === 'spouse' && onAddChildRelation && (
          <button 
            onClick={handleAddChildWithSpouse}
            title="Ajouter un enfant à ce couple"
            style={{
              background: 'none',
              border: 'none',
              color: '#7c3aed',
              cursor: 'pointer',
              marginLeft: '4px',
              padding: '2px 4px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f3e8ff'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            👶
          </button>
        )}
        {relId && onDeleteRelation && (
          <button 
            onClick={handleDelete}
            title="Supprimer cette liaison"
            style={{
              background: 'none',
              border: 'none',
              color: '#ef4444',
              cursor: 'pointer',
              marginLeft: '4px',
              padding: '2px 4px',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fee2e2'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            ✕
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="sidepanel open">
      <button className="close-x" onClick={onClose} aria-label="Close">
        <svg width="14" height="14" viewBox="0 0 14 14">
          <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      </button>
      <div className="sp-head">
        <div className="sp-photo" style={toneVar}>
          {person.photoUrl ? (
            <img src={person.photoUrl} alt={person.given} className="sp-photo-img" style={{ width: '100%', height: '100%', borderRadius: 'inherit', objectFit: 'cover' }} />
          ) : (
            initials
          )}
          <div className="grain"></div>
        </div>
        <div className="sp-name">
          <div className="chip" style={{ marginBottom: 6 }}>
            <span className="dot" style={{ background: tone.fg }}></span>
            G{person.generation} {age ? `· ${age}` : ''}
          </div>
          <h2>{person.given}{person.sur && person.sur !== "—" ? ` ${person.sur}` : ""}</h2>
          <div className="sub">{lifespan} {person.place ? `· ${person.place}` : ''}</div>
        </div>
      </div>
      <div className="sp-body">
        <div className="sp-section">
          <div className="sp-label">Informations</div>
          <div className="sp-facts">
            <div className="k">Naissance</div>
            <div className="v">{formatDate(person.birthDate) || person.born || '?'} {person.place ? `· ${person.place}` : ''}</div>
            {(person.deathDate || person.died) && (
              <>
                <div className="k">Décès</div>
                <div className="v">{formatDate(person.deathDate) || person.died}</div>
              </>
            )}
            <div className="k">Génération</div>
            <div className="v">G{person.generation}</div>
            {person.bio && (person.bio.fr || person.bio.en) && (
              <>
                <div className="k">Notes</div>
                <div className="v bio">{person.bio.fr || person.bio.en}</div>
              </>
            )}
          </div>
        </div>

        <div className="sp-section">
          <div className="sp-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{t.parents}</span>
            {onAddChildRelation && (
              <button className="btn-add-rel" onClick={() => onAddChildRelation(person.id, 'parent')}>+ Ajouter</button>
            )}
          </div>
          {parents.length ? (
            <div>{parents.map(p => <RelChip key={p.id} p={p} relType="parent"/>)}</div>
          ) : (
            <div style={{ fontSize: 12, color: "var(--text-3)" }}>{t.noParent}</div>
          )}
        </div>

        <div className="sp-section">
          <div className="sp-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{t.spouse}</span>
            {onAddChildRelation && (
              <button className="btn-add-rel" onClick={() => onAddChildRelation(person.id, 'spouse')}>+ Ajouter</button>
            )}
          </div>
          {spouses.length ? (
            <div>{spouses.map(p => <RelChip key={p.id} p={p} relType="spouse"/>)}</div>
          ) : (
            <div style={{ fontSize: 12, color: "var(--text-3)" }}>{t.noSpouse}</div>
          )}
        </div>

        <div className="sp-section">
          <div className="sp-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{t.children} ({children.length})</span>
            {onAddChildRelation && (
              <button className="btn-add-rel" onClick={() => onAddChildRelation(person.id, 'child')}>+ Ajouter</button>
            )}
          </div>
          {children.length ? (
            <div>{children.map(p => <RelChip key={p.id} p={p} relType="child"/>)}</div>
          ) : (
            <div style={{ fontSize: 12, color: "var(--text-3)" }}>{t.noChildren}</div>
          )}
        </div>

        {siblings.length > 0 && (
          <div className="sp-section">
            <div className="sp-label">{t.siblings} ({siblings.length})</div>
            <div>{siblings.map(p => <RelChip key={p.id} p={p}/>)}</div>
          </div>
        )}
      </div>
      <div className="sp-actions" style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', padding: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
          <button className="btn" style={{ flex: 1 }} onClick={() => window.__focusOn && window.__focusOn(person.id)}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="2" stroke="currentColor" strokeWidth="1.4"/>
              <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.4" strokeDasharray="2 2"/>
            </svg>
            {t.focus}
          </button>
          <button className="btn primary" style={{ flex: 1 }} onClick={() => onEdit && onEdit(person)}>
            {t.edit}
          </button>
        </div>
        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
          <button className="btn" style={{ flex: 1 }} onClick={() => onAddRelation && onAddRelation(person)}>
            Lier à un proche
          </button>
          <button 
            className="btn" 
            style={{ flex: 1, color: '#ef4444', borderColor: '#fee2e2' }} 
            onClick={() => onDelete && onDelete(person.id)}
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}
