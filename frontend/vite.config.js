import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/pm2/master',
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/pm2/master/auth':      'http://localhost:1881',
      '/pm2/master/processes': 'http://localhost:1881',
      '/pm2/master/repos':     'http://localhost:1881',
      '/pm2/master/logs':      'http://localhost:1881',
      '/pm2/master/settings':  'http://localhost:1881',
      '/pm2/master/ws': {
        target: 'ws://localhost:1881',
        ws: true,
      },
    },
  },
});
