import React, { useRef, useCallback } from 'react';

const TONES = {
  stone: { bg: 'var(--tone-stone-bg)', fg: 'var(--tone-stone-fg)', ring: 'var(--tone-stone-ring)' },
  rose:  { bg: 'var(--tone-rose-bg)',  fg: 'var(--tone-rose-fg)',  ring: 'var(--tone-rose-ring)'  },
  ocean: { bg: 'var(--tone-ocean-bg)', fg: 'var(--tone-ocean-fg)', ring: 'var(--tone-ocean-ring)' },
  sage:  { bg: 'var(--tone-sage-bg)',  fg: 'var(--tone-sage-fg)',  ring: 'var(--tone-sage-ring)'  },
  amber: { bg: 'var(--tone-amber-bg)', fg: 'var(--tone-amber-fg)', ring: 'var(--tone-amber-ring)' },
  plum:  { bg: 'var(--tone-plum-bg)',  fg: 'var(--tone-plum-fg)',  ring: 'var(--tone-plum-ring)'  },
};

function getInitials(given, sur) {
  const g = (given || '?')[0]?.toUpperCase() || '?';
  const s = sur && sur !== '—' ? sur[0]?.toUpperCase() : '';
  return g + s;
}

function getLifespan(born, died) {
  if (!born) return '?';
  return died ? `${born}–${died}` : `${born}–`;
}

export default function PersonCard({
  person,
  pos,
  scale,
  cardStyle = 'square',
  density = 'spacious',
  selected = false,
  dim = false,
  highlight = false,
  growing = false,
  growDelay = 0,
  onSelect,
  onDrag,
  onHover,
}) {
  const ref = useRef(null);
  const tone = TONES[person.tone] || TONES.stone;
  const initials = getInitials(person.given, person.sur);
  const lifespan = getLifespan(person.born, person.died);

  const toneVars = {
    '--tone-bg': tone.bg,
    '--tone-fg': tone.fg,
    '--tone-ring': tone.ring,
  };

  const onPointerDown = useCallback((e) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startPos = { ...pos };
    let moved = false;

    if (ref.current) ref.current.classList.add('dragging');

    const onMove = (ev) => {
      const dx = (ev.clientX - startX) / scale;
      const dy = (ev.clientY - startY) / scale;
      if (!moved && Math.hypot(ev.clientX - startX, ev.clientY - startY) > 4) {
        moved = true;
      }
      if (moved && onDrag) {
        onDrag(person.id, { x: startPos.x + dx, y: startPos.y + dy });
      }
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if (ref.current) ref.current.classList.remove('dragging');
      if (!moved && onSelect) onSelect(person.id);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, [pos, scale, person.id, onDrag, onSelect]);

  const cls = [
    'pcard',
    `style-${cardStyle}`,
    density === 'compact' ? 'compact' : '',
    selected ? 'selected' : '',
    dim ? 'dim' : '',
    highlight ? 'highlight' : '',
    growing ? 'growing' : '',
  ].filter(Boolean).join(' ');

  const isRound = cardStyle === 'round';
  const isHorizontal = cardStyle === 'horizontal';
  const isMinimal = cardStyle === 'minimal';

  return (
    <div
      ref={ref}
      className={cls}
      style={{
        left: pos.x,
        top: pos.y,
        ...toneVars,
        animationDelay: growing ? `${growDelay}ms` : '0ms',
      }}
      onPointerDown={onPointerDown}
      onMouseEnter={() => onHover && onHover(person.id)}
      onMouseLeave={() => onHover && onHover(null)}
      data-person={person.id}
    >
      {/* Photo / Initiales */}
      {!isRound && !isMinimal && (
        <div className="photo" style={isHorizontal ? {} : { background: tone.bg }}>
          <span className="gen-tag">G{person.generation}</span>
          {person.photoUrl ? (
            <img src={person.photoUrl} alt={person.given} />
          ) : (
            <div className="initials" style={{ color: tone.fg }}>{initials}</div>
          )}
        </div>
      )}

      {/* Style rond */}
      {isRound && (
        <>
          <span className="gen-tag" style={{ position: 'relative', top: 'auto', left: 'auto', marginBottom: 4 }}>
            G{person.generation}
          </span>
          {person.photoUrl ? (
            <img
              src={person.photoUrl}
              alt={person.given}
              style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${tone.ring}` }}
            />
          ) : (
            <div className="initials-disc">{initials}</div>
          )}
        </>
      )}

      {/* Style minimal */}
      {isMinimal && (
        <div className="initials" style={{ color: tone.fg }}>{initials}</div>
      )}

      {/* Méta : nom, dates, lieu */}
      {!isMinimal && (
        <div className="meta">
          <div className="name">
            {person.given}{person.sur && person.sur !== '—' ? ` ${person.sur}` : ''}
          </div>
          {!isRound && (
            <>
              <div className="dates">{lifespan}</div>
              {person.place && <div className="place">{person.place}</div>}
            </>
          )}
          {isRound && <div className="dates">{person.born || '?'}</div>}
        </div>
      )}

      {/* Tooltip minimal */}
      {isMinimal && (
        <div className="meta" style={{ display: 'none' }}>
          <div className="name">{person.given}{person.sur && person.sur !== '—' ? ` ${person.sur}` : ''}</div>
          <div className="dates">{lifespan}</div>
          {person.place && <div className="place">{person.place}</div>}
        </div>
      )}
    </div>
  );
}
