const rateLimitWindowMs = 60 * 1000; // 1 minute
const maxRequestsPerWindow = 20;
const ipRequests = new Map();

function rateLimit(req, res, next) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  let clientWindow = ipRequests.get(ip);
  if (!clientWindow || now > clientWindow.resetTime) {
    clientWindow = {
      count: 1,
      resetTime: now + rateLimitWindowMs
    };
    ipRequests.set(ip, clientWindow);
    return next();
  }

  clientWindow.count++;
  if (clientWindow.count > maxRequestsPerWindow) {
    return res.status(429).json({
      error: 'Too many requests. Please slow down and try again later.'
    });
  }

  next();
}

module.exports = rateLimit;