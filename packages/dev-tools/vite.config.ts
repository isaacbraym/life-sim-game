import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { createReadStream, existsSync } from 'node:fs';
import { readFile, rm, writeFile } from 'node:fs/promises';
import type { IncomingMessage } from 'node:http';
import { extname, join, relative, sep } from 'node:path';

const TIPOS_MIME: Record<string, string> = {
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

function enviarJson(res: { statusCode: number; setHeader(name: string, value: string): void; end(body: string): void }, status: number, corpo: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(corpo));
}

function caminhoDentroDe(base: string, alvo: string): boolean {
  const relativo = relative(base, alvo);
  return relativo === '' || (!relativo.startsWith('..') && !relativo.startsWith(sep));
}

async function lerJsonDoRequest(req: IncomingMessage): Promise<unknown> {
  const partes: Buffer[] = [];
  for await (const parte of req) {
    partes.push(typeof parte === 'string' ? Buffer.from(parte) : parte);
  }
  return JSON.parse(Buffer.concat(partes).toString('utf-8')) as unknown;
}

function validarCaminhoCatalogo(valor: unknown): string[] {
  if (!Array.isArray(valor) || valor.length === 0) {
    throw new Error('catalogoPath invalido.');
  }

  return valor.map((parte) => {
    if (
      typeof parte !== 'string'
      || parte.length === 0
      || parte.includes('/')
      || parte.includes('\\')
      || parte === '.'
      || parte === '..'
    ) {
      throw new Error('catalogoPath contem segmento invalido.');
    }
    return parte;
  });
}

function validarTexto(valor: unknown, campo: string): string {
  if (typeof valor !== 'string' || valor.trim().length === 0) {
    throw new Error(`${campo} invalido.`);
  }
  return valor;
}

function caminhosIguais(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((parte, indice) => parte === b[indice]);
}

