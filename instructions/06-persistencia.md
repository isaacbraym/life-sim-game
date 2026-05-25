# 06 — Persistência

## Princípio

IndexedDB via Dexie.js é o único storage de save. `localStorage` e `sessionStorage` são proibidos para dados de jogo. Apenas flags efêmeras de UI podem usar `sessionStorage`.

Save é sagrado: auto-backup, double-buffered write, hash de integridade SHA-256, export/import JSON.

## Schema Dexie v3 (atual)

```typescript
import Dexie, { Table } from 'dexie';

class GameDB extends Dexie {
  // saves
  saves!: Table<SaveRecord>;
  characters!: Table<CharacterRecord>;
  npcs!: Table<NpcRecord>;

  // eventos e log
  eventFlags!: Table<EventFlagRecord>;
  lifeLog!: Table<LogEntry>;
  progressao!: Table<ProgressaoRecord>;

  // exploração e casa
  homeSave!: Table<HomeSaveRecord>;
  locationState!: Table<LocationStateRecord>;

  // autosave buffer
  autosaveBuffer!: Table<AutosaveRecord>;

  constructor() {
    super('LifeSimDB');
    this.version(3).stores({
      saves:          '&id, criadoEm, atualizadoEm, personagemNome',
      characters:     '&saveId',
      npcs:           '[saveId+npcId], saveId, papel',
      eventFlags:     '[saveId+flag], saveId',
      lifeLog:        '++id, saveId, camada, anoJogo, mesJogo, *tags',
      progressao:     '&saveId',
      homeSave:       '&saveId',
      locationState:  '&saveId',
      autosaveBuffer: '&saveId',
    });
  }
}

export const db = new GameDB();
```

## Tabelas detalhadas

### saves

```typescript
type SaveRecord = {
  id: string;                    // UUID
  criadoEm: number;              // timestamp ms
  atualizadoEm: number;
  personagemNome: string;
  personagemIdade: number;
  anoJogo: number;
  mesJogo: number;
  faseDeVida: LifePhaseEnum;
  hashIntegridade: string;       // SHA-256 do save serializado
  versaoSchema: number;          // para migrations
  thumbnail?: string;            // base64 screenshot opcional
};
```

### characters

```typescript
type CharacterRecord = {
  saveId: string;
  birthProfile: BirthProfile;
  atributosGeneticos: AtributosBase;
  atributos: AtributosBase;
  idade: number;
  anoNascimento: number;
  mesNascimento: number;
  dinheiro: number;
  humor: number;
  energia: number;
  saude: number;
  faseDeVidaAtual: LifePhaseEnum;
  profissaoAtual: string | undefined;
  salarioMensal: number;
  currentLocationId: string | undefined;
  currentRoomId: string | undefined;
  lastVisitedLocationId: string | undefined;
  flags: string[];               // flags ativas
};
```

### npcs

```typescript
type NpcRecord = {
  saveId: string;
  npcId: string;
  papel: string;
  persistencia: NpcPersistenciaEnum;
  vivo: boolean;
  nome: string;
  idade: number;
  tracosFixos: TracosFixos;
  tracosVariaveis: TracosVariaveis;
  atributos: AtributosBase | undefined;
  profissaoAtual: string;
  relacionamentoComJogador: number;
  ultimaInteracaoAno: number | undefined;
  ultimaInteracaoMes: number | undefined;
  linhaDoTempo: string[];        // log de eventos compartilhados
};
```

### lifeLog

```typescript
// LogEntry (do schema canônico 03-schemas-canonicos.md)
// Indexado por camada para queries eficientes por tipo
// Indexado por [anoJogo, mesJogo] para resumos periódicos
// Tags indexadas para busca por NPC, local, tipo de evento
```

### progressao

```typescript
type ProgressaoRecord = {
  saveId: string;
  contadores: Record<string, number>;     // { 'treinosNoMes': 4, 'faltasEscola': 2 }
  marcadores: Record<string, boolean>;    // { 'rotinaDeTreinoAtiva': true }
  ultimoReset: Record<string, number>;    // timestamp último reset por contador
  habilidades: Record<string, number>;    // { 'culinaria': 2, 'musica': 1 }
};
```

### homeSave

```typescript
type HomeSaveRecord = {
  saveId: string;
  houseId: string;
  aluguelMensal: number;
  ultimoPagamentoAluguel: number;        // anoJogo * 100 + mesJogo
  movelComprados: string[];              // IDs de FurnitureDefinition
  movelPosicionados: PlacedFurniture[];
  movelNoInventario: string[];           // comprados mas não posicionados
  valorEstimadoImovel: number;
};
```

### locationState

