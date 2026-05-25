import type { Atividade } from './ActivityCatalog';
import type { ActionDefinition } from '../schemas/action';
import type { Effect } from '../schemas/effect';

export function converterAtividadeParaAcao(atividade: Atividade): ActionDefinition {
  const custos: Effect[] = [];
  const onSuccess: Effect[] = [];

  for (const efeito of atividade.efeitos) {
    if (efeito.tipo === 'alterar_dinheiro' && efeito.delta < 0) {
      custos.push(efeito);
    } else {
      onSuccess.push(efeito);
    }
  }

  return {
    id: atividade.id,
    rotulo: atividade.rotulo,
    icone: atividade.icone,
    resolutionMode: 'direct',
    custos: custos.length > 0 ? custos : undefined,
    onSuccess: onSuccess.length > 0 ? onSuccess : undefined,
    narrativeWeight: 'routine',
    timeCost: { unidades: 1, tipo: 'periodo' },
  };
}
