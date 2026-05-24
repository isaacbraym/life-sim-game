---
name: dexie-persistence-test
description: Valida integridade de save e load no Dexie/IndexedDB do Vida 2.5D. Use obrigatoriamente após qualquer mudança em packages/core/src/persistence/GameDB.ts, schemas de save, ou qualquer migration. Testa round-trip, double-buffer e versionamento. Make sure to use this skill whenever the user touches GameDB.ts, save schema, db.version(), or mentions save, load, migration, or IndexedDB.
---

# Dexie Persistence Test — Vida 2.5D

## Banco de dados (GameDB.ts)
- Classe: `VidaGameDB extends Dexie`, nome do banco: `'Vida25DGame'`
- Tabelas: `saves` (PK: saveId), `characters` (PK: characterId), `npcs` (PK: npcId),
  `events` (PK: ++id auto-increment), `relationships` (PK: [fromId+toId])
- Versão atual: 1. Próxima migration → versão 2.

## Invariantes invioláveis
- TODO save passa por `SaveSchema.parse()` antes de gravar no Dexie.
- TODO load passa por `SaveSchema.safeParse()` — se falhar, tentar backup automático.
- Double-buffer: gravar em slot `current`, manter `previous` como backup.
  Só promover `previous = current` após commit bem-sucedido.
- NUNCA mudar primary key de tabela Dexie existente.
  Se precisar mudar PK: criar nova tabela + migration + GC da tabela antiga.
- Migrations Dexie: `db.version(N).stores({...}).upgrade(tx => ...)` — sempre pura,
  sem side effects, sem Date.now() em valores persistidos.

## Checklist antes de commitar qualquer mudança em db.ts
- [ ] `pnpm --filter @vida25/core test:db` passa
- [ ] Round-trip: gera fixture → salva → fecha db → reabre → carrega → deep equal
- [ ] Migration: cria db na versão N-1 → abre na versão N → valida shape pós-upgrade
- [ ] Corrupção: injeta payload inválido em current → valida que previous é carregado
- [ ] `pnpm -r typecheck` passa sem erros

## Padrão de migration (copiar para cada nova versão)
```ts
db.version(2).stores({
  // especificar TODOS os stores, mesmo sem mudança
  saves: 'saveId, ultimaPartida',
  characters: 'characterId, saveId, idadeAtualMeses, [saveId+idadeAtualMeses]',
  npcs: 'npcId, saveId, persistencia, [saveId+persistencia]',
  events: '++id, saveId, characterId, ano, [saveId+ano], eventoId',
  relationships: '[fromId+toId], fromId, toId, tipo, saveId',
}).upgrade(async tx => {
  // migração pura — sem imports de Date, fetch, ou globals
  await tx.table('characters').toCollection().modify(char => {
    // exemplo: adicionar campo novo com default
  });
});
```
