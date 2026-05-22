/**
 * Minimal in-memory rate limiter middleware factory.
 *
 * Limits requests per client IP within a sliding time window — used to
 * protect authentication endpoints against brute-force attempts.
 *
 * Notes:
 *  - In-process only; a multi-instance deployment would need a shared
 *    store (e.g. Redis). Adequate for this single-process app.
 *  - Disabled under NODE_ENV=test so the test suite is not throttled.
 */
function rateLimit(options = {}) {
  const {
    windowMs = 15 * 60 * 1000,           // 15 minutes
    max = 10,                            // max requests per window per IP
    message = 'Too many requests, please try again later.'
  } = options;

  // No-op while testing so the suite can hammer endpoints freely.
  if (process.env.NODE_ENV === 'test') {
    return (req, res, next) => next();
  }

  const hits = new Map(); // ip -> [timestamps]

  return (req, res, next) => {
    const now = Date.now();
    const windowStart = now - windowMs;
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';

    // Opportunistic cleanup so the map cannot grow unbounded.
    if (hits.size > 5000) {
      for (const [key, ts] of hits) {
        if (ts.every((t) => t <= windowStart)) hits.delete(key);
      }
    }

    const recent = (hits.get(ip) || []).filter((t) => t > windowStart);

    if (recent.length >= max) {
      const retryAfter = Math.ceil((recent[0] + windowMs - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({ error: message });
    }

    recent.push(now);
    hits.set(ip, recent);
    next();
  };
}

module.exports = rateLimit;
