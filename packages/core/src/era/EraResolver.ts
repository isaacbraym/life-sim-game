import type { EraDefinition } from '../schemas/era';

// Eras hardcoded para o intervalo de vida do personagem (1985–2060+).
// O game package pode sobrescrever registrando eras extras via filtrarPorDisponibilidade.
const ERAS: readonly EraDefinition[] = [
  {
    id: 'oitenta',
    nome: 'Anos 80',
    startYear: 1980,
    endYear: 1989,
    tecnologiasDisponiveis: ['videogame_atari', 'walkman', 'fita_vhs', 'telefone_fixo'],
    estiloRoupa: 'eighties',
    estiloMovel: 'eighties',
    descricao: 'Década de neon, rock e tecnologia analógica.',
  },
  {
    id: 'noventa',
    nome: 'Anos 90',
    startYear: 1990,
    endYear: 1999,
    tecnologiasDisponiveis: ['videogame_snes', 'cd_player', 'computador_486', 'internet_discada', 'pager'],
    estiloRoupa: 'nineties',
    estiloMovel: 'nineties',
    descricao: 'A era do grunge, do CD e dos primeiros computadores domésticos.',
  },
  {
    id: 'anos_2000',
    nome: 'Anos 2000',
    startYear: 2000,
    endYear: 2009,
    tecnologiasDisponiveis: ['celular_nokia', 'mp3_player', 'dvd', 'banda_larga', 'orkut', 'msn'],
    estiloRoupa: 'anos2000',
    estiloMovel: 'anos2000',
    descricao: 'Orkut, celulares com snake e o nascimento das redes sociais.',
  },
  {
    id: 'anos_2010',
    nome: 'Anos 2010',
    startYear: 2010,
    endYear: 2019,
    tecnologiasDisponiveis: ['smartphone', 'tablet', 'streaming', 'redes_sociais', 'uber', 'whatsapp'],
    estiloRoupa: 'anos2010',
    estiloMovel: 'anos2010',
    descricao: 'Smartphones, apps e a conectividade contínua.',
  },
  {
    id: 'anos_2020',
    nome: 'Anos 2020',
    startYear: 2020,
    endYear: 2029,
    tecnologiasDisponiveis: ['smartphone_5g', 'streaming_4k', 'ia_assistente', 'pix', 'trabalho_remoto'],
    estiloRoupa: 'anos2020',
    estiloMovel: 'anos2020',
    descricao: 'Pandemia, IA e o trabalho remoto transformam a vida cotidiana.',
  },
  {
    id: 'anos_2030',
    nome: 'Anos 2030',
    startYear: 2030,
    endYear: 2099,
    tecnologiasDisponiveis: ['ia_avancada', 'realidade_aumentada', 'veiculo_autonomo'],
    estiloRoupa: 'anos2030',
    estiloMovel: 'anos2030',
    descricao: 'Futuro próximo com IA integrada ao cotidiano.',
  },
];

export function resolverEraAtual(ano: number): EraDefinition {
  const era = ERAS.find(e => ano >= e.startYear && ano <= e.endYear);
  if (era === undefined) {
    throw new Error(`Nenhuma era definida para o ano ${ano}`);
  }
  return era;
}

export function filtrarPorDisponibilidade<
  T extends { availability: { startYear: number; endYear?: number | undefined } },
>(itens: readonly T[], ano: number): T[] {
  return itens.filter(
    item =>
      ano >= item.availability.startYear &&
      (item.availability.endYear === undefined || ano <= item.availability.endYear),
  );
}
