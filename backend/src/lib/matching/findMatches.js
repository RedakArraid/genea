const prisma = require('../prisma');
const { scorePersonPair, formatVia } = require('./scorePerson');
const { normalizeName } = require('./normalize');

const MIN_PAIR_SCORE = 70;
const MIN_TREE_CONFIDENCE = 42;

async function findTreeMatches(treeId) {
  const sourceTree = await prisma.familyTree.findUnique({
    where: { id: treeId },
    include: {
      Person: true,
      User: { select: { name: true } },
    },
  });

  if (!sourceTree || sourceTree.isDemo) {
    return { matches: [], matchingOptIn: false };
  }

  const sourcePersons = sourceTree.Person;
  if (!sourcePersons.length) {
    return { matches: [], matchingOptIn: sourceTree.matchingOptIn };
  }

  const candidateTrees = await prisma.familyTree.findMany({
    where: {
      visibility: 'PUBLIC',
      matchingOptIn: true,
      isDemo: false,
      id: { not: treeId },
      ownerId: { not: sourceTree.ownerId },
    },
    include: {
      Person: true,
      User: { select: { name: true } },
    },
  });

  const matches = [];

  for (const remote of candidateTrees) {
    const pairs = [];
    for (const local of sourcePersons) {
      for (const remotePerson of remote.Person) {
        const score = scorePersonPair(local, remotePerson);
        if (score >= MIN_PAIR_SCORE) {
          pairs.push({ local, remote: remotePerson, score });
        }
      }
    }

    if (!pairs.length) continue;

    const confidence = Math.round(pairs.reduce((s, p) => s + p.score, 0) / pairs.length);
    if (confidence < MIN_TREE_CONFIDENCE) continue;

    const best = pairs.sort((a, b) => b.score - a.score)[0];
    const region = best.remote.birthPlace?.split(',')[0]?.trim() || '—';

    matches.push({
      treeId: remote.id,
      treeName: remote.name,
      ownerName: remote.User?.name || '—',
      region,
      sharedCount: pairs.length,
      confidence,
      via: formatVia(best.remote),
    });
  }

  matches.sort((a, b) => b.confidence - a.confidence || b.sharedCount - a.sharedCount);

  return { matches, matchingOptIn: sourceTree.matchingOptIn };
}

module.exports = { findTreeMatches, normalizeName };
