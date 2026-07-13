/**
 * Rate limiting en mémoire (par IP + identifiant).
 * Suffisant pour un VPS unique ; remplacer par Redis si multi-instances.
 */

function createRateLimiter({ windowMs, max, keyPrefix, keyFromRequest }) {
  const hits = new Map();

  return (req, res, next) => {
    const suffix = keyFromRequest(req) || req.ip || 'unknown';
    const key = `${keyPrefix}:${suffix}`;
    const now = Date.now();
    let bucket = hits.get(key);

    if (!bucket || now - bucket.start >= windowMs) {
      bucket = { start: now, count: 0 };
      hits.set(key, bucket);
    }

    bucket.count += 1;
    if (bucket.count > max) {
      return res.status(429).json({
        code: 'RATE_LIMIT',
        message: 'Trop de tentatives. Réessayez dans quelques minutes.',
      });
    }

    next();
  };
}

const loginRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyPrefix: 'login',
  keyFromRequest: (req) => {
    const login = req.body?.login || req.body?.phone || req.body?.email;
    return login ? String(login).trim().toLowerCase() : null;
  },
});

const otpRequestRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyPrefix: 'otp',
  keyFromRequest: (req) => {
    const phone = req.body?.phone;
    return phone ? String(phone).trim() : null;
  },
});

module.exports = { createRateLimiter, loginRateLimit, otpRequestRateLimit };
