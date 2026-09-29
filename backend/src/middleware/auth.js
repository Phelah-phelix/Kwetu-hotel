const jwt = require('jsonwebtoken');

// Runs before any "protected" route.
// Looks for a header like: Authorization: Bearer <token>
// If the token is valid, it attaches the decoded user info to `req.user`
// so every controller after this can read req.user.id / req.user.role.
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1]; // "Bearer xxxxx" -> "xxxxx"

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, email }
    next(); // token is valid, continue to the actual route handler
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Usage: requireRole('ADMIN') or requireRole('ADMIN', 'WORKER')
// Restricts a route to only the roles listed.
// Must run AFTER verifyToken, since it depends on req.user being set.
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to do this' });
    }
    next();
  };
}

module.exports = { verifyToken, requireRole };
