import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { createReadStream, existsSync } from 'node:fs';
import { extname, join } from 'node:path';

const TIPOS_MIME: Record<string, string> = {
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'serve-content',
      configureServer(server) {
        const raizConteudo = resolve(__dirname, '../../content');
        // Serve content/ em /content/ para fetch() nos dev-tools
        server.middlewares.use('/content', (req, res, next) => {
          const reqUrl = (req as { url?: string }).url ?? '/';
          const caminhoArquivo = join(raizConteudo, decodeURIComponent(reqUrl));
          if (!existsSync(caminhoArquivo)) {
            next();
            return;
          }
          const tipoMime = TIPOS_MIME[extname(caminhoArquivo)] ?? 'application/octet-stream';
          res.setHeader('Content-Type', tipoMime);
          res.setHeader('Cache-Control', 'no-cache');
          createReadStream(caminhoArquivo).pipe(res);
        });
      },
    },
  ],
  resolve: {
    alias: {
      '@core': resolve(__dirname, '../core/src'),
    },
  },
  server: { port: 5174 },
});
