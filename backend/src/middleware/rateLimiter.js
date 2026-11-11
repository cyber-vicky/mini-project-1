// In-memory sliding-window rate limiter for sensitive authentication endpoints

const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  defaultMax = 20,
  message = 'Too many requests. Please try again later.'
}) => {
  const requestLogs = new Map();

  // Periodic cleanup every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [key, records] of requestLogs.entries()) {
      const activeRecords = records.filter(ts => now - ts < windowMs);
      if (activeRecords.length === 0) {
        requestLogs.delete(key);
      } else {
        requestLogs.set(key, activeRecords);
      }
    }
  }, 5 * 60 * 1000).unref();

  return (req, res, next) => {
    // Determine max requests (support test / dev environments)
    const maxRequests = parseInt(process.env.AUTH_RATE_LIMIT_MAX || String(defaultMax), 10);
    const ip = req.ip || req.connection?.remoteAddress || 'unknown-ip';
    const emailKey = req.body?.email ? `:${req.body.email.toLowerCase().trim()}` : '';
    const tokenKey = req.body?.token ? `:${req.body.token.substring(0, 16)}` : '';
    const clientKey = `${ip}${emailKey}${tokenKey}`;
    const now = Date.now();

    const clientRecords = requestLogs.get(clientKey) || [];
    const validRecords = clientRecords.filter(ts => now - ts < windowMs);

    if (validRecords.length >= maxRequests) {
      const earliestTs = validRecords[0];
      const retryAfterSec = Math.ceil((windowMs - (now - earliestTs)) / 1000);
      res.setHeader('Retry-After', retryAfterSec);
      return res.status(429).json({
        message,
        retryAfterSec
      });
    }

    validRecords.push(now);
    requestLogs.set(clientKey, validRecords);
    next();
  };
};

module.exports = {
  createRateLimiter,
  forgotPasswordLimiter: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    defaultMax: 20,
    message: 'Too many password reset requests. Please try again after 15 minutes.'
  }),
  resetPasswordLimiter: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    defaultMax: 20,
    message: 'Too many password update attempts. Please try again after 15 minutes.'
  })
};
