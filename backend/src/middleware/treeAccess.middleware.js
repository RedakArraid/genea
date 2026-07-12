const prisma = require('../lib/prisma');
const { resolveTreeAccess, requireTreeRead, requireTreeWrite } = require('../lib/treeAccess');
const { getOrCreateDemoFork, translateDemoEntityId } = require('../lib/demoFork');

const OWNER_ACCESS = { canRead: true, canWrite: true, canEditPerson: true, canExport: false, canVersioning: false, role: 'owner', isDemo: false };

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

    if (req.user?.id) {
      const adminAccess = await resolveTreeAccess(req.user.id, treeId);
      if (adminAccess.role === 'admin') {
        req.treeAccess = adminAccess;
        return next();
      }
    }

    if (tree.isDemo) {
      if (req.user?.id) {
        const existingFork = await prisma.familyTree.findUnique({ where: { demoForkOwnerId: req.user.id } });
        if (existingFork) {
          req.params.id = existingFork.id;
          req.params.treeId = existingFork.id;
          res.locals.demoForkTreeId = existingFork.id;
          req.treeAccess = OWNER_ACCESS;
          return next();
        }
      }
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
      const adminAccess = await resolveTreeAccess(req.user.id, treeId);
      if (adminAccess.role === 'admin') {
        req.treeAccess = adminAccess;
        return next();
      }
      const fork = await getOrCreateDemoFork(req.user.id);
      // req.params.id ne désigne le treeId que pour les routes /family-trees/:id/... -
      // pour les routes déléguées (positions, edges), :id référence une autre entité
      // et est traduit séparément par leur propre wrapper avant d'arriver ici.
      if (req.params.id === treeId) req.params.id = fork.id;
      req.params.treeId = fork.id;
      if (req.body && typeof req.body === 'object') {
        if ('treeId' in req.body) req.body.treeId = fork.id;
        // nodeId (positions) / personId (uploads) référencent une personne de l'arbre
        // démo canonique : on les traduit vers leur équivalent dans le fork.
        for (const field of ['nodeId', 'personId']) {
          if (req.body[field]) {
            const forkedPersonId = await translateDemoEntityId(fork.id, 'person', req.body[field]);
            if (forkedPersonId) req.body[field] = forkedPersonId;
          }
        }
      }
      res.locals.demoForkTreeId = fork.id;
      req.treeAccess = OWNER_ACCESS;
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
      const adminAccess = await resolveTreeAccess(req.user.id, person.treeId);
      if (adminAccess.role === 'admin') {
        req.personData = person;
        req.treeAccess = adminAccess;
        return next();
      }
      const fork = await getOrCreateDemoFork(req.user.id);
      const forkedPersonId = await translateDemoEntityId(fork.id, 'person', personId);
      if (!forkedPersonId) {
        return res.status(404).json({ message: 'Personne non trouvée dans votre copie de la démo' });
      }
      const forkedPerson = await prisma.person.findUnique({
        where: { id: forkedPersonId },
        include: { FamilyTree: { select: { ownerId: true, isDemo: true } } },
      });
      req.params.id = forkedPersonId;
      req.params.personId = forkedPersonId;
      req.personData = forkedPerson;
      res.locals.demoForkTreeId = fork.id;
      req.treeAccess = OWNER_ACCESS;
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
        message: 'Les fiches personnes ne sont pas modifiables en démo. Créez votre propre arbre pour éditer',
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
