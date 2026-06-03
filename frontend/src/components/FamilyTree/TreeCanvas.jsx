import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import PersonCard from './PersonCard';
import { buildConnections, computeLineage, CARD_W, CARD_H } from '../../utils/layoutEngine';

// ── Icônes inline ──
const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);
const ShareIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M9.5 4.5L4.5 7M4.5 7l5 2.5M4.5 7a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm8 3.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0-7a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" stroke="currentColor" strokeWidth="1.3"/>
  </svg>
);
const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M9 9l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);
const SettingsIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M7 1v1M7 12v1M1 7h1M12 7h1M2.93 2.93l.7.7M10.37 10.37l.7.7M2.93 11.07l.7-.7M10.37 3.63l.7-.7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

// ── Minimap ──
function Minimap({ people, positions, scale, pan, vp, onJump, canvasW, canvasH }) {
  const mapW = 180;
  const mapH = 130;
  const sx = mapW / (canvasW || 1200);
  const sy = mapH / (canvasH || 900);
  const ratio = Math.min(sx, sy);
  const offX = (mapW - (canvasW || 1200) * ratio) / 2;
  const offY = (mapH - (canvasH || 900) * ratio) / 2;

  const vpx = -pan.x / scale;
  const vpy = -pan.y / scale;
  const vpw = vp.w / scale;
  const vph = vp.h / scale;

  const onClick = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const mx = (e.clientX - r.left - offX) / ratio;
    const my = (e.clientY - r.top - offY) / ratio;
    onJump(mx, my);
  };

  return (
    <div className="minimap" onClick={onClick}>
      <svg viewBox={`0 0 ${mapW} ${mapH}`} width={mapW} height={mapH}>
        <rect x="0" y="0" width={mapW} height={mapH} fill="var(--surface-2)"/>
        {people.map(p => {
          const pos = positions[p.id];
          if (!pos) return null;
          return (
            <rect
              key={p.id}
              x={offX + pos.x * ratio}
              y={offY + pos.y * ratio}
              width={CARD_W * ratio}
              height={CARD_H * ratio}
              fill={`var(--tone-${p.tone}-fg)`}
              opacity="0.55"
              rx="1"
            />
          );
        })}
        <rect
          className="vp"
          x={offX + vpx * ratio}
          y={offY + vpy * ratio}
          width={vpw * ratio}
          height={vph * ratio}
        />
      </svg>
    </div>
  );
}

