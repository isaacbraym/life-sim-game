import type { Effect } from '@core/schemas/effect';

/**
 * Converte um `Effect` em texto de floating label do VisualFeedback.
 * Retorna `undefined` para efeitos sem representação visual (flags, eventos etc.).
 */
export function efeitoParaTexto(efeito: Effect): string | undefined {
  switch (efeito.tipo) {
    case 'alterar_humor':
      return efeito.delta >= 0 ? `+${efeito.delta} Humor 😊` : `${efeito.delta} Humor 😞`;
    case 'alterar_saude':
      return efeito.delta >= 0 ? `+${efeito.delta} Saúde ❤️` : `${efeito.delta} Saúde 💔`;
    case 'alterar_dinheiro':
      return efeito.delta >= 0 ? `+R$ ${efeito.delta}` : `-R$ ${Math.abs(efeito.delta)}`;
    case 'alterar_atributo': {
      const nomes: Readonly<Record<string, string>> = {
        forca: 'Força', inteligencia: 'Inteligência',
        carisma: 'Carisma', constituicao: 'Constituição', sorte: 'Sorte',
      };
      const nome = nomes[efeito.atributo] ?? efeito.atributo;
      return efeito.delta >= 0 ? `+${efeito.delta} ${nome} ⬆` : `${efeito.delta} ${nome} ⬇`;
    }
    default:
      return undefined;
  }
}

/** Cor PixiJS (número) para o tipo de efeito e sinal do delta. */
export function efeitoParaCor(efeito: Effect): number {
  switch (efeito.tipo) {
    case 'alterar_humor':
      return efeito.delta >= 0 ? 0xf6e05e : 0xfc8181;
    case 'alterar_saude':
      return efeito.delta >= 0 ? 0x68d391 : 0xfc8181;
    case 'alterar_dinheiro':
      return efeito.delta >= 0 ? 0x68d391 : 0xfc8181;
    case 'alterar_atributo':
      return efeito.delta >= 0 ? 0x76e4f7 : 0xfbd38d;
    default:
      return 0xffffff;
  }
}
