const router = require('express').Router();
const pm2 = require('../utils/pm2');
const { getWSS } = require('../utils/ws');
const fs = require('fs');
const path = require('path');

// Son N satır log getir

router.get('/:name', async (req, res) => {
  try {
    await pm2.connect();
    const desc = await pm2.describe(req.params.name);
    if (!desc || desc.length === 0) {
      return res.status(404).json({ error: 'Process bulunamadi' });
    }

    const proc = desc[0];
    const outLogPath = proc.pm2_env?.pm_out_log_path;
    const errLogPath = proc.pm2_env?.pm_err_log_path;

    // Read log file contents if they exist
    let outLogs = [];
    let errLogs = [];
    
    if (outLogPath && fs.existsSync(outLogPath)) {
      try {
        const outContent = fs.readFileSync(outLogPath, 'utf-8');
        // Get last 500 lines
        outLogs = outContent.split('\n').slice(-500).filter(line => line.trim());
      } catch (e) {
        console.error('Error reading out log:', e.message);
      }
    }

    if (errLogPath && fs.existsSync(errLogPath)) {
      try {
        const errContent = fs.readFileSync(errLogPath, 'utf-8');
        // Get last 500 lines
        errLogs = errContent.split('\n').slice(-500).filter(line => line.trim());
      } catch (e) {
        console.error('Error reading err log:', e.message);
      }
    }

    res.json({ 
      outLogs, 
      errLogs,
      hasLogs: outLogs.length > 0 || errLogs.length > 0
    });
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

// Test log endpoint for debugging - returns sample logs
router.get('/test/:name', async (req, res) => {
  try {
    const sampleLogs = [];
    const now = new Date();
    
    for (let i = 0; i < 10; i++) {
      sampleLogs.push({
        text: `[${req.params.name}] Test log message ${i + 1} - Sample output for testing`,
        stream: i % 3 === 0 ? 'err' : 'out',
        time: new Date(now.getTime() - (9 - i) * 1000).toLocaleTimeString()
      });
    }
    
    res.json({ outLogs: sampleLogs.map(l => l.text), errLogs: [], hasLogs: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
