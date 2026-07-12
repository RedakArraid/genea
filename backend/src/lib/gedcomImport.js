const { parseGedcom } = require('./gedcom');
const prisma = require('./prisma');

const MONTH_MAP = {
  JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
  JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
};

function parseGedcomDate(value) {
  if (!value) return null;
  const parts = String(value).trim().split(/\s+/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = MONTH_MAP[parts[1]?.toUpperCase()];
    const year = parseInt(parts[2], 10);
    if (!Number.isNaN(day) && month != null && !Number.isNaN(year)) {
      return new Date(Date.UTC(year, month, day));
    }
  }
  const yearOnly = parseInt(parts[parts.length - 1], 10);
  if (!Number.isNaN(yearOnly) && yearOnly > 1000) {
    return new Date(Date.UTC(yearOnly, 0, 1));
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function mapSexFromGedcom(sex) {
  if (sex === 'M') return 'male';
  if (sex === 'F') return 'female';
  return 'other';
}

function parseNameLine(value) {
  const raw = String(value || '').trim();
  const slashMatch = raw.match(/^(.+?)\s*\/(.+?)\//);
  if (slashMatch) {
    return { firstName: slashMatch[1].trim(), lastName: slashMatch[2].trim() };
  }
  const parts = raw.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: '-' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function unescapeGedcom(value) {
  return String(value || '')
    .replace(/@@/g, '@')
    .replace(/\\n/g, '\n')
    .replace(/\\\\/g, '\\');
}

async function importGedcomIntoTree(treeId, gedcomText) {
  const parsed = parseGedcom(gedcomText);
  const xrefToId = new Map();

  const createdPersons = await prisma.$transaction(async (tx) => {
    const persons = [];
    for (const indi of parsed.individuals) {
      const { firstName, lastName } = parseNameLine(indi.name);
      const person = await tx.person.create({
        data: {
          treeId,
          firstName: firstName || 'Inconnu',
          lastName: lastName || '-',
          gender: mapSexFromGedcom(indi.sex),
          birthDate: parseGedcomDate(indi.birthDate),
          birthPlace: indi.birthPlace || null,
          deathDate: parseGedcomDate(indi.deathDate),
          occupation: indi.occupation || null,
          biography: indi.note || null,
        },
      });
      xrefToId.set(indi.xref, person.id);
      persons.push(person);
    }

    let relCount = 0;
    for (const fam of parsed.families) {
      const husb = fam.husb ? xrefToId.get(fam.husb) : null;
      const wife = fam.wife ? xrefToId.get(fam.wife) : null;
      if (husb && wife) {
        await tx.relationship.create({
          data: { type: 'spouse', sourceId: husb, targetId: wife },
        });
        relCount += 1;
      }
      for (const childXref of fam.children) {
        const childId = xrefToId.get(childXref);
        if (!childId) continue;
        for (const parentId of [husb, wife].filter(Boolean)) {
          await tx.relationship.create({
            data: { type: 'parent', sourceId: parentId, targetId: childId },
          });
          relCount += 1;
        }
      }
    }

    return { persons, relationships: relCount };
  });

  return {
    importedPersons: createdPersons.persons.length,
    importedRelationships: createdPersons.relationships,
    warnings: parsed.warnings,
  };
}

module.exports = { importGedcomIntoTree, parseGedcomDate, mapSexFromGedcom };
