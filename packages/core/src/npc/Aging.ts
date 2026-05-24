import type { Npc } from '../schemas/npc';

// [FIX QA] Substituído throw por no-op identidade — função era um stub que
// crashava em runtime. A lógica real de envelhecimento está em NpcAging.ts
// (envelhecerRoster). Esta função permanece como ponto de extensão futuro
// para envelhecimento visual/físico (tracosVariaveis: grisalho, rugas).
// TODO: aplicar envelhecimento visual e físico ao NPC
export function aplicarEnvelhecimento(npc: Npc, _anoAtual: number): Npc {
  return npc;
}
