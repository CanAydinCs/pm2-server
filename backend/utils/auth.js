const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const SECRET = process.env.JWT_SECRET || 'pm2panel_secret_key_degistir';

function generateToken() {
  return jwt.sign({ panel: true }, SECRET, { expiresIn: '7d' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

async function checkPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function authMiddleware(req, res, next) {
  // require burada cagrilarak circular dependency kirilir
  const { getConfig } = require('./config');
  const config = getConfig();

  if (!config.passwordHash) return next();

  const token = req.cookies?.pm2_token;
  if (!token || !verifyToken(token)) {
    return res.status(401).json({ error: 'Yetkisiz erisim' });
  }
  next();
}

module.exports = { generateToken, verifyToken, hashPassword, checkPassword, authMiddleware };
