/**
 * layoutEngine.js
 * Calcule les positions {x, y} de chaque personne sur le canvas.
 * Supporte 3 dispositions : vertical, horizontal, radial.
 */

// Dimensions de carte par défaut (style square)
export const CARD_W = 120;
export const CARD_H = 150; // photo + meta
export const CARD_W_H = 180; // style horizontal

const H_GAP_SPACIOUS = 40;
const H_GAP_COMPACT = 20;
const V_GAP_SPACIOUS = 80;
const V_GAP_COMPACT = 40;

/**
 * Groupe les personnes par génération.
 * @param {Array} people - liste de personnes avec champ `generation` (int)
 * @returns {Map<number, Array>} - map génération → personnes
 */
function groupByGeneration(people) {
  const map = new Map();
  for (const p of people) {
    const g = p.generation ?? 1;
    if (!map.has(g)) map.set(g, []);
    map.get(g).push(p);
  }
  return map;
}

/**
 * Disposition verticale (haut → bas)
 * Génération 1 en haut, descendants vers le bas.
 */
function computeVertical(people, density = 'spacious') {
  const hGap = density === 'compact' ? H_GAP_COMPACT : H_GAP_SPACIOUS;
  const vGap = density === 'compact' ? V_GAP_COMPACT : V_GAP_SPACIOUS;
  const cardW = CARD_W;
  const cardH = CARD_H;

  const byGen = groupByGeneration(people);
  const gens = Array.from(byGen.keys()).sort((a, b) => a - b);

  const positions = {};
  let maxRowWidth = 0;

  // Calculer d'abord la largeur max pour centrer
  for (const g of gens) {
    const row = byGen.get(g);
    const rowW = row.length * cardW + (row.length - 1) * hGap;
    if (rowW > maxRowWidth) maxRowWidth = rowW;
  }

  let y = 40;
  for (const g of gens) {
    const row = byGen.get(g);
    const rowW = row.length * cardW + (row.length - 1) * hGap;
    const startX = (maxRowWidth - rowW) / 2 + 40;

    row.forEach((p, i) => {
      positions[p.id] = {
        x: startX + i * (cardW + hGap),
        y,
      };
    });

    y += cardH + vGap;
  }

  return { positions, canvasW: maxRowWidth + 80, canvasH: y };
}

/**
 * Disposition horizontale (gauche → droite)
 * Génération 1 à gauche, descendants vers la droite.
 */
function computeHorizontal(people, density = 'spacious') {
  const hGap = density === 'compact' ? H_GAP_COMPACT : H_GAP_SPACIOUS;
  const vGap = density === 'compact' ? V_GAP_COMPACT : V_GAP_SPACIOUS;
  const cardW = CARD_W;
  const cardH = CARD_H;

  const byGen = groupByGeneration(people);
  const gens = Array.from(byGen.keys()).sort((a, b) => a - b);

  const positions = {};
  let maxColHeight = 0;

  for (const g of gens) {
    const col = byGen.get(g);
    const colH = col.length * cardH + (col.length - 1) * hGap;
    if (colH > maxColHeight) maxColHeight = colH;
  }

  let x = 40;
  for (const g of gens) {
    const col = byGen.get(g);
    const colH = col.length * cardH + (col.length - 1) * hGap;
    const startY = (maxColHeight - colH) / 2 + 40;

    col.forEach((p, i) => {
      positions[p.id] = {
        x,
        y: startY + i * (cardH + hGap),
      };
    });

    x += cardW + vGap;
  }

  return { positions, canvasW: x, canvasH: maxColHeight + 80 };
}

/**
 * Disposition radiale (générations en anneaux)
 * G1 au centre, G2 en anneau autour, etc.
 */
function computeRadial(people, density = 'spacious') {
  const cardW = CARD_W;
  const cardH = CARD_H;
  const radiusStep = density === 'compact' ? 200 : 280;

  const byGen = groupByGeneration(people);
  const gens = Array.from(byGen.keys()).sort((a, b) => a - b);

  const positions = {};
  const cx = 600;
  const cy = 500;

  for (const [idx, g] of gens.entries()) {
    const row = byGen.get(g);
    if (idx === 0) {
      // Centre — G1
      row.forEach((p, i) => {
        positions[p.id] = {
          x: cx - cardW / 2 + (row.length > 1 ? (i - (row.length - 1) / 2) * (cardW + 20) : 0),
          y: cy - cardH / 2,
        };
      });
    } else {
      const radius = idx * radiusStep;
      const angleStep = (2 * Math.PI) / row.length;
      const startAngle = -Math.PI / 2; // commence en haut

      row.forEach((p, i) => {
        const angle = startAngle + i * angleStep;
        positions[p.id] = {
          x: cx + radius * Math.cos(angle) - cardW / 2,
          y: cy + radius * Math.sin(angle) - cardH / 2,
        };
      });
    }
  }

  const canvasSize = gens.length * radiusStep * 2 + 300;
  return { positions, canvasW: canvasSize, canvasH: canvasSize };
}

