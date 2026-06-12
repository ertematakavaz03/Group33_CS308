const jwt = require('jsonwebtoken');

// Same secret family as the admin JWTs (server/routes/admin.js) — set a real
// value in server/.env for production.
const JWT_SECRET = process.env.JWT_SECRET || 'pazaryolu_admin_dev_secret';
const CUSTOMER_TOKEN_TTL = '7d';

// Verifies the customer's JWT and exposes the authenticated user as req.user.
// Routes use req.user.id to enforce that a user can only access their own data.
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

function signCustomerToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: CUSTOMER_TOKEN_TTL });
}

module.exports = { authenticate, signCustomerToken };
