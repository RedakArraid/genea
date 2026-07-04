// @ts-nocheck
/**
 * layoutEngine.js
 * Calcule les positions {x, y} de chaque personne sur le canvas.
 * Supporte 3 dispositions : vertical, horizontal, radial.
 */

// Dimensions de carte par défaut (style square)
export const CARD_W = 120;
export const CARD_H = 150; // photo + meta
export const CARD_W_H = 180; // style horizontal
export const LINE_INSET = 0;

const ROW_ALIGN_RATIO = 0.45;

export function getCardDimensions(cardStyle = 'square') {
  switch (cardStyle) {
    case 'round':
      return { w: 90, h: 90 };
    case 'minimal':
      return { w: 120, h: 72 };
    default:
      return { w: CARD_W, h: CARD_H };
  }
}

const H_GAP_SPACIOUS = 40;
const H_GAP_COMPACT = 20;
const V_GAP_SPACIOUS = 100;
const V_GAP_COMPACT = 50;
const BRANCH_GAP_RATIO = 2;

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
 * Ordonne une ligne de génération pour placer les conjoints côte à côte.
 */
function orderRowWithSpouses(row) {
  const ordered = [];
  const visited = new Set();
  
  row.forEach(p => {
    if (visited.has(p.id)) return;
    
    ordered.push(p);
    visited.add(p.id);
    
    const spouseIds = p.spouseIds || [];
    spouseIds.forEach(sId => {
      const spouse = row.find(r => r.id === sId);
      if (spouse && !visited.has(sId)) {
        ordered.push(spouse);
        visited.add(sId);
      }
    });
  });
  
  return ordered;
}

/**
 * Disposition verticale par unités familiales — chaque branche sous ses parents.
 */
