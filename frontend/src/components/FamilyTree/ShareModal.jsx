import React, { useState, useEffect } from 'react';

export default function ShareModal({ isOpen, onClose, currentTree, onUpdateTree }) {
  const [copied, setCopied] = useState(false);
  const [vis, setVis] = useState('private');

  useEffect(() => {
    if (currentTree) {
      setVis(currentTree.isPublic ? 'public' : 'private');
    }
  }, [currentTree, isOpen]);

  if (!isOpen || !currentTree) return null;

  const link = `${window.location.origin}/family-tree/${currentTree.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVisibilityChange = async (type) => {
    setVis(type);
    const isPublic = type === 'public';
    if (onUpdateTree) {
      await onUpdateTree(currentTree.id, { isPublic });
    }
  };

  return (
    <div className={`modal-backdrop ${isOpen ? 'open' : ''}`} onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="head">
          <h2>Partager cet arbre</h2>
          <div className="sub">Choisissez qui peut voir cet arbre.</div>
        </div>
        <div className="body">
          <div className="field">
            <label>Lien de partage</label>
            <div className="link-bar">
              <input value={link} readOnly />
              <button className="btn" onClick={handleCopy}>
                {copied ? 'Copié' : 'Copier'}
              </button>
            </div>
          </div>

          <div
            className={`share-option ${vis === 'private' ? 'on' : ''}`}
            onClick={() => handleVisibilityChange('private')}
          >
            <div className="radio"></div>
            <div>
              <div className="t">Privé — uniquement vous</div>
              <div className="s">Personne d'autre ne peut voir cet arbre.</div>
            </div>
          </div>

          <div
            className={`share-option ${vis === 'public' ? 'on' : ''}`}
            onClick={() => handleVisibilityChange('public')}
          >
            <div className="radio"></div>
            <div>
              <div className="t">Public — visible et matchable</div>
              <div className="s">Les autres utilisateurs peuvent voir cet arbre et proposer des correspondances.</div>
            </div>
          </div>
        </div>
        <div className="foot">
          <button className="btn primary" onClick={onClose}>Terminé</button>
        </div>
      </div>
    </div>
  );
}
