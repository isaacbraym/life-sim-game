import type { LifePhaseEnum, LifePhaseDefinition } from '../schemas/lifephase';

// Fases hardcoded conforme instructions/04-mecanicas-jogo.md
const FASES: readonly LifePhaseDefinition[] = [
  {
    id: 'bebe',
    idadeMin: 0,
    idadeMax: 2,
    autonomia: 'nenhuma',
    locaisDisponiveis: ['casa'],
    locaisBloqueados: [],
    acoesDesfavor: [],
    worldMapVisivel: false,
    descricao: 'Bebê: 0–2 anos. Sem autonomia, experiência narrativa sequencial.',
  },
  {
    id: 'crianca',
    idadeMin: 3,
    idadeMax: 11,
    autonomia: 'limitada',
    locaisDisponiveis: ['casa', 'escola', 'parque'],
    locaisBloqueados: ['bar', 'trabalho', 'banco'],
    acoesDesfavor: [],
    worldMapVisivel: false,
    descricao: 'Criança: 3–11 anos. Autonomia limitada, apenas casa e escola com acompanhamento.',
  },
  {
    id: 'adolescente',
    idadeMin: 12,
    idadeMax: 17,
    autonomia: 'parcial',
    locaisDisponiveis: ['casa', 'escola', 'parque', 'shopping', 'academia', 'restaurante'],
    locaisBloqueados: ['bar', 'banco', 'trabalho'],
    acoesDesfavor: [],
    worldMapVisivel: true,
    descricao: 'Adolescente: 12–17 anos. Autonomia parcial, WorldMap com restrições.',
  },
  {
    id: 'jovem_adulto',
    idadeMin: 18,
    idadeMax: 25,
    autonomia: 'plena',
    locaisDisponiveis: ['casa', 'escola', 'parque', 'shopping', 'academia', 'restaurante', 'bar', 'trabalho', 'banco', 'hospital'],
    locaisBloqueados: [],
    acoesDesfavor: [],
    worldMapVisivel: true,
    descricao: 'Jovem adulto: 18–25 anos. Autonomia plena, todos os locais disponíveis.',
  },
  {
    id: 'adulto',
    idadeMin: 26,
    idadeMax: 59,
    autonomia: 'plena',
    locaisDisponiveis: ['casa', 'escola', 'parque', 'shopping', 'academia', 'restaurante', 'bar', 'trabalho', 'banco', 'hospital'],
    locaisBloqueados: [],
    acoesDesfavor: [],
    worldMapVisivel: true,
    descricao: 'Adulto: 26–59 anos. Autonomia plena.',
  },
  {
    id: 'idoso',
    idadeMin: 60,
    idadeMax: 120,
    autonomia: 'plena',
    locaisDisponiveis: ['casa', 'parque', 'restaurante', 'hospital', 'banco'],
    locaisBloqueados: ['escola'],
    acoesDesfavor: [],
    worldMapVisivel: true,
    descricao: 'Idoso: 60+ anos. Autonomia plena com limitações físicas.',
  },
];

const FASES_POR_ID = new Map<LifePhaseEnum, LifePhaseDefinition>(
  FASES.map(f => [f.id, f]),
);

export function calcularFaseAtual(idadeAnos: number): LifePhaseEnum {
  if (idadeAnos <= 2) return 'bebe';
  if (idadeAnos <= 11) return 'crianca';
  if (idadeAnos <= 17) return 'adolescente';
  if (idadeAnos <= 25) return 'jovem_adulto';
  if (idadeAnos <= 59) return 'adulto';
  return 'idoso';
}

export function obterDefinicaoDeFase(fase: LifePhaseEnum): LifePhaseDefinition {
  const definicao = FASES_POR_ID.get(fase);
  if (definicao === undefined) {
    throw new Error(`Fase de vida desconhecida: ${fase}`);
  }
  return definicao;
}
