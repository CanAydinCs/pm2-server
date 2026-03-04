const simpleGit = require('simple-git');
const fs = require('fs');
const path = require('path');

// Repoyu clone et
async function cloneRepo(repoUrl, targetPath) {
  const git = simpleGit();
  await git.clone(repoUrl, targetPath);
  return targetPath;
}

// Mevcut repoyu güncelle
async function pullRepo(repoPath) {
  const git = simpleGit(repoPath);
  const result = await git.pull();
  return result;
}

// Ecosystem dosyasını tespit et
function findEcosystem(repoPath) {
  const candidates = [
    'ecosystem.config.js',
    'ecosystem.config.cjs',
    'ecosystem.json',
  ];
  for (const file of candidates) {
    const full = path.join(repoPath, file);
    if (fs.existsSync(full)) return full;
  }
  return null;
}

// Ecosystem dosyasını oku ve parse et
function parseEcosystem(ecosystemPath) {
  try {
    // require() cache'i temizle — her çağrıda taze okusun
    delete require.cache[require.resolve(ecosystemPath)];
    const config = require(ecosystemPath);
    return config.apps || null;
  } catch (err) {
    return null;
  }
}

// Repo dizinindeki tüm projeleri listele
function listRepos(repoDir) {
  if (!fs.existsSync(repoDir)) return [];
  return fs.readdirSync(repoDir)
    .filter((name) => {
      const full = path.join(repoDir, name);
      return fs.statSync(full).isDirectory() && fs.existsSync(path.join(full, '.git'));
    })
    .map((name) => {
      const full = path.join(repoDir, name);
      const ecosystem = findEcosystem(full);
      return {
        name,
        path: full,
        hasEcosystem: !!ecosystem,
        ecosystemPath: ecosystem,
      };
    });
}

module.exports = { cloneRepo, pullRepo, findEcosystem, parseEcosystem, listRepos };
