const prisma = require('../lib/prisma');
const { requireTreeRead, requireTreeWrite, resolveTreeAccess } = require('../lib/treeAccess');
const { getOrCreateDemoFork, translateDemoEntityId } = require('../lib/demoFork');

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

    const source = await prisma.person.findUnique({ where: { id: relationship.sourceId }, include: { FamilyTree: true } });
    if (!source) {
      return res.status(404).json({ message: 'Personne non trouvée' });
    }

    if (source.FamilyTree?.isDemo) {
      if (!req.user?.id) {
        return res.status(401).json({ message: 'Connectez-vous pour modifier la démo' });
      }
      const adminAccess = await resolveTreeAccess(req.user.id, source.treeId);
      if (adminAccess.role !== 'admin') {
        const fork = await getOrCreateDemoFork(req.user.id);
        const forkedRelationshipId = await translateDemoEntityId(fork.id, 'relationship', id);
        if (!forkedRelationshipId) {
          return res.status(404).json({ message: 'Relation non trouvée dans votre copie de la démo' });
        }
        req.params.id = forkedRelationshipId;
        res.locals.demoForkTreeId = fork.id;
        return next();
      }
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
      prisma.person.findUnique({ where: { id: sourceId }, include: { FamilyTree: true } }),
      prisma.person.findUnique({ where: { id: targetId }, include: { FamilyTree: true } }),
    ]);

    if (!source || !target) {
      return res.status(404).json({ message: 'Une ou plusieurs personnes non trouvées' });
    }

    // Cas mixte possible : une personne vient d'être créée dans le fork (même
    // requête "ajouter enfant + lier"), l'autre référence encore l'arbre démo
    // canonique. On résout les deux vers le même fork avant de comparer les arbres.
    if (source.FamilyTree?.isDemo || target.FamilyTree?.isDemo) {
      if (!req.user?.id) {
        return res.status(401).json({ message: 'Connectez-vous pour modifier la démo' });
      }
      const demoTreeId = source.FamilyTree?.isDemo ? source.treeId : target.treeId;
      const adminAccess = await resolveTreeAccess(req.user.id, demoTreeId);
      if (adminAccess.role !== 'admin') {
        const fork = await getOrCreateDemoFork(req.user.id);
        const resolveId = async (person) => {
          if (person.treeId === fork.id) return person.id;
          if (person.FamilyTree?.isDemo) return translateDemoEntityId(fork.id, 'person', person.id);
          return null;
        };
        const [forkedSourceId, forkedTargetId] = await Promise.all([resolveId(source), resolveId(target)]);
        if (!forkedSourceId || !forkedTargetId) {
          return res.status(404).json({ message: 'Personne non trouvée dans votre copie de la démo' });
        }
        req.body.sourceId = forkedSourceId;
        req.body.targetId = forkedTargetId;
        res.locals.demoForkTreeId = fork.id;
        return next();
      }
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
