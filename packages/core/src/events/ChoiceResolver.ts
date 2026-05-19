import { OpcaoEscolha } from '../schemas/scene';
import { Effect } from '../schemas/effect';
import { GameState } from './PredicateEvaluator';
import { rolarD20, resolverRolagem, TierResultado } from '../rpg/D20Roll';
import { calcularModificadorNome } from '../rpg/Attributes';

export interface ResultadoEscolha {
  efeitosAplicados: Effect[];
  proximoEventoId?: string;
  tierResultado?: TierResultado;
}

export interface ResolverEscolhaParams {
  opcao: OpcaoEscolha;
  estado: GameState;
  rng?: () => number;
}

export function resolverEscolha(params: ResolverEscolhaParams): ResultadoEscolha {
  const { opcao, estado, rng } = params;
  let tierResultado: TierResultado | undefined;

  if (opcao.atributoCheck) {
    const mod = calcularModificadorNome(
      estado.personagem.atributos,
      opcao.atributoCheck.atributo
    );
    const rolagem = rng ? Math.floor(rng() * 20) + 1 : rolarD20();
    tierResultado = resolverRolagem({
      rolagem,
      modificador: mod,
      dificuldade: opcao.atributoCheck.dificuldade
    });
  }

  return {
    efeitosAplicados: (opcao.efeitos ?? []) as Effect[],
    ...(opcao.proximoEventoId !== undefined ? { proximoEventoId: opcao.proximoEventoId } : {}),
    ...(tierResultado !== undefined ? { tierResultado } : {}),
  };
}
