const prisma = require('../lib/prisma');

const isAdmin = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true },
    });
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Accès administrateur requis' });
    }
    req.adminUser = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { isAdmin };