function entradaPertenceAoMovel(entrada: unknown, furnitureId: string, assetId: string): boolean {
  if (typeof entrada !== 'object' || entrada === null) return false;
  const item = entrada as Record<string, unknown>;
  return item.id === furnitureId || item.assetId === assetId;
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'serve-content',
      configureServer(server) {
        const raizProjeto = resolve(__dirname, '../..');
        const raizConteudo = resolve(__dirname, '../../content');

        server.middlewares.use('/__devtools/furniture/delete', async (req, res) => {
          if (req.method !== 'POST') {
            enviarJson(res, 405, { ok: false, erro: 'Metodo nao permitido.' });
            return;
          }

          try {
            const corpo = await lerJsonDoRequest(req);
            if (typeof corpo !== 'object' || corpo === null) {
              throw new Error('Corpo JSON invalido.');
            }

            const registro = corpo as Record<string, unknown>;
            const furnitureId = validarTexto(registro.furnitureId, 'furnitureId');
            const assetId = validarTexto(registro.assetId, 'assetId');
            const catalogoPath = validarCaminhoCatalogo(registro.catalogoPath);
            const caminhoCatalogo = resolve(raizProjeto, ...catalogoPath);

            if (!caminhoDentroDe(raizConteudo, caminhoCatalogo)) {
              throw new Error('Catalogo fora de content/.');
            }

            const textoCatalogo = await readFile(caminhoCatalogo, 'utf-8');
            const dadosCatalogo: unknown = JSON.parse(textoCatalogo);
            if (!Array.isArray(dadosCatalogo)) {
              throw new Error('Catalogo precisa ser uma lista JSON.');
            }

            const catalogoAtualizado = dadosCatalogo.filter((entrada) => {
              if (typeof entrada !== 'object' || entrada === null) return true;
              const item = entrada as Record<string, unknown>;
              return item.id !== furnitureId && item.assetId !== assetId;
            });

            if (catalogoAtualizado.length === dadosCatalogo.length) {
              enviarJson(res, 404, { ok: false, erro: 'Movel nao encontrado no catalogo.' });
              return;
            }

            await writeFile(caminhoCatalogo, `${JSON.stringify(catalogoAtualizado, null, 2)}\n`, 'utf-8');

            const pastaAsset = resolve(raizConteudo, 'furniture-assets', assetId);
            if (!caminhoDentroDe(resolve(raizConteudo, 'furniture-assets'), pastaAsset)) {
              throw new Error('Asset fora de content/furniture-assets/.');
            }
            await rm(pastaAsset, { recursive: true, force: true });

            enviarJson(res, 200, { ok: true });
          } catch (erro) {
            enviarJson(res, 500, {
              ok: false,
              erro: erro instanceof Error ? erro.message : String(erro),
            });
          }
        });

        server.middlewares.use('/__devtools/furniture/update', async (req, res) => {
          if (req.method !== 'POST') {
            enviarJson(res, 405, { ok: false, erro: 'Metodo nao permitido.' });
            return;
          }

          try {
            const corpo = await lerJsonDoRequest(req);
            if (typeof corpo !== 'object' || corpo === null) {
              throw new Error('Corpo JSON invalido.');
            }

            const registro = corpo as Record<string, unknown>;
            const furnitureId = validarTexto(registro.furnitureId, 'furnitureId');
            const assetId = validarTexto(registro.assetId, 'assetId');
            const origemCatalogoPath = validarCaminhoCatalogo(registro.origemCatalogoPath);
            const destinoCatalogoPath = validarCaminhoCatalogo(registro.destinoCatalogoPath);
            const movel = registro.movel;

            if (typeof movel !== 'object' || movel === null) {
              throw new Error('movel invalido.');
            }

            const movelRegistro = movel as Record<string, unknown>;
            if (movelRegistro.id !== furnitureId || movelRegistro.assetId !== assetId) {
              throw new Error('movel nao corresponde ao id/assetId informado.');
            }

            const caminhoOrigem = resolve(raizProjeto, ...origemCatalogoPath);
            const caminhoDestino = resolve(raizProjeto, ...destinoCatalogoPath);
            if (!caminhoDentroDe(raizConteudo, caminhoOrigem) || !caminhoDentroDe(raizConteudo, caminhoDestino)) {
              throw new Error('Catalogo fora de content/.');
            }

            const textoOrigem = await readFile(caminhoOrigem, 'utf-8');
            const dadosOrigem: unknown = JSON.parse(textoOrigem);
            if (!Array.isArray(dadosOrigem)) {
              throw new Error('Catalogo de origem precisa ser uma lista JSON.');
            }

            if (caminhosIguais(origemCatalogoPath, destinoCatalogoPath)) {
              let substituiu = false;
              const catalogoAtualizado = dadosOrigem.map((entrada) => {
                if (!entradaPertenceAoMovel(entrada, furnitureId, assetId)) return entrada;
                substituiu = true;
                return movel;
              });

              if (!substituiu) {
                enviarJson(res, 404, { ok: false, erro: 'Movel nao encontrado no catalogo.' });
                return;
              }

              await writeFile(caminhoOrigem, `${JSON.stringify(catalogoAtualizado, null, 2)}\n`, 'utf-8');
              enviarJson(res, 200, { ok: true });
              return;
            }

            const origemAtualizada = dadosOrigem.filter((entrada) =>
              !entradaPertenceAoMovel(entrada, furnitureId, assetId)
            );

            if (origemAtualizada.length === dadosOrigem.length) {
              enviarJson(res, 404, { ok: false, erro: 'Movel nao encontrado no catalogo.' });
              return;
            }

            const textoDestino = await readFile(caminhoDestino, 'utf-8');
            const dadosDestino: unknown = JSON.parse(textoDestino);
            if (!Array.isArray(dadosDestino)) {
              throw new Error('Catalogo de destino precisa ser uma lista JSON.');
            }

            const destinoAtualizado = dadosDestino.filter((entrada) =>
              !entradaPertenceAoMovel(entrada, furnitureId, assetId)
            );

            await writeFile(caminhoOrigem, `${JSON.stringify(origemAtualizada, null, 2)}\n`, 'utf-8');
            await writeFile(caminhoDestino, `${JSON.stringify([...destinoAtualizado, movel], null, 2)}\n`, 'utf-8');
            enviarJson(res, 200, { ok: true });
          } catch (erro) {
            enviarJson(res, 500, {
              ok: false,
              erro: erro instanceof Error ? erro.message : String(erro),
            });
          }
        });

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