```typescript
type LocationStateRecord = {
  saveId: string;
  estadoNpcsNoLocal: Record<string, {    // por localId
    npcId: string;
    slot: string;
    posicaoAtual: { x: number; y: number };
  }[]>;
  objetosInteragidosHoje: string[];      // IDs de InteractableObject
  visitasNoMes: Record<string, number>;  // { 'academia': 3, 'escola': 12 }
};
```

### autosaveBuffer

Double-buffered save: o jogo escreve no buffer primeiro; só após validação troca com o save principal. Evita corrupção por crash durante escrita.

```typescript
type AutosaveRecord = {
  saveId: string;
  timestamp: number;
  payload: string;                       // JSON serializado do estado completo
  hash: string;
  validado: boolean;
};
```

## Estratégia de persistência

### Zustand → Dexie via subscribe seletivo

Nunca use o middleware `persist` padrão do Zustand com dados grandes — causa contenção no main thread ao serializar >1MB por ação.

```typescript
// progressão: debounce 1.5s
useGameStore.subscribe(
  s => s.progressao,
  debounce(async (prog) => {
    await db.progressao.put({ saveId: estadoAtual.saveId, ...prog });
  }, 1500)
);

// posição do personagem: debounce 3s (muda com frequência)
useGameStore.subscribe(
  s => ({ x: s.jogador.posicao.x, y: s.jogador.posicao.y }),
  debounce(async (pos) => {
    await db.characters.update(estadoAtual.saveId, { posicaoAtual: pos });
  }, 3000)
);
```

### Autosave em eventos importantes

Salvar imediatamente (sem debounce) quando `narrativeWeight === 'major'`:

```typescript
async function salvarEstadoCompleto(saveId: string): Promise<void> {
  const payload = serializarEstadoCompleto(useGameStore.getState());
  const hash = await calcularSHA256(payload);

  // escreve no buffer primeiro
  await db.autosaveBuffer.put({ saveId, timestamp: Date.now(), payload, hash, validado: false });

  // valida
  const estadoParsed = deserializarEstado(payload);
  if (validarEstado(estadoParsed)) {
    await db.autosaveBuffer.update(saveId, { validado: true });
    await db.saves.update(saveId, { atualizadoEm: Date.now(), hashIntegridade: hash });
  }
}
```

### Triggers de autosave

- `narrativeWeight === 'major'` em qualquer ação ou evento
- Ao sair de um local (transição para WorldMapScreen)
- Ao avançar mês/semestre/ano
- A cada 5 minutos de jogo (timer de segurança)
- Ao fechar o app (visibilitychange event)

## Migrations

Cada versão do schema tem seu arquivo de migration:

```typescript
// migrations/v3.ts — adiciona tabelas de exploração e casa
export function migrarParaV3(db: GameDB): void {
  // homeSave, locationState já são declaradas no schema v3
  // characters ganha currentLocationId, currentRoomId, faseDeVidaAtual
  // lifeLog ganha índices novos (camada, *tags)
  // progressao é tabela nova
}
```

## Export/Import JSON

O jogador pode exportar e importar saves como JSON. Formato:

```typescript
type SaveExport = {
  versaoExport: number;
  exportadoEm: string;             // ISO date
  gameVersion: string;
  save: SaveRecord;
  character: CharacterRecord;
  npcs: NpcRecord[];
  eventFlags: EventFlagRecord[];
  lifeLog: LogEntry[];
  progressao: ProgressaoRecord;
  homeSave: HomeSaveRecord;
  locationState: LocationStateRecord;
};
```

Ao importar: validação de hash, verificação de versão, migration automática se versão diferente.

## navigator.storage.persist()

Chamado após criar o primeiro save. Sem isso, iOS e alguns browsers podem limpar o IndexedDB sem aviso:

```typescript
async function garantirPersistencia(): Promise<void> {
  if (navigator.storage && navigator.storage.persist) {
    const persistido = await navigator.storage.persist();
    if (!persistido) {
      // mostrar aviso educativo: "Para proteger seu save, instale o app"
      useUIStore.setState({ mostrarAvisoPersistencia: true });
    }
  }
}
```

## Garbage collection de NPCs descartáveis

NPCs com `persistencia === 'descartavel'` e sem interação nos últimos 24 meses são elegíveis para remoção:

```typescript
async function coletarLixoDeNpcs(saveId: string, anoAtual: number): Promise<void> {
  const npcs = await db.npcs.where('saveId').equals(saveId).toArray();
  const paraRemover = npcs.filter(npc =>
    npc.persistencia === 'descartavel' &&
    npc.ultimaInteracaoAno !== undefined &&
    (anoAtual - npc.ultimaInteracaoAno) >= 2
  );
  await db.npcs.bulkDelete(paraRemover.map(n => [saveId, n.npcId]));
}
```
