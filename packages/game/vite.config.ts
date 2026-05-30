import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'serve-content',
      configureServer(server) {
        server.middlewares.use('/content', (req, res, next) => {
          const arquivo = path.resolve(
            __dirname, '../../content',
            (req.url ?? '').replace(/^\//, '')
          );
          if (fs.existsSync(arquivo)) {
            const tipo = arquivo.endsWith('.json')
              ? 'application/json'
              : arquivo.endsWith('.webp')
                ? 'image/webp'
                : 'application/octet-stream';
            res.setHeader('Content-Type', tipo);
            fs.createReadStream(arquivo).pipe(res);
          } else {
            next();
          }
        });
      },
    },
  ],
  resolve: {
    alias: {
      '@core': resolve(__dirname, '../core/src'),
      '@game': resolve(__dirname, './src'),
    },
  },
});
