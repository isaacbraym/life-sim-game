# 15 — Asset Authoring no Dev Tools

> O Dev Tools é a ferramenta de criação, não só de validação.
> Quando o desenvolvedor cria ou edita um asset e clica "Salvar",
> o Dev Tools grava diretamente no projeto via File System Access API.

---

## Princípio

O Dev Tools roda em `localhost:5174`. No Chrome/Edge, a
**File System Access API** (`window.showDirectoryPicker`) permite que
uma aplicação web leia e escreva em pastas do sistema de arquivos
local, com permissão explícita do usuário por sessão.

Isso elimina o ciclo "editar JSON → salvar manualmente → recarregar".
O desenvolvedor aponta a pasta raiz do projeto uma vez por sessão,
e daí o Dev Tools grava diretamente nos caminhos corretos.

---

## Sessão de authoring

```typescript
// packages/dev-tools/src/shared/ProjetoHandle.ts

let _pastaRaiz: FileSystemDirectoryHandle | undefined;

/** Pede ao usuário a pasta raiz do projeto (uma vez por sessão) */
export async function selecionarPastaRaiz(): Promise<FileSystemDirectoryHandle> {
  _pastaRaiz = await window.showDirectoryPicker({
    id:   'vida25d-raiz',
    mode: 'readwrite',
    startIn: 'documents',
  });
  return _pastaRaiz;
}

export function obterPastaRaiz(): FileSystemDirectoryHandle {
  if (!_pastaRaiz) throw new Error('Pasta raiz não selecionada. Chame selecionarPastaRaiz().');
  return _pastaRaiz;
}

/** Garante que uma pasta existe, criando se necessário */
export async function garantirPasta(
  base: FileSystemDirectoryHandle,
  ...caminho: string[]
): Promise<FileSystemDirectoryHandle> {
  let atual = base;
  for (const parte of caminho) {
    atual = await atual.getDirectoryHandle(parte, { create: true });
  }
  return atual;
}

/** Escreve um arquivo de texto (JSON, etc.) */
export async function escreverArquivo(
  pasta: FileSystemDirectoryHandle,
  nomeArquivo: string,
  conteudo: string,
): Promise<void> {
  const fileHandle = await pasta.getFileHandle(nomeArquivo, { create: true });
  const writable   = await fileHandle.createWritable();
  await writable.write(conteudo);
  await writable.close();
}

/** Escreve um arquivo binário (PNG, WebP) */
export async function escreverBinario(
  pasta: FileSystemDirectoryHandle,
  nomeArquivo: string,
  dados: ArrayBuffer,
): Promise<void> {
  const fileHandle = await pasta.getFileHandle(nomeArquivo, { create: true });
  const writable   = await fileHandle.createWritable();
  await writable.write(dados);
  await writable.close();
}
```

---

## Fallback: download de ZIP

Para Firefox ou quando o usuário recusar a permissão da API:

```typescript
// packages/dev-tools/src/shared/ZipExporter.ts
// Usa JSZip (adicionar ao package.json do dev-tools)

export async function exportarComoZip(
  arquivos: Array<{ caminho: string; conteudo: string | ArrayBuffer }>
): Promise<void> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  for (const { caminho, conteudo } of arquivos) {
    zip.file(caminho, conteudo);
  }
  const blob = await zip.generateAsync({ type: 'blob' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'vida25d-assets.zip';
  a.click();
  URL.revokeObjectURL(url);
}
```

---

## Fluxo de authoring de móvel

### 1. Criar novo asset de móvel

```
Dev Tools → aba "Furniture Viewer" → botão "Novo Móvel"
  → formulário:
      assetId      (ex: "sofa_azul_90s")
      furnitureId  (ex: "sofa_azul_90s") — pode ser igual ao assetId
      nome         (ex: "Sofá Azul Anos 90")
      categoria    (select: assento, mesa, cama, ...)
      era          (select: eighties, nineties, twothousands, modern)
      footprint    (largura × altura em tiles)
      preço, valorDeRevenda
      acoes[]      (multi-select das ações disponíveis)
      tags[]
```

### 2. Upload de sprites por direção

```
8 slots visuais em grade: N  NE  E  SE
                          S  SW  W  NW

Cada slot:
  - Área de drop: arrastar WebP para o slot
  - Preview imediato no canvas fixo (dimensões do footprint)
  - Indicador de anchor: crosshair amarela arrastável
  - Indicador de canvas: borda tracejada
  - Badge "✓" quando sprite carregado, "—" quando ausente
```

### 3. Ajuste de anchor e footprint

