import { sortearEvento } from '../events/EventPool';
import { aplicarEfeito } from './AplicadorEfeitos';
import { atributoCheck } from '../rpg/D20Roll';
import { avancarTempo } from '../tempo/TempoEngine';
import type { Character } from '../schemas/character';
import type { Effect, AtributoRPG } from '../schemas/effect';
import type { Event } from '../schemas/event';
import type { OpcaoEscolha } from '../schemas/scene';
import type { SaveSlot } from '../schemas/save';
import type { ResultadoResolucao, TierResolucao } from '../tempo/tipos';

type OpcaoComMetadados = OpcaoEscolha & {
  readonly id?: string;
  readonly opcaoId?: string;
  readonly efeitosFalha?: readonly Effect[];
  readonly rolagemD20?: {
    readonly atributo: AtributoRPG;
    readonly dificuldade: number;
  };
};

function obterEventoId(evento: Event): string {
  return evento.eventoId;
}

function obterOpcoes(evento: Event): readonly OpcaoComMetadados[] {
  for (const beat of evento.scene.beats) {
    if (beat.tipo === 'escolha') {
      return beat.opcoes as readonly OpcaoComMetadados[];
    }
  }

  return [];
}

function opcaoCorresponde(opcao: OpcaoComMetadados, indice: number, idOpcao: string): boolean {
  return opcao.id === idOpcao
    || opcao.opcaoId === idOpcao
    || opcao.texto === idOpcao
    || String(indice) === idOpcao;
}

function calcularTier(dado: number, total: number): TierResolucao {
  if (dado === 1) return 'falha_critica';
  if (dado === 20 || total >= 20) return 'sucesso_critico';
  if (total <= 9) return 'falha';

  return 'sucesso';
}

function obterCheck(opcao: OpcaoComMetadados): OpcaoComMetadados['rolagemD20'] {
  return opcao.rolagemD20 ?? opcao.atributoCheck;
}

function selecionarEfeitos(
  opcao: OpcaoComMetadados,
  tier: TierResolucao | undefined,
): readonly Effect[] {
  if (tier === 'falha' || tier === 'falha_critica') {
    return opcao.efeitosFalha ?? [];
  }

  return opcao.efeitos;
}

function aplicarEfeitosNoSave(save: SaveSlot, efeitos: readonly Effect[]): SaveSlot {
  let protagonista = save.protagonista;
  let roster = save.roster;

  for (const efeito of efeitos) {
    const resultado = aplicarEfeito(efeito, protagonista, roster);
    protagonista = resultado.personagem;
    roster = [...resultado.roster];
  }

  return {
    ...save,
    protagonista,
    roster: [...roster],
  };
}

function calcularAnoExpiracaoCooldown(save: SaveSlot, cooldownMeses: number): number {
  return save.estadoMundo.anoAtual + Math.ceil(cooldownMeses / 12);
}

export class GameEngine {
  constructor(private readonly aleatorio: () => number = Math.random) {}

  avancarTempoEContinuar(
    save: SaveSlot,
    eventos: readonly Event[],
  ): { saveAposTempo: SaveSlot; eventoSorteado: Event | undefined } {
    const saveAposTempo = avancarTempo(save);
    const eventoSorteado = sortearEvento(eventos, saveAposTempo, this.aleatorio);

    if (eventoSorteado === undefined || eventoSorteado.triggers.cooldownMeses <= 0) {
      return { saveAposTempo, eventoSorteado };
    }

    return {
      saveAposTempo: {
        ...saveAposTempo,
        cooldownRegistry: {
          ...saveAposTempo.cooldownRegistry,
          [obterEventoId(eventoSorteado)]: calcularAnoExpiracaoCooldown(
            saveAposTempo,
            eventoSorteado.triggers.cooldownMeses,
          ),
        },
      },
      eventoSorteado,
    };
  }

  resolverOpcao(
    save: SaveSlot,
    evento: Event,
    idOpcao: string,
  ): ResultadoResolucao {
    const opcao = obterOpcoes(evento).find((item, indice) => opcaoCorresponde(item, indice, idOpcao));

    if (opcao === undefined) {
      throw new Error(`Opcao nao encontrada: ${idOpcao}`);
    }

    const check = obterCheck(opcao);
    const rolagem = check === undefined
      ? undefined
      : atributoCheck(save.protagonista.atributos, check.atributo, check.dificuldade, this.aleatorio);
    const tier = rolagem === undefined
      ? undefined
      : calcularTier(rolagem.rolagem, rolagem.total);
    const rolagemDetalhada = rolagem === undefined || tier === undefined || check === undefined
      ? undefined
      : {
          atributo: check.atributo,
          dado: rolagem.rolagem,
          modificador: rolagem.modificador,
          total: rolagem.total,
          tier,
        };
    const efeitosAplicados = selecionarEfeitos(opcao, tier);
    const saveComEfeitos = aplicarEfeitosNoSave(save, efeitosAplicados);
    const eventoId = obterEventoId(evento);
    const protagonista = saveComEfeitos.protagonista.eventosVividos.includes(eventoId)
      ? saveComEfeitos.protagonista
      : {
          ...saveComEfeitos.protagonista,
          eventosVividos: [...saveComEfeitos.protagonista.eventosVividos, eventoId],
          flags: saveComEfeitos.protagonista.flags.includes(`viu_${eventoId}`)
            ? saveComEfeitos.protagonista.flags
            : [...saveComEfeitos.protagonista.flags, `viu_${eventoId}`],
        };
    const saveAtualizado: SaveSlot = {
      ...saveComEfeitos,
      protagonista,
      ultimaPartida: new Date().toISOString(),
    };

    return {
      saveAtualizado,
      rolagem: rolagemDetalhada,
      efeitosAplicados,
      mortesDetectadas: this.detectarMortes(saveAtualizado),
    };
  }

  verificarMorte(personagem: Character): { morto: boolean; causa?: string } {
    if (personagem.saudeAtual <= 0) {
      return { morto: true, causa: 'saude' };
    }

    const expectativaVidaMeses = (85 + (personagem.atributos.constituicao - 10) * 2) * 12;
    if (personagem.idadeAtualMeses > expectativaVidaMeses) {
      return { morto: true, causa: 'idade' };
    }

    return { morto: false };
  }

  private detectarMortes(save: SaveSlot): ResultadoResolucao['mortesDetectadas'] {
    const mortes: {
      readonly tipo: 'protagonista' | 'npc';
      readonly id: string;
      readonly causa: string;
    }[] = [];
    const morteProtagonista = this.verificarMorte(save.protagonista);

    if (morteProtagonista.morto) {
      mortes.push({
        tipo: 'protagonista',
        id: save.protagonista.characterId,
        causa: morteProtagonista.causa ?? 'desconhecida',
      });
    }

    for (const npc of save.roster) {
      if (!npc.vivo) {
        mortes.push({
          tipo: 'npc',
          id: npc.npcId,
          causa: npc.dataMorte?.causa ?? 'desconhecida',
        });
      }
    }

    return mortes;
  }
}
