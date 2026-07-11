/**
 * Générateur GEDCOM 5.5.1 (LINEAGE-LINKED) minimal pour GeneaIA.
 */

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function xrefPerson(id) {
  return `@${String(id).replace(/-/g, '')}@`;
}

function xrefFam(key) {
  return `@F${key}@`;
}

function escapeGedcom(value) {
  if (value == null || value === '') return '';
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '')
    .replace(/@/g, '@@');
}

function formatGedcomDate(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const day = d.getUTCDate();
  const month = MONTHS[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

function mapSex(gender) {
  if (gender === 'male') return 'M';
  if (gender === 'female') return 'F';
  return 'U';
}

function formatName(person) {
  const given = escapeGedcom(person.firstName || '');
  const surname = escapeGedcom(person.lastName || '');
  return `${given} /${surname}/`;
}

function pairKey(a, b) {
  return [a, b].sort().join('|');
}

function buildFamilies(persons, relationships) {
  const byId = new Map(persons.map((p) => [p.id, p]));
  const spousePairs = new Map();
  const childToParents = new Map();

  for (const rel of relationships) {
    if (rel.type === 'spouse') {
      spousePairs.set(pairKey(rel.sourceId, rel.targetId), [rel.sourceId, rel.targetId]);
    }
    if (rel.type === 'parent') {
      const parents = childToParents.get(rel.targetId) || new Set();
      parents.add(rel.sourceId);
      childToParents.set(rel.targetId, parents);
    }
    if (rel.type === 'child') {
      const parents = childToParents.get(rel.sourceId) || new Set();
      parents.add(rel.targetId);
      childToParents.set(rel.sourceId, parents);
    }
  }

  const families = [];
  const famByPair = new Map();
  const famBySingleParent = new Map();

  let famIndex = 1;

  const ensureFam = (parentIds) => {
    const sorted = [...parentIds].sort();
    if (sorted.length >= 2) {
      const key = pairKey(sorted[0], sorted[1]);
      if (famByPair.has(key)) return famByPair.get(key);
      const fam = { id: famIndex++, husb: null, wife: null, children: new Set() };
      const [p1, p2] = sorted;
      const g1 = byId.get(p1)?.gender;
      const g2 = byId.get(p2)?.gender;
      if (g1 === 'female' && g2 !== 'female') {
        fam.wife = p1;
        fam.husb = p2;
      } else if (g2 === 'female' && g1 !== 'female') {
        fam.wife = p2;
        fam.husb = p1;
      } else {
        fam.husb = p1;
        fam.wife = p2;
      }
      families.push(fam);
      famByPair.set(key, fam);
      return fam;
    }

    const single = sorted[0];
    if (famBySingleParent.has(single)) return famBySingleParent.get(single);
    const fam = { id: famIndex++, husb: null, wife: null, children: new Set(), singleParent: single };
    const g = byId.get(single)?.gender;
    if (g === 'female') fam.wife = single;
    else fam.husb = single;
    families.push(fam);
    famBySingleParent.set(single, fam);
    return fam;
  };

  for (const [, pair] of spousePairs) {
    ensureFam(pair);
  }

  for (const [childId, parentSet] of childToParents) {
    const parents = [...parentSet];
    const fam = parents.length ? ensureFam(parents) : null;
    if (fam) fam.children.add(childId);
  }

  return { families, childToParents };
}

function generateGedcom(tree, persons, relationships) {
  const lines = [];
  const push = (...parts) => lines.push(parts.join(' '));

  push('0', 'HEAD');
  push('1', 'SOUR', 'GeneaIA');
  push('2', 'NAME', 'GeneaIA');
  push('2', 'VERS', '1.0');
  push('1', 'GEDC');
  push('2', 'VERS', '5.5.1');
  push('2', 'FORM', 'LINEAGE-LINKED');
  push('1', 'CHAR', 'UTF-8');
  if (tree.name) {
    push('1', 'FILE', escapeGedcom(tree.name));
  }
  push('1', 'DATE', formatGedcomDate(new Date()));

  const { families } = buildFamilies(persons, relationships);
  const famXref = new Map();
  for (const fam of families) {
    famXref.set(fam.id, xrefFam(fam.id));
  }

  const childFam = new Map();
  const spouseFams = new Map();

  for (const fam of families) {
    for (const childId of fam.children) {
      childFam.set(childId, fam.id);
    }
    if (fam.husb) {
      const list = spouseFams.get(fam.husb) || [];
      list.push(fam.id);
      spouseFams.set(fam.husb, list);
    }
    if (fam.wife) {
      const list = spouseFams.get(fam.wife) || [];
      list.push(fam.id);
      spouseFams.set(fam.wife, list);
    }
  }

  for (const person of persons) {
    const px = xrefPerson(person.id);
    push('0', px, 'INDI');
    push('1', 'NAME', formatName(person));
    push('1', 'SEX', mapSex(person.gender));

    const birth = formatGedcomDate(person.birthDate);
    if (birth || person.birthPlace) {
      push('1', 'BIRT');
      if (birth) push('2', 'DATE', birth);
      if (person.birthPlace) push('2', 'PLAC', escapeGedcom(person.birthPlace));
    }

    const death = formatGedcomDate(person.deathDate);
    if (death) {
      push('1', 'DEAT');
      push('2', 'DATE', death);
    }

    if (person.occupation) {
      push('1', 'OCCU', escapeGedcom(person.occupation));
    }

    if (person.biography) {
      push('1', 'NOTE', escapeGedcom(person.biography));
    }

    if (person.photoUrl) {
      push('1', 'OBJE');
      push('2', 'FILE', escapeGedcom(person.photoUrl));
      push('2', 'FORM', 'URL');
    }

    const famc = childFam.get(person.id);
    if (famc != null) {
      push('1', 'FAMC', famXref.get(famc));
    }

    for (const famId of spouseFams.get(person.id) || []) {
      push('1', 'FAMS', famXref.get(famId));
    }
  }

  for (const fam of families) {
    push('0', famXref.get(fam.id), 'FAM');
    if (fam.husb) push('1', 'HUSB', xrefPerson(fam.husb));
    if (fam.wife) push('1', 'WIFE', xrefPerson(fam.wife));
    for (const childId of fam.children) {
      push('1', 'CHIL', xrefPerson(childId));
    }
  }

  if (tree.description) {
    push('0', '@SUBM1@', 'SUBM');
    push('1', 'NAME', escapeGedcom(tree.name || 'GeneaIA'));
    push('1', 'NOTE', escapeGedcom(tree.description));
  }

  push('0', 'TRLR');
  return `${lines.join('\n')}\n`;
}

/** Parse GEDCOM 5.5.1 minimal (INDI + FAM) */
function parseGedcom(text) {
  const lines = String(text || '').split(/\r?\n/);
  const records = [];
  let current = null;
  let currentLines = [];

  const flush = () => {
    if (current) records.push({ ...current, block: currentLines.join('\n') });
    current = null;
    currentLines = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line.trim()) continue;
    const match = line.match(/^(\d+)\s+(@[^@]+@)?\s*(\S+)?\s*(.*)?$/);
    if (!match) continue;
    const level = parseInt(match[1], 10);
    const xref = match[2] || null;
    const tag = match[3] || '';
    const value = (match[4] || '').trim();

    if (level === 0) {
      flush();
      if (xref && tag) current = { xref, type: tag };
      currentLines.push(line);
      continue;
    }

    if (current) currentLines.push(line);
  }
  flush();

  const individuals = [];
  const families = [];
  const warnings = [];

  for (const rec of records) {
    if (rec.type === 'INDI') {
      const block = rec.block;
      const name = (block.match(/^1 NAME (.+)$/m) || [])[1] || '';
      const sex = (block.match(/^1 SEX (\S+)/m) || [])[1] || 'U';
      const birt = block.match(/1 BIRT[\s\S]*?(?=^1 [A-Z]|^0 @|\Z)/m);
      const deat = block.match(/1 DEAT[\s\S]*?(?=^1 [A-Z]|^0 @|\Z)/m);
      individuals.push({
        xref: rec.xref,
        name,
        sex,
        birthDate: birt ? ((birt[0].match(/^2 DATE (.+)$/m) || [])[1] || null) : null,
        birthPlace: birt ? ((birt[0].match(/^2 PLAC (.+)$/m) || [])[1] || null) : null,
        deathDate: deat ? ((deat[0].match(/^2 DATE (.+)$/m) || [])[1] || null) : null,
        occupation: (block.match(/^1 OCCU (.+)$/m) || [])[1] || null,
        note: (block.match(/^1 NOTE (.+)$/m) || [])[1] || null,
      });
    }
    if (rec.type === 'FAM') {
      const block = rec.block;
      families.push({
        xref: rec.xref,
        husb: (block.match(/^1 HUSB (@[^@]+@)/m) || [])[1] || null,
        wife: (block.match(/^1 WIFE (@[^@]+@)/m) || [])[1] || null,
        children: [...block.matchAll(/^1 CHIL (@[^@]+@)/gm)].map((m) => m[1]),
      });
    }
  }

  if (!individuals.length) warnings.push('Aucun individu (INDI) trouvé dans le fichier');
  return { individuals, families, warnings };
}

module.exports = {
  generateGedcom,
  parseGedcom,
  formatGedcomDate,
  escapeGedcom,
};
