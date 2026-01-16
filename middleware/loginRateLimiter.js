// loginRateLimiter.js

const MAX_ATTEMPTS = 5;
const BLOCK_TIME = 3 * 60 * 60 * 1000; // 3 hours
const MEMORY_TTL = 30 * 1000; // 30 seconds

// In-memory store
const attempts = new Map();

// Cleanup expired records every 30 seconds
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of attempts.entries()) {
    if (record.expiresAt && record.expiresAt < now) {
      attempts.delete(ip);
    }
  }
}, MEMORY_TTL);

function loginRateLimiter(req, res, next) {
  const ip = req.ip;
  const record = attempts.get(ip);

  // Block check
  if (record?.blockedUntil && record.blockedUntil > Date.now()) {
    return res.status(429).json({
      message: "Too many failed login attempts. Try again later.",
    });
  }

  next();
}

loginRateLimiter.recordFailure = function (ip) {
  const now = Date.now();
  const record = attempts.get(ip) || {
    count: 0,
    expiresAt: now + MEMORY_TTL,
  };

  record.count += 1;
  record.expiresAt = now + MEMORY_TTL; // refresh TTL on activity

  if (record.count >= MAX_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_TIME;
  }

  attempts.set(ip, record);
};

loginRateLimiter.recordSuccess = function (ip) {
  attempts.delete(ip);
};

module.exports = loginRateLimiter;
