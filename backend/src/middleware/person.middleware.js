const prisma = require('../lib/prisma');
const { requireTreeRead, requireTreeWrite, resolveTreeAccess } = require('../lib/treeAccess');

const canAccessPerson = async (req, res, next) => {
  try {
    const personId = req.params.id;
    if (!personId) {
      return res.status(400).json({ message: 'ID de personne manquant' });
    }

    const person = await prisma.person.findUnique({
      where: { id: personId },
      include: { FamilyTree: true },
    });

    if (!person) {
      return res.status(404).json({ message: 'Personne non trouvée' });
    }

    const access = await resolveTreeAccess(req.user?.id, person.treeId);
    if (!access.canRead) {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    req.personData = person;
    req.treeAccess = access;
    next();
  } catch (error) {
    res.status(error.statusCode || 403).json({ message: error.message });
  }
};

const canWritePerson = async (req, res, next) => {
  try {
    const personId = req.params.id;
    const person = await prisma.person.findUnique({
      where: { id: personId },
      include: { FamilyTree: true },
    });

    if (!person) {
      return res.status(404).json({ message: 'Personne non trouvée' });
    }

    await requireTreeWrite(req.user.id, person.treeId);
    req.personData = person;
    next();
  } catch (error) {
    res.status(error.statusCode || 403).json({ message: error.message });
  }
};

const canDeleteRelationship = async (req, res, next) => {
  try {
    const { id } = req.params;
    const relationship = await prisma.relationship.findUnique({ where: { id } });
    if (!relationship) {
      return res.status(404).json({ message: 'Relation non trouvée' });
    }

    const source = await prisma.person.findUnique({ where: { id: relationship.sourceId } });
    if (!source) {
      return res.status(404).json({ message: 'Personne non trouvée' });
    }

    await requireTreeWrite(req.user.id, source.treeId);
    next();
  } catch (error) {
    res.status(error.statusCode || 403).json({ message: error.message });
  }
};

const canReadPersonRelationships = async (req, res, next) => {
  try {
    const { personId } = req.params;
    const person = await prisma.person.findUnique({ where: { id: personId } });
    if (!person) {
      return res.status(404).json({ message: 'Personne non trouvée' });
    }
    const access = await resolveTreeAccess(req.user?.id, person.treeId);
    if (!access.canRead) {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    next();
  } catch (error) {
    res.status(error.statusCode || 403).json({ message: error.message });
  }
};

const canCreateRelationship = async (req, res, next) => {
  try {
    const { sourceId, targetId } = req.body;
    if (!sourceId || !targetId) {
      return res.status(400).json({ message: 'IDs des personnes source et cible requis' });
    }

    const [source, target] = await Promise.all([
      prisma.person.findUnique({ where: { id: sourceId } }),
      prisma.person.findUnique({ where: { id: targetId } }),
    ]);

    if (!source || !target) {
      return res.status(404).json({ message: 'Une ou plusieurs personnes non trouvées' });
    }

    if (source.treeId !== target.treeId) {
      return res.status(400).json({
        message: 'Les deux personnes doivent appartenir au même arbre généalogique',
      });
    }

    await requireTreeWrite(req.user.id, source.treeId);
    next();
  } catch (error) {
    res.status(error.statusCode || 403).json({ message: error.message });
  }
};

module.exports = {
  canAccessPerson,
  canCreateRelationship,
  canDeleteRelationship,
  canReadPersonRelationships,
};
