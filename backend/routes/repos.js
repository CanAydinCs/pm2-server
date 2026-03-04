const router = require('express').Router();
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { getConfig } = require('../utils/config');
const { cloneRepo, pullRepo, findEcosystem, parseEcosystem, listRepos } = require('../utils/git');
const { broadcast } = require('../utils/ws');
const pm2 = require('../utils/pm2');

// Kayıtlı repoları listele
router.get('/', (req, res) => {
  const { repoDir } = getConfig();
  const repos = listRepos(repoDir);
  res.json(repos);
});

// Yeni repo clone et
router.post('/clone', async (req, res) => {
  const { repoUrl, name } = req.body;
  if (!repoUrl) return res.status(400).json({ error: 'repoUrl gerekli' });

  const { repoDir } = getConfig();
  const folderName = name || path.basename(repoUrl, '.git');
  const targetPath = path.join(repoDir, folderName);

  if (fs.existsSync(targetPath)) {
    return res.status(400).json({ error: 'Bu isimde klasör zaten mevcut' });
  }

  try {
    await cloneRepo(repoUrl, targetPath);
    const ecosystemPath = findEcosystem(targetPath);
    const apps = ecosystemPath ? parseEcosystem(ecosystemPath) : null;
    res.json({ success: true, path: targetPath, ecosystemPath, apps });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ecosystem dosyasını oku
router.get('/:name/ecosystem', (req, res) => {
  const { repoDir } = getConfig();
  const repoPath = path.join(repoDir, req.params.name);
  const ecosystemPath = findEcosystem(repoPath);

  if (!ecosystemPath) {
    return res.status(404).json({ error: 'Ecosystem dosyası bulunamadı' });
  }

  const apps = parseEcosystem(ecosystemPath);
  res.json({ ecosystemPath, apps });
});

// Pull & Deploy
router.post('/:name/deploy', async (req, res) => {
  const { repoDir } = getConfig();
  const repoPath = path.join(repoDir, req.params.name);

  if (!fs.existsSync(repoPath)) {
    return res.status(404).json({ error: 'Repo bulunamadı' });
  }

  // Hemen 200 dön, ilerlemeyi WebSocket ile gönder
  res.json({ success: true, message: 'Deploy başladı, WS üzerinden takip edin' });

  const step = (msg) => broadcast('deploy', { repo: req.params.name, message: msg });

  try {
    step('📥 git pull yapılıyor...');
    await pullRepo(repoPath);
    step('✓ git pull tamamlandı');

    const ecosystemPath = findEcosystem(repoPath);
    const apps = ecosystemPath ? parseEcosystem(ecosystemPath) : null;

    // post-deploy komutlarını ecosystem'den al, yoksa varsayılanı kullan
    const postDeploy = apps?.[0]?.['post-deploy'] || null;

    if (postDeploy) {
      step(`⚙️  post-deploy çalıştırılıyor...`);
      execSync(postDeploy, { cwd: repoPath, stdio: 'pipe' });
      step('✓ post-deploy tamamlandı');
    } else {
      // Varsayılan sıra
      if (fs.existsSync(path.join(repoPath, 'composer.json'))) {
        step('📦 composer install...');
        execSync('composer install --no-interaction', { cwd: repoPath, stdio: 'pipe' });
        step('✓ composer install tamamlandı');
      }
      if (fs.existsSync(path.join(repoPath, 'package.json'))) {
        step('📦 npm install...');
        execSync('npm install', { cwd: repoPath, stdio: 'pipe' });
        step('📦 npm run build...');
        execSync('npm run build', { cwd: repoPath, stdio: 'pipe' });
        step('✓ npm build tamamlandı');
      }
      if (fs.existsSync(path.join(repoPath, 'artisan'))) {
        step('🗄️  php artisan migrate...');
        execSync('php artisan migrate --force', { cwd: repoPath, stdio: 'pipe' });
        step('✓ migrate tamamlandı');
      }
    }

    // pm2 reload
    if (ecosystemPath) {
      step(' pm2 reload...');
      await pm2.connect();
      await pm2.start(ecosystemPath);
      step('pm2 reload tamamlandı');
    }

    step(' Deploy tamamlandı!');
  } catch (err) {
    broadcast('deploy', { repo: req.params.name, message: ` Hata: ${err.message}` });
  }
});

// Repo sil
router.delete('/:name', (req, res) => {
  const { repoDir } = getConfig();
  const repoPath = path.join(repoDir, req.params.name);

  if (!fs.existsSync(repoPath)) {
    return res.status(404).json({ error: 'Repo bulunamadı' });
  }

  fs.rmSync(repoPath, { recursive: true, force: true });
  res.json({ success: true });
});

module.exports = router;
