module.exports = {
  apps: [{
    name: 'pm2-panel',
    script: './backend/index.js',
    cwd: './',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    env: {
      NODE_ENV: 'production',
      JWT_SECRET: '***guclu-bir-secret-yaz***',
    },
  }],
};
