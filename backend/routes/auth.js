const router = require('express').Router();
const { getConfig, setConfig } = require('../utils/config');
const { generateToken, hashPassword, checkPassword, authMiddleware } = require('../utils/auth');

// Giriş
router.post('/login', async (req, res) => {
  const config = getConfig();

  // Şifre yoksa direkt token ver
  if (!config.passwordHash) {
    const token = generateToken();
    res.cookie('pm2_token', token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
    return res.json({ success: true, passwordRequired: false });
  }

  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Şifre gerekli' });

  const valid = await checkPassword(password, config.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Hatalı şifre' });

  const token = generateToken();
  res.cookie('pm2_token', token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.json({ success: true });
});

// Çıkış
router.post('/logout', (req, res) => {
  res.clearCookie('pm2_token');
  res.json({ success: true });
});

// Şifre durumu (frontend şifre gerekip gerekmediğini öğrenir, hash dönmez)
router.get('/status', (req, res) => {
  const config = getConfig();
  res.json({ passwordRequired: !!config.passwordHash });
});

// Şifre ekle / değiştir (korumalı)
router.post('/password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const config = getConfig();

  if (config.passwordHash) {
    const valid = await checkPassword(currentPassword, config.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Mevcut şifre hatalı' });
  }

  const hash = await hashPassword(newPassword);
  setConfig({ passwordHash: hash });
  res.json({ success: true });
});

// Şifreyi kaldır (korumalı)
router.delete('/password', authMiddleware, async (req, res) => {
  const { currentPassword } = req.body;
  const config = getConfig();

  if (config.passwordHash) {
    const valid = await checkPassword(currentPassword, config.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Mevcut şifre hatalı' });
  }

  setConfig({ passwordHash: null });
  res.clearCookie('pm2_token');
  res.json({ success: true });
});

module.exports = router;
