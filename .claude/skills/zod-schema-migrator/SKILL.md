---
name: zod-schema-migrator
description: Migra schemas Zod versionados em Vida 2.5D quando o shape muda (campo obrigatório novo, renomeação, mudança de tipo). Sempre acompanha de função de migration Dexie e teste de round-trip. NÃO use para campo opcional novo — adicionar inline com .default(). Make sure to use this skill whenever the user mentions schema bump, save migration, Dexie upgrade, new required field, field rename, or type change in a schema.
---

# Zod Schema Migrator — Claude Code (Vida 2.5D)

## Quando há migration (sempre que qualquer um desses mudar)
| Mudança | Migration? |
|---|---|
| Campo obrigatório novo | ✅ Sim |
| Renomeação de campo | ✅ Sim |
| Mudança de tipo (string → enum) | ✅ Sim |
| Campo opcional novo com .default() | ❌ Não |
| Mudança em validação sem shape change | ❌ Não |

## Padrão de versionamento (seguir exatamente)
```text
packages/core/src/schemas/save/
  v1.ts          ← schema antigo (NUNCA deletar)
  v2.ts          ← schema novo
  index.ts       ← re-exporta versão atual como SaveSchema

packages/core/src/persistence/migrations/
  v1_para_v2.ts  ← função pura de migração
```

## Função de migration (template)
```ts
// packages/core/src/persistence/migrations/v1_para_v2.ts
import type { SaveV1 } from '@core/schemas/save/v1';
import type { SaveV2 } from '@core/schemas/save/v2';

// PURA: sem Date.now(), sem fetch(), sem efeitos colaterais
export function migrarSaveV1ParaV2(antigo: SaveV1): SaveV2 {
  return {
    ...antigo,
    schemaVersion: '2.0.0',
    // campos novos com defaults seguros:
    novoCampo: 'valor_default_seguro',
  };
}
```

## Upgrade Dexie (acrescentar ao GameDB.ts)
```ts
this.version(2).stores({
  // repetir TODOS os stores, mesmo sem mudança de índice
  saves: 'saveId, ultimaPartida',
  characters: '...',
  npcs: '...',
  events: '...',
  relationships: '...',
}).upgrade(async tx => {
  await tx.table('saves').toCollection().modify(save => {
    Object.assign(save, migrarSaveV1ParaV2(save));
  });
});
```

## YOU MUST — checklist antes do PR
- [ ] Schema antigo preservado em v(N-1).ts (nunca deletar)
- [ ] Função de migration é pura (sem side effects)
- [ ] Teste: abre db v(N-1) com fixture → versão N → valida shape
- [ ] SaveSchemaAny (discriminatedUnion de todas as versões) atualizado
- [ ] `pnpm check` passa
- [ ] NEVER mudar primary key de tabela Dexie existente
