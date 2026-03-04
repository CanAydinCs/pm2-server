const router = require('express').Router();
const pm2 = require('../utils/pm2');
const { getWSS } = require('../utils/ws');

// Son N satır log getir
router.get('/:name', async (req, res) => {
  try {
    await pm2.connect();
    const desc = await pm2.describe(req.params.name);
    if (!desc || desc.length === 0) {
      return res.status(404).json({ error: 'Process bulunamadi' });
    }

    const proc = desc[0];
    const outLog = proc.pm2_env?.pm_out_log_path;
    const errLog = proc.pm2_env?.pm_err_log_path;

    res.json({ outLog, errLog });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// WebSocket üzerinden canlı log stream
// Frontend ws://host/pm2/master/ws adresine baglanir
// { type: "subscribe_logs", name: "proje-adi" } mesaji gonderir
// Backend pm2 bus üzerinden logu dinleyip broadcast eder

router.post('/:name/stream/start', async (req, res) => {
  try {
    await pm2.connect();
    const wss = getWSS();

    pm2.raw().launchBus((err, bus) => {
      if (err) return res.status(500).json({ error: err.message });

      bus.on('log:out', (data) => {
        if (data.process?.name !== req.params.name) return;
        wss.clients.forEach((client) => {
          if (client.readyState === 1) {
            client.send(JSON.stringify({
              type: 'log',
              stream: 'out',
              name: req.params.name,
              data: data.data,
            }));
          }
        });
      });

      bus.on('log:err', (data) => {
        if (data.process?.name !== req.params.name) return;
        wss.clients.forEach((client) => {
          if (client.readyState === 1) {
            client.send(JSON.stringify({
              type: 'log',
              stream: 'err',
              name: req.params.name,
              data: data.data,
            }));
          }
        });
      });
    });

    res.json({ success: true, message: 'Log stream baslatildi' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
