import type { Npc } from '../schemas/npc';
import type { SelectorNpc } from '../schemas/event';

function rng(semente: number, min: number, max: number): number {
  const x = Math.sin(semente) * 10000;
  return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
}

export function gerarNpcNovo(seletor: SelectorNpc, semente: number): Npc {
  let sementeAtual = semente;
  const proximoRandom = (min: number, max: number): number => {
    const res = rng(sementeAtual, min, max);
    sementeAtual += 1;
    return res;
  };

  // Nomes e sobrenomes brasileiros (10 masculinos, 10 femininos)
  const nomesMasculinos = [
    'Gabriel', 'Lucas', 'Mateus', 'Pedro', 'João',
    'Felipe', 'Thiago', 'Bruno', 'Arthur', 'Daniel'
  ];
  const nomesFemininos = [
    'Julia', 'Beatriz', 'Larissa', 'Mariana', 'Camila',
    'Amanda', 'Sofia', 'Letícia', 'Carolina', 'Isabela'
  ];
  const sobrenomes = [
    'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues',
    'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes'
  ];

  // Gênero: respeitar seletor.constraints.genero; se 'qualquer' ou indefinido, sortear
  const generoConstrained = seletor.constraints?.genero;
  const genero: 'M' | 'F' | 'outro' =
    generoConstrained === 'M' || generoConstrained === 'F'
      ? generoConstrained
      : proximoRandom(0, 1) === 0 ? 'M' : 'F';

  // Nome: sortear correspondente ao gênero
  const listaNomes = genero === 'M' ? nomesMasculinos : nomesFemininos;
  const nomeIdx = proximoRandom(0, listaNomes.length - 1);
  const nome = listaNomes[nomeIdx] ?? 'Lucas';

  const sobrenomeIdx = proximoRandom(0, sobrenomes.length - 1);
  const sobrenome = sobrenomes[sobrenomeIdx] ?? 'Silva';

  // Data de Nascimento
  // respeitar idadeMin/idadeMax do seletor se presentes; senão 1960–2000
  // Usaremos 2024 como o ano de referência padrão para calcular idade.
  const anoReferencia = 2024;
  const idadeMin = seletor.constraints?.idadeMin;
  const idadeMax = seletor.constraints?.idadeMax;

  const anoMax = idadeMin !== undefined ? anoReferencia - idadeMin : 2000;
  const anoMin = idadeMax !== undefined ? anoReferencia - idadeMax : 1960;

  // Garante limites conformes com a validação de DataNascimento (1900 a 2025)
  const anoMinVal = Math.max(1900, Math.min(anoMin, anoMax));
  const anoMaxVal = Math.min(2025, Math.max(anoMin, anoMax));

  const ano = proximoRandom(anoMinVal, anoMaxVal);
  const mes = proximoRandom(1, 12);
  const dia = proximoRandom(1, 28); // 28 para simplificar dias válidos em fevereiro

  // Profissão
  const profissoes = [
    'Vendedor', 'Professor', 'Médico', 'Advogado', 'Engenheiro',
    'Motorista', 'Enfermeiro', 'Cozinheiro', 'Assistente Administrativo', 'Desenvolvedor'
  ];
  const profIdx = proximoRandom(0, profissoes.length - 1);
  const profissaoAtual = profissoes[profIdx] ?? 'Vendedor';

  // Estilo Corporal Base: respeitar seletor.constraints.estiloCorporal se presente; senão sortear entre ['magro', 'medio', 'atletico', 'gordo']
  const estiloCorporalConstrained = seletor.constraints?.estiloCorporal;
  const estilosCorporais: Array<'atletico' | 'magro' | 'gordo' | 'medio'> = ['magro', 'medio', 'atletico', 'gordo'];
  let estiloCorporalBase: 'atletico' | 'magro' | 'gordo' | 'medio';

  if (estiloCorporalConstrained && estiloCorporalConstrained !== 'qualquer') {
    estiloCorporalBase = estiloCorporalConstrained;
  } else {
    const estiloIdx = proximoRandom(0, estilosCorporais.length - 1);
    estiloCorporalBase = estilosCorporais[estiloIdx] ?? 'medio';
  }

  // Traços Físicos: gerar de forma determinística
  const tonsPele = ['#ffdbac', '#f1c27d', '#e0ac69', '#c68642', '#8d5524'];
  const skinIdx = proximoRandom(0, tonsPele.length - 1);
  const corPele = tonsPele[skinIdx] ?? '#ffdbac';

  const coresOlhos = ['#1c7847', '#2e536f', '#3d6756', '#634e34', '#2e1d0c'];
  const olhosIdx = proximoRandom(0, coresOlhos.length - 1);
  const corOlhos = coresOlhos[olhosIdx] ?? '#634e34';

  const formatosRosto: Array<'oval' | 'redondo' | 'quadrado' | 'triangular' | 'coracao'> = ['oval', 'redondo', 'quadrado', 'triangular', 'coracao'];
  const rostoIdx = proximoRandom(0, formatosRosto.length - 1);
  const formatoRosto = formatosRosto[rostoIdx] ?? 'oval';

  const formatosNariz: Array<'reto' | 'arrebitado' | 'aquilino' | 'pequeno' | 'largo'> = ['reto', 'arrebitado', 'aquilino', 'pequeno', 'largo'];
  const narizIdx = proximoRandom(0, formatosNariz.length - 1);
  const formatoNariz = formatosNariz[narizIdx] ?? 'reto';

  const formatosBoca: Array<'fina' | 'cheia' | 'pequena' | 'larga'> = ['fina', 'cheia', 'pequena', 'larga'];
  const bocaIdx = proximoRandom(0, formatosBoca.length - 1);
  const formatoBoca = formatosBoca[bocaIdx] ?? 'fina';

  const alturaBase = proximoRandom(140, 210) / 100;

  // Traços Variáveis
  const coresCabelo = ['#090806', '#2c222b', '#715035', '#b38b6d', '#a56b46', '#debc99'];
  const cabeloIdx = proximoRandom(0, coresCabelo.length - 1);
  const corCabelo = coresCabelo[cabeloIdx] ?? '#090806';

  const estilosCabelo = ['curto', 'longo', 'ondulado', 'liso', 'crespo', 'careca'];
  const estiloCabeloIdx = proximoRandom(0, estilosCabelo.length - 1);
  const estiloCabelo = estilosCabelo[estiloCabeloIdx] ?? 'curto';

  const pesoAtual = proximoRandom(50, 100);

  // Relacionamento com Personagem (relacionamentoComJogador)
  // relacionamentoComPersonagem.afetoInicial: valor entre 30 e 70 (neutro por default)
  const afetoInicial = proximoRandom(30, 70);

  return {
    schemaVersion: '1.0.0',
    npcId: `npc_${semente}`,
    nome,
    sobrenome,
    genero,
    dataNascimento: {
      ano,
      mes,
      dia
    },
    tracosFisicos: {
      corPele,
      corOlhos,
      formatoRosto,
      formatoNariz,
      formatoBoca,
      estiloCorporalBase,
      alturaBase
    },
    tracosVariaveis: {
      corCabelo,
      estiloCabelo,
      temGrisalho: false,
      temRugas: false,
      temOlheiras: false,
      usaOculos: false,
      pesoAtual,
      alturaAtual: alturaBase
    },
    persistencia: seletor.persistenciaApos,
    tags: [],
    profissaoAtual,
    statusFinanceiro: 'medio',
    relacionamentoComJogador: {
      tipo: 'conhecido',
      afeto: afetoInicial,
      conhecidoDesde: {
        ano,
        mes
      }
    },
    relacionamentosComOutrosNpcs: {},
    vivo: true,
    historicoInteracoes: []
  };
}