function computeVerticalPedigree(people, density = 'spacious') {
  const hGap = density === 'compact' ? H_GAP_COMPACT : H_GAP_SPACIOUS;
  const vGap = density === 'compact' ? V_GAP_COMPACT : V_GAP_SPACIOUS;
  const branchGap = hGap * BRANCH_GAP_RATIO;
  const cardW = CARD_W;
  const cardH = CARD_H;
  const byId = Object.fromEntries(people.map((p) => [p.id, p]));
  const positions = {};
  const placed = new Set();

  function primarySpouse(p) {
    if (!p?.spouseIds?.length) return null;
    for (const sId of p.spouseIds) {
      const s = byId[sId];
      if (s && s.generation === p.generation) return s;
    }
    return byId[p.spouseIds[0]] || null;
  }

  function directChildren(p, spouse) {
    const out = [];
    for (const c of people) {
      if (!c.parentIds.includes(p.id)) continue;
      if (spouse && !c.parentIds.includes(spouse.id)) continue;
      out.push(c.id);
    }
    return out.sort();
  }

  function coupleWidth(spouse) {
    return spouse ? 2 * cardW + hGap : cardW;
  }

  function placeCouple(p, spouse, centerX, y) {
    const w = coupleWidth(spouse);
    const leftX = centerX - w / 2;
    positions[p.id] = { x: leftX, y };
    placed.add(p.id);
    if (spouse) {
      positions[spouse.id] = { x: leftX + cardW + hGap, y };
      placed.add(spouse.id);
    }
    return w;
  }

  function orderedChildren(p, spouse) {
    return directChildren(p, spouse).sort((a, b) => measureBranch(b) - measureBranch(a));
  }

  function measureBranch(personId) {
    const p = byId[personId];
    if (!p) return cardW;
    const spouse = primarySpouse(p);
    const children = orderedChildren(p, spouse);

    if (children.length === 0) return coupleWidth(spouse);

    const hasNested = children.some((cid) => {
      const c = byId[cid];
      const cs = primarySpouse(c);
      return directChildren(c, cs).length > 0;
    });

    if (!hasNested) {
      let rowW = 0;
      for (let i = 0; i < children.length; i++) {
        const c = byId[children[i]];
        const cs = primarySpouse(c);
        rowW += coupleWidth(cs) + (i < children.length - 1 ? branchGap : 0);
      }
      return Math.max(coupleWidth(spouse), rowW);
    }

    let total = 0;
    for (let i = 0; i < children.length; i++) {
      total += measureBranch(children[i]) + (i < children.length - 1 ? branchGap : 0);
    }
    return Math.max(coupleWidth(spouse), total);
  }

  function assignBranch(personId, leftX, y) {
    const p = byId[personId];
    if (!p || placed.has(personId)) return 0;
    const spouse = primarySpouse(p);

    const children = orderedChildren(p, spouse);
    const childY = y + cardH + vGap;

    if (children.length === 0) {
      const w = coupleWidth(spouse);
      placeCouple(p, spouse, leftX + w / 2, y);
      return w;
    }

    const hasNested = children.some((cid) => {
      const c = byId[cid];
      const cs = primarySpouse(c);
      return directChildren(c, cs).length > 0;
    });

    if (!hasNested) {
      let cx = leftX;
      for (let i = 0; i < children.length; i++) {
        const c = byId[children[i]];
        const cs = primarySpouse(c);
        const unitW = coupleWidth(cs);
        if (cs) {
          placeCouple(c, cs, cx + unitW / 2, childY);
        } else {
          positions[c.id] = { x: cx, y: childY };
          placed.add(c.id);
        }
        cx += unitW + (i < children.length - 1 ? branchGap : 0);
      }
      const rowW = cx - leftX - (children.length > 1 ? branchGap : 0);
      const totalW = Math.max(rowW, coupleWidth(spouse));
      placeCouple(p, spouse, leftX + totalW / 2, y);
      return totalW;
    }

    let cx = leftX;
    const branchWidths = [];
    for (let i = 0; i < children.length; i++) {
      const w = measureBranch(children[i]);
      assignBranch(children[i], cx, childY);
      branchWidths.push(w);
      cx += w + (i < children.length - 1 ? branchGap : 0);
    }
    const totalW = cx - leftX - (children.length > 1 ? branchGap : 0);
    placeCouple(p, spouse, leftX + totalW / 2, y);
    return Math.max(totalW, coupleWidth(spouse));
  }

  const minGen = Math.min(...people.map((p) => p.generation));
  const roots = people.filter(
    (p) =>
      p.generation === minGen &&
      (!p.parentIds.length || !p.parentIds.some((pid) => byId[pid]))
  );

  const seenRoots = new Set();
  let x = 40;
  for (const root of roots) {
    if (seenRoots.has(root.id)) continue;
    const spouse = primarySpouse(root);
    if (spouse) {
      seenRoots.add(root.id);
      seenRoots.add(spouse.id);
    } else {
      seenRoots.add(root.id);
    }
    const w = assignBranch(root.id, x, 40);
    x += w + branchGap * 2;
  }

  // Nœuds isolés / non placés — fallback par génération
  const byGen = groupByGeneration(people.filter((p) => !placed.has(p.id)));
  let fallbackY =
    Object.values(positions).reduce((max, pos) => Math.max(max, pos.y), 40) + cardH + vGap;
  for (const g of Array.from(byGen.keys()).sort((a, b) => a - b)) {
    const row = orderRowWithSpouses(byGen.get(g));
    let rx = 40;
    for (const p of row) {
      if (placed.has(p.id)) continue;
      positions[p.id] = { x: rx, y: fallbackY };
      placed.add(p.id);
      rx += cardW + hGap;
    }
    if (rx > 40) fallbackY += cardH + vGap;
  }

  const allPos = Object.values(positions);
  if (allPos.length === 0) return { positions: {}, canvasW: 800, canvasH: 600 };

  const maxX = Math.max(...allPos.map((pos) => pos.x)) + cardW + 40;
  const maxY = Math.max(...allPos.map((pos) => pos.y)) + cardH + 40;
  return { positions, canvasW: maxX, canvasH: maxY };
}

/**
 * Disposition verticale (haut → bas) — délègue au moteur pedigree.
 */
function computeVertical(people, density = 'spacious') {
  return computeVerticalPedigree(people, density);
}

/**
 * Disposition horizontale (gauche → droite) — transpose le pedigree vertical.
 * Conjoint·es empilé·es verticalement, descendants vers la droite.
 */
