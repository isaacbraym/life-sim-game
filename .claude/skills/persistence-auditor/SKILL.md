---
name: persistence-auditor
description: Auditoria completa de integridade de save no Vida 2.5D. Use antes de qualquer release ou após mudança significativa no pipeline de save. Verifica double-buffer, export/import, hash de integridade, navigator.storage.persist e recuperação de corrupção. Make sure to use this skill when the user mentions release, audit, save integrity, backup, or export/import of saves.
---

# Persistence Auditor — Claude Code (Vida 2.5D)

## Checklist de auditoria completa

### Double-buffer
- [ ] Save grava em slot temporário antes de promover para `current`
- [ ] `previous` só é sobrescrito após `current` confirmado
- [ ] Leitura: tenta `current` → se falhar Zod parse, carrega `previous`
- [ ] Falha total: exibir mensagem clara ao usuário, não silenciar

### Validação em todo boundary
- [ ] Gravação: `SaveSchema.parse(dados)` antes de `db.saves.put()`
- [ ] Leitura: `SaveSchema.safeParse(dados)` após `db.saves.get()`
- [ ] Import: `SaveSchema.safeParse(json)` antes de qualquer `db.put()`
- [ ] Erros de Zod logados com path + message (nunca silenciados)

### Hash de integridade
- [ ] SHA-256 calculado sobre o JSON serializado do save
- [ ] Hash salvo junto com o save (campo `integrityHash`)
- [ ] Validado ao carregar — mismatch → usar `previous` ou alertar

### Export/Import
- [ ] Export: `dexie-export-import` → Blob JSON → download
- [ ] Import: upload → Blob → `Dexie.import()` → validar todos os registros
- [ ] Import não sobrescreve save sem confirmação explícita do usuário

### Storage persistence
- [ ] `navigator.storage.persist()` chamado após criar primeiro save
- [ ] Resultado logado (true = persistente, false = evictable)
- [ ] UX avisa usuário se permissão negada

### Garbage collect de NPCs descartáveis
- [ ] NPCs com `persistencia: 'descartavel'` removidos após N anos configurável
- [ ] Relacionamentos órfãos limpos junto com o NPC
- [ ] GC nunca remove NPC referenciado em evento vivido recente
