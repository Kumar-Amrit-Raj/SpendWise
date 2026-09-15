const jwt = require('jsonwebtoken');

function authSecret() {
  const secret = process.env.AUTH_SECRET || process.env.JWT_SECRET;
  if (!secret) throw new Error('AUTH_SECRET is not configured');
  return secret;
}

function signToken(userId) {
  return jwt.sign({ sub: String(userId) }, authSecret(), { expiresIn: '7d' });
}

function requireAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, authSecret());
    req.userId = payload.sub;
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired session' });
  }
}

module.exports = { signToken, requireAuth };
