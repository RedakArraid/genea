/**
 * Copier / coller des sous-arbres entre arbres (ou au sein d'un même arbre).
 */

const prisma = require('../lib/prisma');
const { extractSubtree, pasteSubtree } = require('../lib/subtreeClone');
const { sendError } = require('../lib/apiErrors');

exports.extractSubtree = async (req, res, next) => {
  try {
    const { id: treeId } = req.params;
    const { rootPersonId, mode = 'branch' } = req.body || {};

    if (!rootPersonId) {
      return res.status(400).json({ message: 'rootPersonId requis' });
    }
    if (!['branch', 'entire'].includes(mode)) {
      return res.status(400).json({ message: 'mode invalide (branch ou entire)' });
    }

    const result = await extractSubtree(treeId, rootPersonId, { mode });
    res.status(200).json({
      sourceTreeId: treeId,
      ...result,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message, code: error.code });
    }
    next(error);
  }
};

exports.pasteSubtree = async (req, res, next) => {
  try {
    const { id: treeId } = req.params;
    const { clipboard, anchor, attachToPersonId, attachAs, rootPersonId, sourceTreeId } = req.body || {};

    if (!clipboard?.persons?.length) {
      return res.status(400).json({ message: 'Presse-papiers invalide ou vide' });
    }
    if (attachAs && !['child', 'spouse'].includes(attachAs)) {
      return res.status(400).json({ message: 'attachAs invalide (child ou spouse)' });
    }
    if (attachAs && !attachToPersonId) {
      return res.status(400).json({ message: 'attachToPersonId requis avec attachAs' });
    }

    const tree = await prisma.familyTree.findUnique({ where: { id: treeId } });
    if (!tree) {
      return res.status(404).json({ message: 'Arbre cible introuvable' });
    }

    const result = await pasteSubtree(treeId, tree.ownerId, clipboard, {
      anchor,
      attachToPersonId,
      attachAs,
      rootPersonId,
      sourceTreeId,
    });

    res.status(201).json({
      message: 'Sous-arbre collé avec succès',
      ...result,
    });
  } catch (error) {
    if (error.statusCode && error.code) {
      return sendError(res, error.statusCode, error.code, error.message, {
        maxPersons: error.maxPersons,
        planName: error.planName,
      });
    }
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
};
