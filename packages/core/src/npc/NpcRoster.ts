import type { Npc } from '../schemas/npc';

export class RosterDeNpcs {
  private readonly npcs: Map<string, Npc> = new Map();

  adicionar(npc: Npc): void {
    this.npcs.set(npc.npcId, npc);
  }

  buscarPorId(id: string): Npc | undefined {
    return this.npcs.get(id);
  }

  listarTodos(): Npc[] {
    return Array.from(this.npcs.values());
  }

  listarVivos(): Npc[] {
    return this.listarTodos().filter((npc) => npc.vivo);
  }
}
