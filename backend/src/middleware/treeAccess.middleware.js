const prisma = require('../lib/prisma');
const { resolveTreeAccess, requireTreeRead, requireTreeWrite } = require('../lib/treeAccess');

const canReadTree = async (req, res, next) => {
  try {
    const treeId = req.params.treeId || req.params.id;
    if (!treeId) {
      return res.status(400).json({ message: 'ID d\'arbre manquant' });
    }

    const tree = await prisma.familyTree.findUnique({ where: { id: treeId } });
    if (!tree) {
      return res.status(404).json({ message: 'Arbre généalogique non trouvé' });
    }

    if (tree.isDemo) {
      req.treeAccess = {
        canRead: true,
        canWrite: !!req.user?.id,
        canEditPerson: false,
        role: req.user?.id ? 'demo' : 'viewer',
        isDemo: true,
      };
      return next();
    }

    if (!req.user?.id) {
      if (tree.visibility === 'PUBLIC' || tree.isPublic) {
        req.treeAccess = {
          canRead: true,
          canWrite: false,
          canEditPerson: false,
          role: 'viewer',
          isDemo: false,
        };
        return next();
      }
      return res.status(401).json({ message: 'Authentification requise' });
    }

    const access = await requireTreeRead(req.user.id, treeId);
    req.treeAccess = access;
    next();
  } catch (error) {
    res.status(error.statusCode || 403).json({ message: error.message });
  }
};

const canWriteTree = async (req, res, next) => {
  try {
    const treeId = req.params.treeId || req.params.id;
    if (!treeId) {
      return res.status(400).json({ message: 'ID d\'arbre manquant' });
    }

    const tree = await prisma.familyTree.findUnique({ where: { id: treeId } });
    if (tree?.isDemo) {
      if (!req.user?.id) {
        return res.status(401).json({ message: 'Connectez-vous pour modifier la démo' });
      }
      req.treeAccess = {
        canRead: true,
        canWrite: true,
        canEditPerson: false,
        role: 'demo',
        isDemo: true,
      };
      return next();
    }

    const access = await requireTreeWrite(req.user.id, treeId);
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

    if (person.FamilyTree?.isDemo) {
      if (!req.user?.id) {
        return res.status(401).json({ message: 'Connectez-vous pour modifier la démo' });
      }
      req.personData = person;
      req.treeAccess = {
        canRead: true,
        canWrite: true,
        canEditPerson: false,
        role: 'demo',
        isDemo: true,
      };
      return next();
    }

    const access = await requireTreeWrite(req.user.id, person.treeId);
    req.personData = person;
    req.treeAccess = access;
    next();
  } catch (error) {
    res.status(error.statusCode || 403).json({ message: error.message });
  }
};

const canEditPersonInfo = async (req, res, next) => {
  try {
    const personId = req.params.id;
    const person = await prisma.person.findUnique({
      where: { id: personId },
      include: { FamilyTree: true },
    });
    if (!person) {
      return res.status(404).json({ message: 'Personne non trouvée' });
    }
    if (person.FamilyTree?.isDemo) {
      return res.status(403).json({
        message: 'Les fiches personnes ne sont pas modifiables en démo — créez votre propre arbre pour éditer',
      });
    }
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Authentification requise' });
    }
    const access = await requireTreeWrite(req.user.id, person.treeId);
    if (!access.canEditPerson) {
      return res.status(403).json({ message: 'Vous ne pouvez pas modifier cette fiche' });
    }
    req.personData = person;
    req.treeAccess = access;
    next();
  } catch (error) {
    res.status(error.statusCode || 403).json({ message: error.message });
  }
};

const canWriteEdge = async (req, res, next) => {
  try {
    let treeId = req.body?.treeId || req.params.treeId;
    if (!treeId && req.params.id) {
      const edge = await prisma.edge.findUnique({ where: { id: req.params.id } });
      if (!edge) {
        return res.status(404).json({ message: 'Arête non trouvée' });
      }
      treeId = edge.treeId;
    }
    if (!treeId) {
      return res.status(400).json({ message: 'ID d\'arbre manquant' });
    }
    req.params.treeId = treeId;
    return canWriteTree(req, res, next);
  } catch (error) {
    res.status(error.statusCode || 403).json({ message: error.message });
  }
};

module.exports = {
  canReadTree,
  canWriteTree,
  canWritePerson,
  canEditPersonInfo,
  canWriteEdge,
};
