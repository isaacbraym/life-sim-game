# 06 — Persistência: Dexie, IndexedDB, Save e Sync

## Decisão de stack

**Dexie.js sobre IndexedDB** é a escolha definitiva para persistência client-side. Justificativa em detalhe:

- **API moderna baseada em Promises** — muito mais ergonômica que IndexedDB cru
- **Queries indexadas fluentes** — `db.npcs.where('idade').between(20, 30).toArray()`
- **Schema migrations nativas** — `db.version(N).stores(...).upgrade(tx => ...)`
- **Multi-tab safe** — eventos de sync entre abas
- **`liveQuery` reativo** — integra com React via hook
- **22 KB minified** — peso aceitável
- **Comunidade ativa, 14k stars GitHub, 1M downloads/semana**

### Alternativas avaliadas e descartadas

- **localStorage/sessionStorage**: limite ~5-10MB, síncrono (bloqueia UI), API primitiva. **PROIBIDO** como save principal
- **LocalForage**: KV puro, sem queries indexadas. Bom só para cache, ruim para domínio rico
- **PouchDB**: overhead de revisões CouchDB-compatible degrada performance em datasets grandes
- **RxDB**: poder excessivo, custo de plugins premium, performance equivalente quando usado com Dexie storage
- **IndexedDB cru**: verbose demais, sem migrations builtin, sem Promises nativas

## Schema Dexie inicial (v1)

```typescript
// packages/core/src/persistence/GameDB.ts
import Dexie, { Table } from 'dexie';
import type { SaveSlot } from '@core/schemas/save';
import type { Character } from '@core/schemas/character';
import type { Npc } from '@core/schemas/npc';
import type { Event } from '@core/schemas/event';

export type EntradaLogEvento = {
  id?: number;  // auto-increment
  saveId: string;
  characterId: string;
  eventoId: string;
  ano: number;
  mes: number;
  idadeNoMomento: number;
  escolhaIndice: number;
  resultadoDado?: 'falha_critica' | 'falha' | 'sucesso' | 'sucesso_critico';
  rolagemD20?: number;
  efeitosAplicados: unknown[];  // Effect[]
  timestamp: number;
};

export type Relacionamento = {
  fromId: string;
  toId: string;
  tipo: string;
  afeto: number;
  saveId: string;
};

export class VidaGameDB extends Dexie {
  saves!: Table<SaveSlot, string>;
  characters!: Table<Character, string>;
  npcs!: Table<Npc, string>;
  events!: Table<EntradaLogEvento, number>;
  relationships!: Table<Relacionamento, [string, string]>;

  constructor() {
    super('Vida25DGame');

    // Versão 1 — schema inicial
    this.version(1).stores({
      saves: 'saveId, ultimaPartida',
      characters: 'characterId, saveId, idadeAtualMeses, [saveId+idadeAtualMeses]',
      npcs: 'npcId, saveId, persistencia, [saveId+persistencia]',
      events: '++id, saveId, characterId, ano, [saveId+ano], eventoId',
      relationships: '[fromId+toId], fromId, toId, tipo, saveId',
    });
  }
}

export const db = new VidaGameDB();
```

### Índices explicados

- `saves`: por `saveId` (PK) e `ultimaPartida` (ordenar por jogos recentes)
- `characters`: por `characterId` (PK), `saveId` (filtrar por save), `idadeAtualMeses` (queries por idade), compound `[saveId+idadeAtualMeses]`
- `npcs`: por `npcId`, `saveId`, `persistencia` (garbage collect descartáveis), compound `[saveId+persistencia]`
- `events`: auto-increment `id`, busca por `saveId+ano` (timeline)
- `relationships`: compound PK `[fromId+toId]`, queries por `fromId` (todos relacionamentos de um NPC)

## Padrão de migrações

Toda mudança de schema gera nova versão Dexie. Versões antigas são mantidas no código para usuários que voltam após meses sem jogar (Dexie aplica todas em sequência automaticamente).

Exemplo de evolução:

```typescript
// packages/core/src/persistence/migrations/v2.ts
this.version(2).stores({
  // Adiciona índice em campo "categoria" de events
  events: '++id, saveId, characterId, ano, categoria, [saveId+ano], [saveId+categoria], eventoId',
}).upgrade(tx => {
  return tx.table('events').toCollection().modify(e => {
    e.categoria = inferirCategoriaDeEventoLegacy(e.eventoId);
  });
});

// v3: adiciona campo "fama" em characters
this.version(3).stores({
  characters: 'characterId, saveId, idadeAtualMeses, fama, [saveId+idadeAtualMeses]',
}).upgrade(tx => {
  return tx.table('characters').toCollection().modify(c => {
    c.fama = 0;
  });
});
```

**Regras invioláveis de migração**:

1. **Forward-only**: versões Dexie são uint32 monotonicamente crescentes, nunca diminua
2. **Nunca delete tabelas em versão menor que `v3`**: usuários podem ainda estar na v1
3. **Migração deve ser idempotente**: se rodar duas vezes, resultado deve ser o mesmo
4. **Migração pesada (>10k entities) precisa de UI de progresso**: bloquear UI por minutos é inaceitável
5. **CHANGELOG entry obrigatória**: documente cada migração com data, motivo, impacto

## Export e import de save

Capacidade essencial para o jogador: poder baixar seu save como arquivo JSON e re-importar em outro dispositivo (ou após reinstalar o jogo, ou após perder save por inatividade no iOS).

```typescript
// packages/core/src/persistence/exporters.ts
import { db } from './GameDB';
import { SaveSlot } from '@core/schemas/save';
import { sha256 } from '@core/utils/hash';

export type PayloadExport = {
  schemaVersion: string;
  exportedAt: string;
  checksum: string;
  save: SaveSlot;
  character: Character;
  npcs: Npc[];
  events: EntradaLogEvento[];
  relationships: Relacionamento[];
};

export async function exportarSave(saveId: string): Promise<Blob> {
  const save = await db.saves.get(saveId);
  if (!save) throw new Error(`Save ${saveId} não encontrado`);

  const character = await db.characters
    .where('saveId').equals(saveId).first();
  const npcs = await db.npcs
    .where('saveId').equals(saveId).toArray();
  const events = await db.events
    .where('saveId').equals(saveId).toArray();
  const relationships = await db.relationships
    .where('saveId').equals(saveId).toArray();

  const payload: Omit<PayloadExport, 'checksum'> = {
    schemaVersion: 'v1',
    exportedAt: new Date().toISOString(),
    save,
    character: character!,
    npcs,
    events,
    relationships,
  };

  const serializado = JSON.stringify(payload);
  const checksum = await sha256(serializado);

  const payloadFinal: PayloadExport = { ...payload, checksum };
  return new Blob([JSON.stringify(payloadFinal, null, 2)], {
    type: 'application/json',
  });
}

export async function importarSave(blob: Blob): Promise<void> {
  const texto = await blob.text();
  const payload: PayloadExport = JSON.parse(texto);

  // Verificar checksum
  const semChecksum = { ...payload, checksum: undefined };
  const checksumCalculado = await sha256(JSON.stringify(semChecksum));
  if (checksumCalculado !== payload.checksum) {
    throw new Error('Save corrompido (checksum inválido)');
  }

  // Validar schema com Zod
  // ... (omitido por brevidade, mas obrigatório)

  // Inserir em transação
  await db.transaction('rw',
    [db.saves, db.characters, db.npcs, db.events, db.relationships],
    async () => {
      await db.saves.put(payload.save);
      await db.characters.put(payload.character);
      await db.npcs.bulkPut(payload.npcs);
      await db.events.bulkPut(payload.events);
      await db.relationships.bulkPut(payload.relationships);
    }
  );
}
```

### UI de export/import

Na tela de configurações, dois botões:

- **Baixar backup deste save** → chama `exportarSave(saveIdAtual)`, dispara download via `URL.createObjectURL(blob)` + `<a download>`
- **Restaurar de arquivo** → file picker, valida, importa, oferece sobrescrever vs novo slot

## Auto-backup e double-buffering

### Auto-backup periódico

A cada N anos in-game (configurável, default 10), gera snapshot serializado em slot separado:

```typescript
// packages/core/src/persistence/autoBackup.ts
export async function tentarAutoBackup(saveId: string, anosDesdeUltimoBackup: number) {
  if (anosDesdeUltimoBackup < 10) return;
  const blob = await exportarSave(saveId);
  await db.backups.put({
    backupId: crypto.randomUUID(),
    saveId,
    timestamp: Date.now(),
    payload: blob,
  });
  // Manter no máximo 3 backups por save (FIFO)
  await limparBackupsAntigos(saveId);
}
```

### Double-buffered save slots

Ao salvar progresso, escreva primeiro em slot temporário, valide, depois renomeie atomicamente:

```typescript
export async function salvarSave(save: SaveSlot): Promise<void> {
  const tempId = `${save.saveId}_pending`;

  // 1. Escreve em slot temporário
  await db.saves.put({ ...save, saveId: tempId });

  // 2. Valida
  const recuperado = await db.saves.get(tempId);
  if (!recuperado) throw new Error('Save temp não persistiu');

  // 3. Substitui atomicamente
  await db.transaction('rw', db.saves, async () => {
    await db.saves.put(save);
    await db.saves.delete(tempId);
  });
}
```

## Hash de integridade

Todo save mantém hash do conteúdo, recalculado a cada save e verificado a cada load:

- Se hash bate → save válido, prossegue
- Se hash não bate → save potencialmente corrompido, oferece restaurar de backup

Implementação simples via Web Crypto API:

```typescript
async function sha256(texto: string): Promise<string> {
  const buffer = new TextEncoder().encode(texto);
  const hash = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
```

## Limites de armazenamento PWA por plataforma

### Chrome / Edge / Brave (Chromium)

- Cota por origem: ~60% do espaço livre em disco
- Eviction só quando sistema fica sem espaço
- `navigator.storage.persist()` solicita persistência (geralmente concedida em PWAs instaladas)

### Firefox

- Cota similar a Chromium
- 50% do espaço livre como limite global, default ~20% por origem
- `navigator.storage.persist()` protege de eviction

### Safari iOS (CRÍTICO — onde mora o risco)

- **PWA não instalada (aberta em Safari como link)**: dados podem ser apagados após **7 dias de inatividade**
- **PWA instalada via "Adicionar à Tela de Início"**: regra mais permissiva, mas ainda existe heurística de eviction quando iOS precisa de espaço
- Cap teórico: 20% do disco para WebViews, até 80% para Safari como browser app
- **Cache API**: limite agressivo ~50 MB (não usar para conteúdo essencial no iOS)
- **Background Sync**: NÃO SUPORTADO

### Mitigações obrigatórias para iOS

1. **Tela de onboarding educativa** explicando instalação como app (compartilhar → adicionar à tela de início)
2. **Aviso visual periódico** lembrando de baixar backup ("seu save fica neste dispositivo; baixe um backup se for trocar de celular")
3. **Auto-export semanal** sugerido em popup (não obrigatório, mas insistente)
4. **`navigator.storage.persist()`** chamado na primeira interação significativa
5. **Detectar iOS** e mostrar instruções específicas; outros browsers têm prompt nativo

```typescript
// Chamar logo após o jogador completar criação de personagem
async function solicitarPersistencia() {
  if (navigator.storage && navigator.storage.persist) {
    const concedido = await navigator.storage.persist();
    if (!concedido) {
      mostrarAvisoBackup();
    }
  }
}
```

## Sync futuro com backend (Fase 4)

Quando o backend FastAPI + PostgreSQL ativar na Fase 4, o sync é opt-in (jogador escolhe criar conta).

### Modelo: last-write-wins por entidade

**Não tentamos sync per-field bidirectional** — é uma toca de coelho que esmaga indie solo. Em vez disso:

- Cada entidade tem `updatedAt: number` (timestamp Unix)
- Cliente faz `POST /sync/upload` enviando entidades modificadas desde último sync
- Servidor compara timestamps, mantém versão mais recente
- Cliente faz `GET /sync/download?since=ts` baixando atualizações do servidor (raro em single-player, mas útil em multi-device)
- Conflitos extremos: oferecer ao jogador escolher manualmente qual versão manter

### Hooks Dexie para captura de dirty entities

Dexie tem hooks (`db.npcs.hook('creating', ...)`, `.hook('updating', ...)`) que facilitam capturar mudanças e marcar como "pendente de sync":

```typescript
db.npcs.hook('creating', (primKey, obj) => {
  obj.updatedAt = Date.now();
  obj.syncStatus = 'pendente';
});

db.npcs.hook('updating', (mods, primKey, obj) => {
  return { ...mods, updatedAt: Date.now(), syncStatus: 'pendente' };
});
```

## Tratamento de QuotaExceededError

Quando o navegador rejeita escrita por falta de espaço:

```typescript
try {
  await db.events.add(novoEvento);
} catch (e) {
  if (e.name === 'QuotaExceededError') {
    // Tenta compactação: remove eventos antigos consolidados
    await compactarHistoricoAntigo(saveId);
    try {
      await db.events.add(novoEvento);
    } catch {
      mostrarErroEspacoSemSaida();
    }
  } else {
    throw e;
  }
}
```

### Compactação de histórico

Para saves muito longos (personagem viveu 80 anos com ritmo mensal = ~960 eventos principais + ~10x mini-eventos), implementar compactação:

- Eventos com mais de 20 anos in-game: mantém apenas log resumido (sem detalhes de cena gerada)
- Eventos com mais de 40 anos: sumariza em "década resumida"
- Cena gerada original (quando reproduzida em flashbacks) é regerada do banco de cenas + JSON do evento

## Resumo das decisões críticas

1. **Dexie é a única biblioteca de persistência**. Sem exceção.
2. **localStorage e sessionStorage** são proibidos para save principal; só para flags efêmeras de UI (último tab selecionado, theme, etc.)
3. **Toda mudança de schema bumpa versão Dexie**, com migração obrigatória
4. **Hash de integridade obrigatório** em todo save
5. **Auto-backup periódico** + **double-buffered save slots** + **persistent storage solicitado**
6. **iOS é o pior cenário**; UI educativa de instalação como app é não-negociável
7. **Sync com backend** é fase 4, last-write-wins, sem sync per-field
