const router = require('express').Router();
const { getConfig, setConfig } = require('../utils/config');
const { checkSSH, getPublicKey, hasSSHKey, deleteSSHKey } = require('../utils/ssh');
const { execSync, spawn } = require('child_process');
const { pullRepo } = require('../utils/git');
const pm2Utils = require('../utils/pm2');
const { broadcast } = require('../utils/ws');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');

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

// SSH key'sini sil
router.delete('/ssh/delete-key', (req, res) => {
  try {
    const { deleteFromSystem } = req.body;
    const result = deleteSSHKey(deleteFromSystem || false);
    
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    // Reset SSH status in config
    setConfig({ sshStatus: { connected: false, username: null, lastChecked: new Date().toISOString() } });

    res.json({ success: true, message: deleteFromSystem ? 'SSH key deleted from system' : 'SSH key removed from config' });
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

// Self-update: Spawns update.js script to run independently
router.post('/self-update', async (req, res) => {
  const updateScript = path.join(process.cwd(), 'update.js');
  
  try {
    // Send initial message
    broadcast('self-update', { message: 'Starting update process...' });
    
    // Check if update.js exists
    if (!fs.existsSync(updateScript)) {
      broadcast('self-update', { message: 'Error: update.js not found', error: true });
      return res.status(500).json({ error: 'Update script not found' });
    }
    
    // Spawn update script as child process
    broadcast('self-update', { message: 'Running update script...' });
    
    const updateProcess = spawn('node', [updateScript], {
      cwd: process.cwd(),
      env: process.env
    });
    
    // Stream stdout to WebSocket
    updateProcess.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(line => line.trim());
      lines.forEach(line => {
        broadcast('self-update', { message: line });
      });
    });
    
    // Stream stderr to WebSocket
    updateProcess.stderr.on('data', (data) => {
      const lines = data.toString().split('\n').filter(line => line.trim());
      lines.forEach(line => {
        broadcast('self-update', { message: line, error: true });
      });
    });
    
    // Handle process exit
    updateProcess.on('close', (code) => {
      if (code === 0) {
        broadcast('self-update', { message: 'Update completed successfully. Restarting...' });
      } else {
        broadcast('self-update', { message: `Update failed with exit code ${code}`, error: true });
      }
    });
    
    // Handle process error
    updateProcess.on('error', (err) => {
      broadcast('self-update', { message: `Failed to start update script: ${err.message}`, error: true });
    });
    
    // Return immediately (fire-and-forget)
    res.json({ 
      success: true, 
      message: 'Update started. Check logs for progress. Server will restart automatically.' 
    });
    
  } catch (err) {
    broadcast('self-update', { message: `Failed to start update: ${err.message}`, error: true });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
