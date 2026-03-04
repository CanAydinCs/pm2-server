const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');
const { createServer } = require('http');
const { initWS } = require('./utils/ws');

const authRoutes = require('./routes/auth');
const processRoutes = require('./routes/processes');
const repoRoutes = require('./routes/repos');
const logRoutes = require('./routes/logs');
const settingsRoutes = require('./routes/settings');

const config = require('./config.json');
const { authMiddleware } = require('./utils/auth');

const app = express();
const server = createServer(app);

initWS(server);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

const base = config.basePath;

// API route'lari once tanimla
app.use(`${base}/auth`,      authRoutes);
app.use(`${base}/api/processes`, authMiddleware, processRoutes);
app.use(`${base}/api/repos`,     authMiddleware, repoRoutes);
app.use(`${base}/api/logs`,      authMiddleware, logRoutes);
app.use(`${base}/api/settings`,  authMiddleware, settingsRoutes);

// Frontend statik dosyalari
app.use(base, express.static(path.join(__dirname, '../frontend/dist')));

// Tum diger istekleri frontend'e yonlendir
app.get(`${base}/{*path}`, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

server.listen(config.port, () => {
  console.log(`pm2-panel çalışıyor → http://localhost:${config.port}${base}`);
});
