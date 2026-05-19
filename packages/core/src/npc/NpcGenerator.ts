import type { Npc } from '../schemas/npc';


export interface ConstraintsNpc {
  genero?: 'M' | 'F' | 'qualquer';
  idadeMin?: number;
  idadeMax?: number;
  tomDePele?: string;
  estiloCorporal?: string;
}

function gerarAtributoAleatorio(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const normal = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  const valor = Math.round(10 + normal * 2);
  return Math.max(6, Math.min(14, valor));
}

function gerarAtributos() {
  return {
    forca: gerarAtributoAleatorio(),
    inteligencia: gerarAtributoAleatorio(),
    carisma: gerarAtributoAleatorio(),
    constituicao: gerarAtributoAleatorio(),
    sorte: gerarAtributoAleatorio()
  };
}

function obterCorHexAleatoria(): string {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}

export function gerarNpcNovo(constraints: ConstraintsNpc, rng?: () => number): Npc {
  const r = rng ? rng() : Math.random();
  const generoVal = constraints.genero === 'qualquer' || !constraints.genero 
    ? (r > 0.5 ? 'M' : 'F') 
    : constraints.genero;

  const anoAtual = 2026;
  const idadeMin = constraints.idadeMin ?? 18;
  const idadeMax = constraints.idadeMax ?? 60;
  const idade = Math.floor(r * (idadeMax - idadeMin + 1)) + idadeMin;

  return {
    schemaVersion: '1.0.0',
    npcId: (crypto as Crypto).randomUUID(),
    nome: 'NPC',
    sobrenome: 'Gerado',
    genero: generoVal as 'M' | 'F' | 'outro',
    dataNascimento: { ano: anoAtual - idade, mes: 1, dia: 1 },
    tracosFisicos: {
      corPele: obterCorHexAleatoria(),
      corOlhos: obterCorHexAleatoria(),
      formatoRosto: 'oval',
      formatoNariz: 'reto',
      formatoBoca: 'pequena',
      estiloCorporalBase: (constraints.estiloCorporal as 'atletico' | 'magro' | 'gordo' | 'medio') ?? 'medio',
      alturaBase: 1.7
    },
    tracosVariaveis: {
      corCabelo: obterCorHexAleatoria(),
      estiloCabelo: 'curto',
      temGrisalho: false,
      temRugas: false,
      temOlheiras: false,
      usaOculos: false,
      pesoAtual: 70,
      alturaAtual: 1.7
    },
    atributos: gerarAtributos(),
    persistencia: 'descartavel',
    tags: [],
    profissaoAtual: 'Nenhuma',
    statusFinanceiro: 'medio',
    relacionamentoComJogador: {
      tipo: 'conhecido',
      afeto: 0,
      conhecidoDesde: { ano: anoAtual, mes: 1 }
    },
    relacionamentosComOutrosNpcs: {},
    vivo: true,
    historicoInteracoes: []
  };
}
