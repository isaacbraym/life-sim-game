import type { Effect } from '../schemas/effect';
import type { EstadoDeJogo } from '../events/EstadoDeJogo';

export function aplicarEfeitos(efeitos: readonly Effect[], estado: EstadoDeJogo): EstadoDeJogo {
  return efeitos.reduce<EstadoDeJogo>((acc, efeito) => {
    switch (efeito.tipo) {
      case 'alterar_atributo':
        return {
          ...acc,
          atributos: {
            ...acc.atributos,
            [efeito.atributo]: Math.min(20, Math.max(1, (acc.atributos[efeito.atributo] ?? 10) + efeito.delta)),
          },
        };

      case 'alterar_dinheiro':
        return { ...acc, dinheiro: acc.dinheiro + efeito.delta };

      case 'alterar_humor':
        return { ...acc, humor: Math.min(100, Math.max(0, acc.humor + efeito.delta)) };

      case 'alterar_saude':
        return { ...acc, saude: Math.min(100, Math.max(0, acc.saude + efeito.delta)) };

      case 'adicionar_flag':
        return acc.flags.includes(efeito.flag)
          ? acc
          : { ...acc, flags: [...acc.flags, efeito.flag] };

      case 'remover_flag':
        return { ...acc, flags: acc.flags.filter(f => f !== efeito.flag) };

      // Efeitos que envolvem roster ou estado externo são devolvidos sem alteração:
      // o game package os aplica via AplicadorEfeitos com acesso ao Character + Npc[].
      case 'alterar_relacionamento':
      case 'matar_npc':
      case 'mudar_profissao':
      case 'aplicar_status':
      case 'disparar_evento':
        return acc;
    }
  }, estado);
}
