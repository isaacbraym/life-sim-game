#!/usr/bin/env node
// Remove artefatos de compilação TS (.js/.js.map/.d.ts/.d.ts.map) que tenham
// vazado para dentro de packages/*/src. Esses arquivos são gitignored, mas o
// Vite os prefere sobre os .ts/.tsx por ordem de extensão, carregando código
// velho. Escopo restrito a packages/*/src — nunca toca content/, dist/, etc.
import { readdir, rm, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PACOTES = resolve(RAIZ, 'packages');
const EXTENSOES = ['.js', '.js.map', '.d.ts', '.d.ts.map'];

function ehArtefato(nome) {
  return EXTENSOES.some((ext) => nome.endsWith(ext));
}

async function coletar(dir, encontrados) {
  const entradas = await readdir(dir, { withFileTypes: true });
  for (const entrada of entradas) {
    const caminho = join(dir, entrada.name);
    if (entrada.isDirectory()) {
      await coletar(caminho, encontrados);
    } else if (entrada.isFile() && ehArtefato(entrada.name)) {
      encontrados.push(caminho);
    }
  }
}

async function principal() {
  if (!existsSync(PACOTES)) {
    console.error(`Pasta de pacotes não encontrada: ${PACOTES}`);
    process.exit(1);
  }

  const pacotes = await readdir(PACOTES, { withFileTypes: true });
  let total = 0;

  for (const pacote of pacotes) {
    if (!pacote.isDirectory()) continue;
    const src = join(PACOTES, pacote.name, 'src');
    if (!existsSync(src) || !(await stat(src)).isDirectory()) continue;

    const encontrados = [];
    await coletar(src, encontrados);
    for (const arquivo of encontrados) {
      await rm(arquivo, { force: true });
    }
    if (encontrados.length > 0) {
      console.log(`  ${pacote.name}/src: ${encontrados.length} artefato(s) removido(s)`);
    }
    total += encontrados.length;
  }

  console.log(total === 0 ? 'Nenhum artefato encontrado — src limpo.' : `Total removido: ${total}`);
}

principal().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