```
Anchor editor:
  - Crosshair arrastável sobre o sprite do slot 'S' (referência)
  - anchorPixelX e anchorPixelY atualizados em tempo real
  - Preview do tile de grid alinhado ao anchor

Footprint por direção:
  - Por padrão, footprint é simétrico (ex: 2×1 em todas as direções)
  - Toggle "footprint assimétrico" permite declarar exceções
    (ex: sofá 3×1 nas direções N/S, 1×3 nas direções E/W)
```

### 4. Salvar no projeto

```typescript
// Ao clicar "Salvar no Projeto":

async function salvarMovel(
  assetMetadata: FurnitureAssetMetadata,
  furnitureDef:  FurnitureDefinition,
  spritesPorDirecao: Map<DirecaoVisual, File>,
): Promise<void> {
  const raiz = obterPastaRaiz();

  // 1. Criar pasta content/furniture-assets/{assetId}/
  const pastaAsset = await garantirPasta(
    raiz, 'content', 'furniture-assets', assetMetadata.assetId
  );

  // 2. Escrever metadata.json
  await escreverArquivo(
    pastaAsset, 'metadata.json',
    JSON.stringify(assetMetadata, null, 2)
  );

  // 3. Escrever cada sprite WebP
  for (const [direcao, arquivo] of spritesPorDirecao) {
    const buffer = await arquivo.arrayBuffer();
    await escreverBinario(pastaAsset, `${direcao}.webp`, buffer);
  }

  // 4. Adicionar/atualizar entrada no catálogo da era
  const pastaCatalogo = await garantirPasta(
    raiz, 'content', 'furniture', furnitureDef.availability.startYear >= 2010
      ? 'modern'
      : furnitureDef.availability.startYear >= 2000 ? 'twothousands'
      : furnitureDef.availability.startYear >= 1990 ? 'nineties'
      : 'eighties'
  );
  await atualizarCatalogo(pastaCatalogo, furnitureDef);
}
```

---

## Fluxo de authoring de parte de personagem

Análogo ao móvel, mas salva em `content/character-parts/{tipo}/{partId}/`.

```
Dev Tools → aba "Character Proofer" → botão "Nova Parte"
  → formulário:
      partId, tipo (camada), era, tags
      canvasLargura, canvasAltura (pré-preenchido com padrão 64×96)
      anchorPixelX, anchorPixelY (pré-preenchido com padrão 32×90)

  → 8 slots de sprite (mesma UX do móvel)

  → overlay do rig:
      toggle "Mostrar joints"
      selecionar rigId de referência (ex: "base_adulto")
      joints aparecem sobrepostos aos sprites
      verificar visualmente se o encaixe está correto

  → botão "Salvar" → escreve em content/character-parts/{tipo}/{partId}/
```

---

## Fluxo de authoring de cômodo isométrico

```
Dev Tools → aba "Room Validator" → botão "Novo Cômodo ISO"
  → formulário: id, nome, larguraTiles × alturaTiles, era

  → Editor de tiles:
      grid visual clicável (tile renderizado em dimetric)
      click: alterna caminhavel/bloqueado
      click com móvel selecionado: posiciona móvel no tile
      os tiles bloqueados pelo móvel são calculados automaticamente
      via FurnitureDefinition.tamanhoGrid + DirecaoVisual

  → Editor de saídas:
      click num tile de borda → define SaidaIso
      select destino (comodo/mapa)

  → botão "Salvar" → escreve em content/locations-iso/{id}.json
```

---

## Inicialização da sessão de authoring

No `App.tsx` do Dev Tools, exibir um banner persistente:

```
┌─────────────────────────────────────────────────────────────┐
│ 📁 Pasta do projeto não selecionada.                         │
│ Selecione a pasta raiz para habilitar "Salvar no Projeto".   │
│                     [Selecionar pasta]                       │
└─────────────────────────────────────────────────────────────┘
```

Após seleção bem-sucedida: `✓ Conectado a: C:\PROJETOS\...\life-sim-game`

Sem a pasta selecionada, os botões de "Salvar no Projeto" ficam desabilitados.
O download de ZIP permanece sempre disponível como alternativa.

---

## Suporte a browsers

| Browser | File System Access API | Status no Dev Tools |
|---|---|---|
| Chrome 86+ | ✓ | Salvar direto no projeto |
| Edge 86+   | ✓ | Salvar direto no projeto |
| Firefox    | ✗ | Download ZIP automático |
| Safari 15.2+ | parcial | Download ZIP automático |

Detecção automática:
```typescript
export const SUPORTA_FILE_SYSTEM_ACCESS =
  typeof window !== 'undefined' && 'showDirectoryPicker' in window;
```

---

## Pacote adicional necessário no dev-tools

```json
// packages/dev-tools/package.json — adicionar em dependencies:
"jszip": "^3.10.0"
```

O `JSZip` é usado exclusivamente para o fallback de download.
Não entra no bundle de produção (dev-tools nunca vai para produção).
