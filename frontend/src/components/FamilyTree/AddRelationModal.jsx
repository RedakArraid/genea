import React, { useState, useEffect } from 'react';

export default function AddRelationModal({ isOpen, onClose, person, people = [], onSubmit }) {
  const [relType, setRelType] = useState('spouse');
  const [targetId, setTargetId] = useState('');
  const [target2Id, setTarget2Id] = useState('');

  useEffect(() => {
    if (isOpen) {
      setRelType('spouse');
      // Sélectionner par défaut la première personne qui n'est pas le sujet
      const firstOther = people.find(p => p.id !== person?.id);
      setTargetId(firstOther?.id || '');
      setTarget2Id('');
    }
  }, [isOpen, person, people]);

  if (!isOpen || !person) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!targetId) return;
    
    // relType: parent (person est le parent de targetId), child (person est l'enfant de targetId), spouse, sibling
    // On appelle onSubmit avec le type de relation et la personne cible
    onSubmit(person.id, targetId, relType, relType === 'child' ? (target2Id || null) : null);
  };

  const otherPeople = people.filter(p => p.id !== person.id);

  return (
    <div className="modal-backdrop open" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="head">
          <h2>Relier {person.given} {person.sur !== '—' ? person.sur : ''}</h2>
          <div className="sub">Créez une relation entre deux personnes existantes de l'arbre.</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="field">
              <label>Personne source (Sujet)</label>
              <input value={`${person.given} ${person.sur !== '—' ? person.sur : ''}`} readOnly style={{ background: 'var(--surface-2)', cursor: 'not-allowed' }} />
            </div>

            <div className="field">
              <label>Type de relation</label>
              <div className="segmented" style={{ width: '100%' }}>
                <button type="button" className={relType === 'spouse' ? 'on' : ''} onClick={() => setRelType('spouse')}>Époux / Conjoint de</button>
                <button type="button" className={relType === 'child' ? 'on' : ''} onClick={() => setRelType('child')}>Enfant de</button>
                <button type="button" className={relType === 'parent' ? 'on' : ''} onClick={() => setRelType('parent')}>Parent de</button>
              </div>
            </div>

            <div className="field">
              <label>Personne cible</label>
              <select 
                value={targetId} 
                onChange={e => setTargetId(e.target.value)}
                required
                style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
              >
                <option value="">Sélectionnez une personne...</option>
                {otherPeople.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.given} {p.sur !== '—' ? p.sur : ''} ({p.born || '?'})
                  </option>
                ))}
              </select>
            </div>

            {relType === 'child' && targetId && (
              <div className="field">
                <label>Second parent (Optionnel)</label>
                <select
                  value={target2Id}
                  onChange={e => setTarget2Id(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                >
                  <option value="">Sélectionnez un second parent...</option>
                  {people.find(p => p.id === targetId)?.spouseIds?.length > 0 && (
                    <optgroup label="Conjoint·es recommandés">
                      {people.filter(p => (people.find(x => x.id === targetId)?.spouseIds || []).includes(p.id)).map(p => (
                        <option key={p.id} value={p.id}>
                          {p.given} {p.sur !== '—' ? p.sur : ''} ({p.born || '?'})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label="Autres membres">
                    {people.filter(p => p.id !== person.id && p.id !== targetId && !(people.find(x => x.id === targetId)?.spouseIds || []).includes(p.id)).map(p => (
                      <option key={p.id} value={p.id}>
                        {p.given} {p.sur !== '—' ? p.sur : ''} ({p.born || '?'})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            )}
          </div>

          <div className="foot">
            <button type="button" className="btn" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn primary" disabled={!targetId}>Créer le lien</button>
          </div>
        </form>
      </div>
    </div>
  );
}
