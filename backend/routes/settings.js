const router = require('express').Router();
const { getConfig, setConfig } = require('../utils/config');
const { checkSSH, getPublicKey, hasSSHKey } = require('../utils/ssh');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const isWindows = process.platform === 'win32';

function normalizePath(p) {
  return p.replace(/\\/g, '/');
}

function ensureSSHDir() {
  const sshDir = path.join(os.homedir(), '.ssh');
  if (!fs.existsSync(sshDir)) {
    fs.mkdirSync(sshDir, { mode: 0o700 });
  }
  return sshDir;
}

// Config'i getir (passwordHash donmez)
router.get('/', (req, res) => {
  const config = getConfig();
  const { passwordHash, sshAccounts, ...safe } = config;
  res.json(safe);
});

// Config'i guncelle
router.patch('/', (req, res) => {
  const { passwordHash, sshAccounts, ...updates } = req.body;
  const updated = setConfig(updates);
  const { passwordHash: _, sshAccounts: __, ...safe } = updated;
  res.json(safe);
});

// SSH bağlantısını test et
router.post('/ssh/recheck', async (req, res) => {
  const result = await checkSSH();
  res.json(result);
});

// Mevcut SSH key var mı kontrol et
router.get('/ssh/key-exists', (req, res) => {
  const exists = hasSSHKey();
  res.json({ exists });
});

// SSH key'sini getir
router.get('/ssh/public-key', (req, res) => {
  const publicKey = getPublicKey();
  if (!publicKey) {
    return res.status(404).json({ error: 'No SSH key found' });
  }
  res.json({ publicKey });
});

// Yeni SSH key oluştur (id_ed25519)
router.post('/ssh/generate-key', (req, res) => {
  try {
    const sshDir = ensureSSHDir();
    const keyPath = path.join(sshDir, 'id_ed25519');
    const normalizedKeyPath = normalizePath(keyPath);

    // Zaten varsa hata ver
    if (fs.existsSync(keyPath)) {
      return res.status(400).json({ error: 'SSH key already exists' });
    }

    if (isWindows) {
      execSync(`ssh-keygen -t ed25519 -f "${normalizedKeyPath}" -N "" -C "pm2-server"`, {
        stdio: 'pipe',
        shell: true,
      });
    } else {
      execSync(`ssh-keygen -t ed25519 -f '${keyPath}' -N '' -C 'pm2-server'`, {
        stdio: 'pipe',
      });
    }

    const publicKey = fs.readFileSync(`${keyPath}.pub`, 'utf-8').trim();

    if (!isWindows) {
      fs.chmodSync(keyPath, 0o600);
    }

    res.json({ publicKey });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mevcut dil dosyalarini listele
router.get('/locales', (req, res) => {
  const localesDir = path.join(__dirname, '../../frontend/src/locales');
  if (!fs.existsSync(localesDir)) return res.json([]);
  const files = fs.readdirSync(localesDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace('.json', ''));
  res.json(files);
});

// Meta bilgilerini guncelle
router.patch('/meta', (req, res) => {
  const config = getConfig();
  const updatedMeta = { ...config.meta, ...req.body };
  const updated = setConfig({ meta: updatedMeta });
  res.json(updated.meta);
});

module.exports = router;