/**
 * Point d'entrée principal.
 * @param {Array} people - tableau de personnes (doit avoir `id` et `generation`)
 * @param {'vertical'|'horizontal'|'radial'} layout
 * @param {'compact'|'spacious'} density
 * @returns {{ positions: Object, canvasW: number, canvasH: number }}
 */
export function computeLayout(people, layout = 'vertical', density = 'spacious') {
  if (!people || people.length === 0) {
    return { positions: {}, canvasW: 800, canvasH: 600 };
  }

  switch (layout) {
    case 'horizontal':
      return computeHorizontal(people, density);
    case 'radial':
      return computeRadial(people, density);
    case 'vertical':
    default:
      return computeVertical(people, density);
  }
}

/**
 * Construit les chemins SVG des connexions entre personnes.
 * @param {Array} people
 * @param {Object} positions - { [id]: {x, y} }
 * @param {string} connStyle - 'elbow' | 'curve' | 'straight'
 * @param {string} layout - 'vertical' | 'horizontal' | 'radial'
 * @param {number} cardW
 * @param {number} cardH
 * @returns {Array} connexions
 */
export function buildConnections(people, positions, connStyle = 'elbow', layout = 'vertical', cardW = CARD_W, cardH = CARD_H) {
  const out = [];
  const byId = Object.fromEntries(people.map(p => [p.id, p]));

  // Connexions conjoint·e (déduplication)
  const done = new Set();
  people.forEach(p => {
    const spouseIds = p.spouseIds || [];
    spouseIds.forEach(sId => {
      const key = [p.id, sId].sort().join('-');
      if (done.has(key)) return;
      done.add(key);
      const a = positions[p.id];
      const b = positions[sId];
      if (!a || !b) return;

      const sameRow = Math.abs(a.y - b.y) < 30;
      let path;
      if (sameRow) {
        const y = (a.y + b.y) / 2 + cardH / 2;
        const x1 = Math.min(a.x, b.x) + (a.x < b.x ? cardW : 0);
        const x2 = Math.max(a.x, b.x) + (a.x < b.x ? 0 : cardW);
        path = `M ${x1} ${y} L ${x2} ${y}`;
      } else {
        path = `M ${a.x + cardW / 2} ${a.y + cardH / 2} L ${b.x + cardW / 2} ${b.y + cardH / 2}`;
      }

      out.push({
        kind: 'spouse',
        path,
        ids: [p.id, sId],
        midX: (a.x + b.x) / 2 + cardW / 2,
        midY: (a.y + b.y) / 2 + cardH / 2,
      });
    });
  });

  // Connexions parent-enfant
  people.forEach(p => {
    const parentIds = p.parentIds || [];
    if (!parentIds.length) return;
    const cpos = positions[p.id];
    if (!cpos) return;

    let anchor;
    if (parentIds.length >= 2 && positions[parentIds[0]] && positions[parentIds[1]]) {
      const a = positions[parentIds[0]];
      const b = positions[parentIds[1]];
      anchor = { x: (a.x + b.x) / 2 + cardW / 2, y: Math.max(a.y, b.y) + cardH };
    } else if (positions[parentIds[0]]) {
      const a = positions[parentIds[0]];
      anchor = {
        x: a.x + cardW / 2,
        y: layout === 'horizontal' ? a.y + cardH / 2 : a.y + cardH,
      };
    } else {
      return;
    }

    const childAnchor = layout === 'horizontal'
      ? { x: cpos.x, y: cpos.y + cardH / 2 }
      : { x: cpos.x + cardW / 2, y: cpos.y };

    let path;
    if (connStyle === 'straight') {
      path = `M ${anchor.x} ${anchor.y} L ${childAnchor.x} ${childAnchor.y}`;
    } else if (connStyle === 'curve') {
      if (layout === 'horizontal') {
        const dx = (childAnchor.x - anchor.x) * 0.5;
        path = `M ${anchor.x} ${anchor.y} C ${anchor.x + dx} ${anchor.y}, ${childAnchor.x - dx} ${childAnchor.y}, ${childAnchor.x} ${childAnchor.y}`;
      } else {
        const dy = (childAnchor.y - anchor.y) * 0.5;
        path = `M ${anchor.x} ${anchor.y} C ${anchor.x} ${anchor.y + dy}, ${childAnchor.x} ${childAnchor.y - dy}, ${childAnchor.x} ${childAnchor.y}`;
      }
    } else {
      // Équerre (défaut)
      if (layout === 'horizontal') {
        const midX = (anchor.x + childAnchor.x) / 2;
        path = `M ${anchor.x} ${anchor.y} L ${midX} ${anchor.y} L ${midX} ${childAnchor.y} L ${childAnchor.x} ${childAnchor.y}`;
      } else if (layout === 'radial') {
        path = `M ${anchor.x} ${anchor.y} L ${childAnchor.x} ${childAnchor.y}`;
      } else {
        const midY = (anchor.y + childAnchor.y) / 2;
        path = `M ${anchor.x} ${anchor.y} L ${anchor.x} ${midY} L ${childAnchor.x} ${midY} L ${childAnchor.x} ${childAnchor.y}`;
      }
    }

    out.push({
      kind: 'child',
      path,
      ids: [...parentIds, p.id],
      childId: p.id,
      parentIds,
    });
  });

  return out;
}