// ── Segmented control ──
function Segmented({ value, onChange, options }) {
  return (
    <div className="segmented">
      {options.map(o => (
        <button
          key={o.value}
          className={value === String(o.value) ? 'on' : ''}
          onClick={() => onChange(String(o.value))}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── TreeCanvas principal ──
export default function TreeCanvas({
  people = [],
  tweaks = {},
  positions,
  setPositions,
  selectedId,
  onSelect,
  hoverId,
  onHover,
  growKey,
  canvasW = 1400,
  canvasH = 1000,
  onOpenAdd,
  onOpenShare,
  onOpenTweaks,
  onSetTweak,
  searchQuery,
  onSearchChange,
}) {
  const wrapRef = useRef(null);
  const innerRef = useRef(null);
  const [pan, setPan] = useState({ x: 60, y: 40 });
  const [scale, setScale] = useState(0.85);
  const [panning, setPanning] = useState(false);
  const [vp, setVp] = useState({ w: 1000, h: 700 });

  const cardStyle = tweaks.cardStyle || 'square';
  const density = tweaks.density || 'spacious';
  const layout = tweaks.layout || 'vertical';
  const connStyle = tweaks.connStyle || 'elbow';

  // Mesure viewport
  useEffect(() => {
    const onResize = () => {
      if (!wrapRef.current) return;
      const r = wrapRef.current.getBoundingClientRect();
      setVp({ w: r.width, h: r.height });
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Pan handlers
  const onPointerDownBg = (e) => {
    const el = e.target;
    const isBackground =
      el === wrapRef.current ||
      el === innerRef.current ||
      el.classList.contains('connections') ||
      el.tagName === 'svg' ||
      el.tagName === 'path' ||
      el.tagName === 'rect';
    if (!isBackground) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startPan = { ...pan };
    setPanning(true);

    const onMove = (ev) => {
      setPan({ x: startPan.x + (ev.clientX - startX), y: startPan.y + (ev.clientY - startY) });
    };
    const onUp = () => {
      setPanning(false);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  // Wheel zoom
  const onWheel = useCallback((e) => {
    e.preventDefault();
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const factor = e.deltaY > 0 ? 0.92 : 1.08;
    const newScale = Math.max(0.2, Math.min(2.5, scale * factor));
    const wx = (mx - pan.x) / scale;
    const wy = (my - pan.y) / scale;
    setScale(newScale);
    setPan({ x: mx - wx * newScale, y: my - wy * newScale });
  }, [scale, pan]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    wrap.addEventListener('wheel', onWheel, { passive: false });
    return () => wrap.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  // Filtrage par génération
  const genFilter = tweaks.generation || 'all';
  const filteredIds = useMemo(() => {
    if (genFilter === 'all') return new Set(people.map(p => p.id));
    const gen = +genFilter;
    return new Set(people.filter(p => (p.generation ?? p.gen ?? 1) === gen).map(p => p.id));
  }, [genFilter, people]);

  // Highlight lignée au survol
  const lineage = useMemo(() => {
    if (!hoverId) return null;
    return computeLineage(hoverId, people);
  }, [hoverId, people]);

  // Connexions SVG
  const connections = useMemo(
    () => buildConnections(people, positions, connStyle, layout, CARD_W, CARD_H),
    [people, positions, connStyle, layout]
  );

  const onCardDrag = useCallback((id, np) => {
    setPositions(prev => ({ ...prev, [id]: np }));
  }, [setPositions]);

  // Contrôles
  const fit = () => { setScale(0.85); setPan({ x: 60, y: 40 }); };
  const zoomIn = () => setScale(s => Math.min(2.5, s * 1.15));
  const zoomOut = () => setScale(s => Math.max(0.2, s / 1.15));
  const jumpTo = useCallback((wx, wy) => {
    const r = wrapRef.current?.getBoundingClientRect();
    if (!r) return;
    setPan({ x: r.width / 2 - wx * scale, y: r.height / 2 - wy * scale });
  }, [scale]);

  useEffect(() => {
    window.__focusOn = (id) => {
      const pos = positions[id];
      if (pos) {
        jumpTo(pos.x + CARD_W / 2, pos.y + CARD_H / 2);
      }
    };
    return () => {
      window.__focusOn = null;
    };
  }, [positions, jumpTo]);

  const maxGens = useMemo(() => {
    if (!people.length) return 4;
    return Math.max(...people.map(p => p.generation ?? p.gen ?? 1));
  }, [people]);

  const genOptions = [
    { value: 'all', label: 'Toutes' },
    ...Array.from({ length: maxGens }, (_, i) => ({ value: String(i + 1), label: `G${i + 1}` })),
  ];

  return (
    <div
      ref={wrapRef}
      className={[
        'canvas-wrap',
        panning ? 'panning' : '',
        tweaks.hideDates ? 'hide-dates' : '',
        tweaks.hidePlaces ? 'hide-places' : '',
        tweaks.hidePhotos ? 'hide-photos' : '',
      ].filter(Boolean).join(' ')}
      onPointerDown={onPointerDownBg}
    >
      {/* Barre d'outils */}
      <div className="canvas-toolbar">
        <div className="search">
          <SearchIcon />
          <input
            placeholder="Rechercher une personne…"
            value={searchQuery || ''}
            onChange={e => onSearchChange && onSearchChange(e.target.value)}
          />
          <span className="kbd">⌘K</span>
        </div>

        <div className="group">
          <Segmented
            value={genFilter}
            onChange={v => onSetTweak && onSetTweak('generation', v)}
            options={genOptions.slice(0, 6)}
          />
        </div>

        <div className="group">
          <Segmented
            value={layout}
            onChange={v => onSetTweak && onSetTweak('layout', v)}
            options={[
              { value: 'vertical', label: '↓' },
              { value: 'horizontal', label: '→' },
              { value: 'radial', label: '◎' },
            ]}
          />
        </div>

        <div style={{ flex: 1 }} />

        <button className="btn ghost icon" onClick={() => onOpenTweaks && onOpenTweaks()} title="Réglages">
          <SettingsIcon />
        </button>
        <button className="btn" onClick={() => onOpenShare && onOpenShare()}>
          <ShareIcon /> Partager
        </button>
        <button className="btn primary" onClick={() => onOpenAdd && onOpenAdd()}>
          <PlusIcon /> Ajouter
        </button>
      </div>

      {/* Canvas intérieur */}
      <div
        ref={innerRef}
        className="canvas-inner"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}
      >
        {/* Connexions SVG */}
        <svg
          className="connections"
          viewBox={`0 0 ${canvasW} ${canvasH}`}
          width={canvasW}
          height={canvasH}
          style={{ overflow: 'visible' }}
        >
          {connections.map((c, i) => {
            const dim = lineage && !c.ids.every(id => lineage.has(id));
            const hi = lineage && c.ids.every(id => lineage.has(id));
            const growing = !!growKey;
            const delay = growing ? (c.kind === 'spouse' ? 100 : 280 + (i % 8) * 60) : 0;
            return (
              <g key={`conn-group-${i}`}>
                <path
                  key={`${growKey || 0}-conn-${i}`}
                  className={[
                    'conn', c.kind,
                    dim ? 'dim' : '',
                    hi ? 'highlight' : '',
                    growing ? 'growing' : '',
                  ].filter(Boolean).join(' ')}
                  d={c.path}
                  style={{ '--len': 600, animationDelay: `${delay}ms` }}
                />
                {c.kind === 'spouse' && c.midX && c.midY && (
                  <g
                    className="union-node"
                    transform={`translate(${c.midX}, ${c.midY})`}
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenAdd && onOpenAdd(c.ids[0], 'child', c.ids[1]);
                    }}
                    title="Ajouter un enfant à cette union"
                  >
                    <circle r="9" fill="var(--accent)" stroke="var(--surface)" strokeWidth="1.5" />
                    <path d="M-3 0 H3 M0 -3 V3" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Cartes */}
        {people.map((p, i) => {
          const pos = positions[p.id];
          if (!pos) return null;
          const isFiltered = !filteredIds.has(p.id);
          const dim = (lineage && !lineage.has(p.id)) || isFiltered;
          const hi = lineage && lineage.has(p.id);
          const growing = !!growKey;
          const delay = growing ? ((p.generation ?? 1) - 1) * 200 + (i % 4) * 50 : 0;

          // Filtre recherche
          if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const name = `${p.given} ${p.sur}`.toLowerCase();
            if (!name.includes(q)) return null;
          }

          return (
            <PersonCard
              key={`${growKey || 0}-${p.id}`}
              person={p}
              pos={pos}
              scale={scale}
              cardStyle={cardStyle}
              density={density}
              selected={selectedId === p.id}
              dim={dim}
              highlight={hi}
              growing={growing}
              growDelay={delay}
              onSelect={onSelect}
              onDrag={onCardDrag}
              onHover={onHover}
            />
          );
        })}
      </div>

      {/* Contrôles zoom */}
      <div className="zoom-controls">
        <button onClick={zoomIn} title="Zoom avant">+</button>
        <div className="zoom-pct">{Math.round(scale * 100)}%</div>
        <button onClick={zoomOut} title="Zoom arrière">−</button>
        <button onClick={fit} title="Ajuster" style={{ borderTop: '1px solid var(--border)', fontSize: 11 }}>⤢</button>
      </div>

      {/* Minimap */}
      <Minimap
        people={people}
        positions={positions}
        scale={scale}
        pan={pan}
        vp={vp}
        onJump={jumpTo}
        canvasW={canvasW}
        canvasH={canvasH}
      />

      {/* Légende */}
      <div className="legend">
        <div className="row">
          <div className="swatch parent" />
          <span>Parent / Enfant</span>
        </div>
        <div className="row">
          <div className="swatch dashed" />
          <span>Conjoint·e</span>
        </div>
      </div>

      {/* Message si arbre vide */}
      {people.length === 0 && (
        <div style={{
          position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
          color: 'var(--text-3)', fontSize: 14, pointerEvents: 'none',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🌳</div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Arbre vide</div>
            <div>Cliquez sur <strong>+ Ajouter</strong> pour commencer</div>
          </div>
        </div>
      )}
    </div>
  );
}
