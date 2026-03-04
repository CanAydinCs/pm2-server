const router = require('express').Router();
const pm2 = require('../utils/pm2');

// Tüm processleri listele
router.get('/', async (req, res) => {
  try {
    await pm2.connect();
    const list = await pm2.list();
    const simplified = list.map((p) => ({
      pid:        p.pid,
      name:       p.name,
      status:     p.pm2_env?.status,
      cpu:        p.monit?.cpu,
      memory:     p.monit?.memory,
      uptime:     p.pm2_env?.pm_uptime,
      restarts:   p.pm2_env?.restart_time,
      pm_id:      p.pm_id,
      script:     p.pm2_env?.pm_exec_path,
      cwd:        p.pm2_env?.pm_cwd,
      ecosystem:  p.pm2_env?.pm_exec_path,
    }));
    res.json(simplified);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tek process detayı
router.get('/:name', async (req, res) => {
  try {
    await pm2.connect();
    const desc = await pm2.describe(req.params.name);
    res.json(desc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Durdur
router.post('/:name/stop', async (req, res) => {
  try {
    await pm2.connect();
    await pm2.stop(req.params.name);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Başlat / Yeniden başlat
router.post('/:name/restart', async (req, res) => {
  try {
    await pm2.connect();
    await pm2.restart(req.params.name);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sıfır kesinti reload
router.post('/:name/reload', async (req, res) => {
  try {
    await pm2.connect();
    await pm2.reload(req.params.name);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sil
router.delete('/:name', async (req, res) => {
  try {
    await pm2.connect();
    await pm2.del(req.params.name);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ecosystem dosyasından başlat
router.post('/start', async (req, res) => {
  try {
    const { ecosystemPath } = req.body;
    if (!ecosystemPath) return res.status(400).json({ error: 'ecosystemPath gerekli' });
    await pm2.connect();
    await pm2.start(ecosystemPath);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
