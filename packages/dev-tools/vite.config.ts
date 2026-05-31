import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { devtoolsRoutes } from './vite.devtools-routes';

export default defineConfig({
  plugins: [react(), ...devtoolsRoutes()],
  resolve: {
    alias: {
      '@core': resolve(__dirname, '../core/src'),
      '@game': resolve(__dirname, '../game/src'),
    },
  },
  server: { port: 5174 },
});
