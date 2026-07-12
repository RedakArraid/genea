const { normalizeName, birthYear, normalizePlace, levenshtein } = require('./normalize');

function scorePersonPair(a, b) {
  let score = 0;

  const lastA = normalizeName(a.lastName);
  const lastB = normalizeName(b.lastName);
  if (lastA && lastB && lastA === lastB) score += 35;

  const firstA = normalizeName(a.firstName);
  const firstB = normalizeName(b.firstName);
  if (firstA && firstB) {
    if (firstA === firstB) score += 25;
    else if (levenshtein(firstA, firstB) <= 2) score += 15;
  }

  const yearA = birthYear(a.birthDate);
  const yearB = birthYear(b.birthDate);
  if (yearA && yearB) {
    if (yearA === yearB) score += 25;
    else if (Math.abs(yearA - yearB) <= 2) score += 12;
  }

  const placesA = normalizePlace(a.birthPlace);
  const placesB = normalizePlace(b.birthPlace);
  if (placesA.length && placesB.length) {
    const overlap = placesA.filter((t) => placesB.includes(t));
    if (overlap.length) score += 10;
  }

  if (a.gender && b.gender && a.gender === b.gender) score += 5;

  return score;
}

function formatVia(person) {
  const year = birthYear(person.birthDate);
  const name = [person.firstName, person.lastName].filter(Boolean).join(' ');
  return year ? `${name}, ${year}` : name;
}

module.exports = { scorePersonPair, formatVia, birthYear };
