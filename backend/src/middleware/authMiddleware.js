const jwt = require('jsonwebtoken');
const jsonService = require('../services/jsonService');

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify user exists and token has not been invalidated by a password change
    const collection = decoded.role === 'citizen' ? 'citizens' : 'municipal_users';
    const user = jsonService.findById(collection, decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User account no longer exists' });
    }

    if (user.passwordChangedAt) {
      const changedTime = new Date(user.passwordChangedAt).getTime();
      const tokenTime = decoded.authTime || (decoded.iat ? decoded.iat * 1000 : 0);
      if (tokenTime < changedTime) {
        return res.status(401).json({ message: 'Session expired due to recent password change. Please log in again.' });
      }
    }

    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const roleMiddleware = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied: insufficient permissions' });
  }
  next();
};

module.exports = { authMiddleware, roleMiddleware };