/**
 * Calcule l'ensemble des IDs liés à une personne (lignée complète + conjoints).
 * Utilisé pour le highlight au survol.
 */
export function computeLineage(rootId, people) {
  const byId = Object.fromEntries(people.map(p => [p.id, p]));
  const set = new Set([rootId]);

  // Remonter vers les ancêtres
  const queueUp = [rootId];
  while (queueUp.length) {
    const id = queueUp.shift();
    const p = byId[id];
    if (!p) continue;
    (p.parentIds || []).forEach(pp => {
      if (!set.has(pp)) { set.add(pp); queueUp.push(pp); }
    });
  }

  // Descendre vers les descendants
  const queueDown = [rootId];
  while (queueDown.length) {
    const id = queueDown.shift();
    people.forEach(q => {
      if ((q.parentIds || []).includes(id) && !set.has(q.id)) {
        set.add(q.id);
        queueDown.push(q.id);
      }
    });
  }

  // Ajouter les conjoints de toute la lignée
  Array.from(set).forEach(id => {
    const p = byId[id];
    if (!p) return;
    (p.spouseIds || []).forEach(s => set.add(s));
  });

  return set;
}

/**
 * Convertit une personne de l'API backend vers le format interne du canvas.
 * L'API retourne : { id, firstName, lastName, birthDate, deathDate, birthPlace, generation, ... }
 */
export function normalizePersons(apiPersons, apiRelationships = []) {
  return apiPersons.map(p => {
    const tone = pickTone(p.id);
    const birthYear = p.birthDate ? new Date(p.birthDate).getFullYear() : null;
    const deathYear = p.deathDate ? new Date(p.deathDate).getFullYear() : null;

    // Extraire les relations
    let parentIds = [];
    let spouseIds = [];

    if (p.relations) {
      parentIds = p.relations
        .filter(r => r.relationType === 'CHILD_OF' || r.relationType === 'child')
        .map(r => r.relatedPersonId || r.personBId || r.targetId)
        .filter(Boolean);

      spouseIds = p.relations
        .filter(r => r.relationType === 'SPOUSE_OF' || r.relationType === 'spouse')
        .map(r => {
          const id = r.personAId === p.id ? r.personBId : r.personAId;
          return id || r.relatedPersonId;
        })
        .filter(Boolean);
    } else if (apiRelationships && apiRelationships.length > 0) {
      apiRelationships.forEach(r => {
        if (r.type === 'parent') {
          if (r.targetId === p.id) {
            parentIds.push(r.sourceId);
          }
        } else if (r.type === 'child') {
          if (r.sourceId === p.id) {
            parentIds.push(r.targetId);
          }
        } else if (r.type === 'spouse') {
          if (r.sourceId === p.id) {
            spouseIds.push(r.targetId);
          } else if (r.targetId === p.id) {
            spouseIds.push(r.sourceId);
          }
        }
      });
    }

    return {
      id: p.id,
      given: p.firstName || p.given || '?',
      sur: p.lastName || p.sur || '—',
      born: birthYear,
      died: deathYear,
      place: p.birthPlace || p.place || '',
      bio: { fr: p.biography || '', en: p.biography || '' },
      generation: p.generation ?? p.gen ?? 1,
      tone,
      parentIds,
      spouseIds,
      photoUrl: p.photoUrl || null,
      isAlive: !p.deathDate,
    };
  });
}

// Tons cycliques basés sur l'ID
const TONES = ['ocean', 'plum', 'rose', 'sage', 'amber', 'stone'];
function pickTone(id) {
  if (!id) return 'stone';
  const hash = String(id).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return TONES[hash % TONES.length];
}
