import type { SaveSlot } from '../schemas/save';

export type EstadoDeJogo = {
  readonly anoNascimento: number;
  readonly anoAtual: number;
  readonly humor: number;
  readonly saude: number;
  readonly dinheiro: number;
  readonly atributos: Readonly<Record<string, number>>;
  readonly flags: readonly string[];
  readonly cooldownRegistry: Readonly<Record<string, number>>;
};

export function salvarParaEstadoDeJogo(save: SaveSlot, anoAtual: number): EstadoDeJogo {
  return {
    anoNascimento:    save.protagonista.dataNascimento.ano,
    anoAtual,
    humor:            save.protagonista.humorAtual,
    saude:            save.protagonista.saudeAtual,
    dinheiro:         save.protagonista.dinheiro,
    atributos:        save.protagonista.atributos as Readonly<Record<string, number>>,
    flags:            save.protagonista.flags,
    cooldownRegistry: save.cooldownRegistry,
  };
}