function computeHorizontal(people, density = 'spacious') {
  const { positions, canvasW, canvasH } = computeVerticalPedigree(people, density);
  const swapped = {};
  for (const [id, pos] of Object.entries(positions)) {
    swapped[id] = { x: pos.y, y: pos.x };
  }
  return { positions: swapped, canvasW: canvasH, canvasH: canvasW };
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
function cardPoint(pos, side, cardW, cardH, inset = LINE_INSET) {
  switch (side) {
    case 'top':
      return { x: pos.x + cardW / 2, y: pos.y + inset };
    case 'bottom':
      return { x: pos.x + cardW / 2, y: pos.y + cardH - inset };
    case 'left':
      return { x: pos.x + inset, y: pos.y + cardH / 2 };
    case 'right':
      return { x: pos.x + cardW - inset, y: pos.y + cardH / 2 };
    default:
      return { x: pos.x + cardW / 2, y: pos.y + cardH / 2 };
  }
}

/** Point d'attache sur le bord de la carte le plus proche de la cible. */
function cardPointToward(pos, target, cardW, cardH, inset = LINE_INSET) {
  const cx = pos.x + cardW / 2;
  const cy = pos.y + cardH / 2;
  const dx = target.x - cx;
  const dy = target.y - cy;
  if (Math.abs(dx) * cardH > Math.abs(dy) * cardW) {
    return dx > 0
      ? { x: pos.x + cardW - inset, y: cy }
      : { x: pos.x + inset, y: cy };
  }
  return dy > 0
    ? { x: cx, y: pos.y + cardH - inset }
    : { x: cx, y: pos.y + inset };
}

function spousesShareRow(a, b, personA, personB, cardH) {
  if (personA?.generation != null && personA.generation === personB?.generation) return true;
  return Math.abs(a.y - b.y) < cardH * ROW_ALIGN_RATIO;
}

function spousesShareCol(a, b, personA, personB, cardW) {
  if (personA?.generation != null && personA.generation === personB?.generation) return true;
  return Math.abs(a.x - b.x) < cardW * ROW_ALIGN_RATIO;
}

function coupleLineCenter(pa, pb, cardW, cardH, layout) {
  if (layout === 'horizontal') {
    const [top, bottom] = orderByY(pa, pb);
    if (spousesShareCol(pa, pb, null, null, cardW)) {
      const from = cardPoint(top, 'bottom', cardW, cardH);
      const to = cardPoint(bottom, 'top', cardW, cardH);
      return { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
    }
    const rightX = Math.max(top.x + cardW, bottom.x + cardW);
    return { x: rightX, y: (top.y + cardH + bottom.y) / 2 };
  }
  const [left, right] = orderByX(pa, pb);
  if (spousesShareRow(pa, pb, null, null, cardH)) {
    const from = cardPoint(left, 'right', cardW, cardH);
    const to = cardPoint(right, 'left', cardW, cardH);
    return { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
  }
  const bottomY = Math.max(left.y + cardH, right.y + cardH);
  return { x: (left.x + cardW + right.x) / 2, y: bottomY };
}

function coupleUnionCenter(pa, pb, cardW, cardH, layout) {
  return coupleLineCenter(pa, pb, cardW, cardH, layout);
}

function coupleRightAnchor(pa, pb, cardW, cardH, layout = 'horizontal') {
  return coupleLineCenter(pa, pb, cardW, cardH, layout);
}

function orderByX(a, b) {
  return a.x < b.x ? [a, b] : [b, a];
}

function orderByY(a, b) {
  return a.y < b.y ? [a, b] : [b, a];
}

export function buildConnections(people, positions, connStyle = 'elbow', layout = 'vertical', cardW = CARD_W, cardH = CARD_H) {
  const out = [];
  const byId = Object.fromEntries(people.map(p => [p.id, p]));

  // Connexions conjoint·e (déduplication)
  const done = new Set();
  people.forEach(p => {
    const spouseIds = p.spouseIds || [];
    spouseIds.forEach(sId => {
      const key = [p.id, sId].sort().join('::');
      if (done.has(key)) return;
      done.add(key);
      const a = positions[p.id];
      const b = positions[sId];
      if (!a || !b) return;

      const personA = byId[p.id];
      const personB = byId[sId];
      const sameRow = layout !== 'horizontal' && spousesShareRow(a, b, personA, personB, cardH);
      const sameCol = layout === 'horizontal' && spousesShareCol(a, b, personA, personB, cardW);
      let from;
      let to;

      if (sameRow) {
        const [left, right] = orderByX(a, b);
        from = cardPoint(left, 'right', cardW, cardH);
        to = cardPoint(right, 'left', cardW, cardH);
      } else if (sameCol) {
        const [top, bottom] = orderByY(a, b);
        from = cardPoint(top, 'bottom', cardW, cardH);
        to = cardPoint(bottom, 'top', cardW, cardH);
      } else {
        from = cardPoint(a, 'bottom', cardW, cardH);
        to = cardPoint(b, 'top', cardW, cardH);
      }

      const path = `M ${from.x} ${from.y} L ${to.x} ${to.y}`;

      out.push({
        kind: 'spouse',
        path,
        ids: [p.id, sId],
        midX: (from.x + to.x) / 2,
        midY: (from.y + to.y) / 2,
      });
    });
  });

  // Connexions parent-enfant — barre de fratrie partagée pour éviter les croisements
  const childGroups = new Map();
  people.forEach((p) => {
    const parentIds = p.parentIds || [];
    if (!parentIds.length || !positions[p.id]) return;
    const key = [...parentIds].sort().join('::');
    if (!childGroups.has(key)) childGroups.set(key, []);
    childGroups.get(key).push(p.id);
  });

  childGroups.forEach((childIds, parentKey) => {
    const parentIds = parentKey.split('::');
    const sortedChildren = [...childIds].sort((a, b) => {
      const ax = positions[a]?.x ?? 0;
      const bx = positions[b]?.x ?? 0;
      return ax - bx;
    });

    let anchor;
    if (parentIds.length >= 2 && positions[parentIds[0]] && positions[parentIds[1]]) {
      const pa = positions[parentIds[0]];
      const pb = positions[parentIds[1]];
      anchor = layout === 'horizontal'
        ? coupleRightAnchor(pa, pb, cardW, cardH, layout)
        : coupleUnionCenter(pa, pb, cardW, cardH, layout);
    } else if (positions[parentIds[0]]) {
      const parentPos = positions[parentIds[0]];
      anchor = layout === 'horizontal'
        ? cardPoint(parentPos, 'right', cardW, cardH)
        : layout === 'radial'
          ? cardPointToward(parentPos, positions[sortedChildren[0]], cardW, cardH)
          : cardPoint(parentPos, 'bottom', cardW, cardH);
    } else {
      return;
    }

    const childAnchors = sortedChildren.map((cid) => {
      const cpos = positions[cid];
      if (!cpos) return null;
      if (layout === 'radial') return cardPointToward(cpos, anchor, cardW, cardH);
      if (layout === 'horizontal') return cardPoint(cpos, 'left', cardW, cardH);
      return cardPoint(cpos, 'top', cardW, cardH);
    }).filter(Boolean);

    if (childAnchors.length === 0) return;

    const parentBottom = layout === 'horizontal'
      ? Math.max(...parentIds.map((id) => (positions[id] ? positions[id].x + cardW : anchor.x)), anchor.x)
      : Math.max(...parentIds.map((id) => (positions[id] ? positions[id].y + cardH : anchor.y)), anchor.y);

    const childEdge = layout === 'horizontal'
      ? Math.min(...childAnchors.map((c) => c.x))
      : Math.min(...childAnchors.map((c) => c.y));

    const gutter = childEdge - parentBottom;
    const mid = layout === 'horizontal'
      ? parentBottom + Math.max(16, gutter / 2)
      : parentBottom + Math.max(20, gutter / 2);

    if (sortedChildren.length === 1) {
      const childAnchor = childAnchors[0];
      let path;
      if (connStyle === 'straight' || layout === 'radial') {
        path = `M ${anchor.x} ${anchor.y} L ${childAnchor.x} ${childAnchor.y}`;
      } else if (connStyle === 'curve') {
        if (layout === 'horizontal') {
          const dx = (childAnchor.x - anchor.x) * 0.5;
          path = `M ${anchor.x} ${anchor.y} C ${anchor.x + dx} ${anchor.y}, ${childAnchor.x - dx} ${childAnchor.y}, ${childAnchor.x} ${childAnchor.y}`;
        } else {
          const dy = (childAnchor.y - anchor.y) * 0.5;
          path = `M ${anchor.x} ${anchor.y} C ${anchor.x} ${anchor.y + dy}, ${childAnchor.x} ${childAnchor.y - dy}, ${childAnchor.x} ${childAnchor.y}`;
        }
      } else if (layout === 'horizontal') {
        path = `M ${anchor.x} ${anchor.y} L ${mid} ${anchor.y} L ${mid} ${childAnchor.y} L ${childAnchor.x} ${childAnchor.y}`;
      } else {
        path = `M ${anchor.x} ${anchor.y} L ${anchor.x} ${mid} L ${childAnchor.x} ${mid} L ${childAnchor.x} ${childAnchor.y}`;
      }
      out.push({ kind: 'child', path, ids: [...parentIds, sortedChildren[0]], childId: sortedChildren[0], parentIds });
      return;
    }

    // Barre de fratrie : une verticale depuis le couple, horizontale, puis descentes
    const leftX = Math.min(...childAnchors.map((c) => c.x));
    const rightX = Math.max(...childAnchors.map((c) => c.x));

    if (layout === 'horizontal') {
      out.push({
        kind: 'child',
        path: `M ${anchor.x} ${anchor.y} L ${mid} ${anchor.y} L ${mid} ${childAnchors[0].y}`,
        ids: [...parentIds, ...sortedChildren],
        parentIds,
      });
      childAnchors.forEach((ca, i) => {
        out.push({
          kind: 'child',
          path: `M ${mid} ${ca.y} L ${ca.x} ${ca.y}`,
          ids: [...parentIds, sortedChildren[i]],
          childId: sortedChildren[i],
          parentIds,
        });
      });
    } else {
      // Tronc vertical + barre horizontale dans l'espace inter-génération
      out.push({
        kind: 'child',
        path: `M ${anchor.x} ${anchor.y} L ${anchor.x} ${mid} L ${leftX} ${mid} L ${rightX} ${mid}`,
        ids: [...parentIds, ...sortedChildren],
        parentIds,
      });
      childAnchors.forEach((ca, i) => {
        out.push({
          kind: 'child',
          path: `M ${ca.x} ${mid} L ${ca.x} ${ca.y}`,
          ids: [...parentIds, sortedChildren[i]],
          childId: sortedChildren[i],
          parentIds,
        });
      });
    }
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
  // 1. Première passe : normaliser les informations de base et extraire les relations dédoublées
  const people = apiPersons.map(p => {
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
      birthDate: p.birthDate || null,
      deathDate: p.deathDate || null,
      place: p.birthPlace || p.place || '',
      bio: { fr: p.biography || '', en: p.biography || '' },
      generation: 1, // Calculé dynamiquement ci-dessous
      tone,
      parentIds: Array.from(new Set(parentIds)),
      spouseIds: Array.from(new Set(spouseIds)),
      photoUrl: p.photoUrl || null,
      isAlive: !p.deathDate,
    };
  });

  // 2. Deuxième passe : calcul dynamique des générations par propagation BFS
  const peopleMap = Object.fromEntries(people.map(p => [p.id, p]));
  const visited = new Set();
  const generations = {};

  people.forEach(startPerson => {
    if (visited.has(startPerson.id)) return;

    const queue = [{ id: startPerson.id, gen: 1 }];
    visited.add(startPerson.id);

    while (queue.length > 0) {
      const { id, gen } = queue.shift();
      generations[id] = gen;

      const p = peopleMap[id];
      if (!p) continue;

      // Conjoints = même génération
      p.spouseIds.forEach(sId => {
        if (!visited.has(sId)) {
          visited.add(sId);
          queue.push({ id: sId, gen });
        }
      });

      // Enfants = parent.generation + 1
      const children = people.filter(c => c.parentIds.includes(id));
      children.forEach(c => {
        if (!visited.has(c.id)) {
          visited.add(c.id);
          queue.push({ id: c.id, gen: gen + 1 });
        }
      });

      // Parents = enfant.generation - 1
      p.parentIds.forEach(pId => {
        if (!visited.has(pId)) {
          visited.add(pId);
          queue.push({ id: pId, gen: gen - 1 });
        }
      });
    }
  });

  // Shift global pour que le min commence à 1
  const genValues = Object.values(generations);
  if (genValues.length > 0) {
    const minGen = Math.min(...genValues);
    const shift = 1 - minGen;
    people.forEach(p => {
      p.generation = (generations[p.id] || 1) + shift;
    });
  }

  return people;
}

// Tons cycliques basés sur l'ID
const TONES = ['ocean', 'plum', 'rose', 'sage', 'amber', 'stone'];
function pickTone(id) {
  if (!id) return 'stone';
  const hash = String(id).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return TONES[hash % TONES.length];
}
