import type { Npc } from '../schemas/npc';
import type { SelectorNpc } from '../schemas/event';
import type { Atributos } from '../schemas/character';
import { gerarAtributosGeneticos, gerarAtributosIniciais } from '../rpg/Attributes';

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

export function gerarRosterInicial(
  anoNascimentoProtagonista: number,
  sementeBase: number,
): Npc[] {
  const roster: Npc[] = [];

  const rngLocal = (semente: number, min: number, max: number) => {
    const x = Math.sin(semente) * 10000;
    const valor = Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
    return { valor, proximaSemente: semente + 1 };
  };

  // 1. Gerar pai
  const seletorPai: SelectorNpc = {
    papel: 'pai',
    tipo: 'sempre_novo',
    persistenciaApos: 'permanente',
    constraints: {
      genero: 'M',
    },
  };
  const sementePai = sementeBase;
  const p1 = rngLocal(sementePai, 20, 45);
  const idadePaiNoNascimento = p1.valor;
  const anoNascimentoPai = anoNascimentoProtagonista - idadePaiNoNascimento;
  const p2 = rngLocal(p1.proximaSemente, 1, 12);
  const mesNascimentoPai = p2.valor;
  const p3 = rngLocal(p2.proximaSemente, 1, 28);
  const diaNascimentoPai = p3.valor;

  const paiRaw = gerarNpcNovo(seletorPai, sementePai);
  const pai: Npc = {
    ...paiRaw,
    npcId: crypto.randomUUID(),
    dataNascimento: {
      ano: anoNascimentoPai,
      mes: mesNascimentoPai,
      dia: diaNascimentoPai,
    },
    persistencia: 'permanente',
    relacionamentoComJogador: {
      tipo: 'familia_pai',
      afeto: 70,
      conhecidoDesde: {
        ano: anoNascimentoProtagonista,
        mes: 1,
      },
    },
  };
  roster.push(pai);

  // 2. Gerar mãe
  const seletorMae: SelectorNpc = {
    papel: 'mae',
    tipo: 'sempre_novo',
    persistenciaApos: 'permanente',
    constraints: {
      genero: 'F',
    },
  };
  const sementeMae = sementeBase + 100;
  const m1 = rngLocal(sementeMae, 20, 42);
  const idadeMaeNoNascimento = m1.valor;
  const anoNascimentoMae = anoNascimentoProtagonista - idadeMaeNoNascimento;
  const m2 = rngLocal(m1.proximaSemente, 1, 12);
  const mesNascimentoMae = m2.valor;
  const m3 = rngLocal(m2.proximaSemente, 1, 28);
  const diaNascimentoMae = m3.valor;

  const maeRaw = gerarNpcNovo(seletorMae, sementeMae);
  const mae: Npc = {
    ...maeRaw,
    npcId: crypto.randomUUID(),
    dataNascimento: {
      ano: anoNascimentoMae,
      mes: mesNascimentoMae,
      dia: diaNascimentoMae,
    },
    persistencia: 'permanente',
    relacionamentoComJogador: {
      tipo: 'familia_mae',
      afeto: 75,
      conhecidoDesde: {
        ano: anoNascimentoProtagonista,
        mes: 1,
      },
    },
  };
  roster.push(mae);

  // 3. Sortear número de irmãos (0, 1 ou 2)
  const numIrmaos = sementeBase % 3;
  for (let i = 0; i < numIrmaos; i++) {
    const sementeIrmao = sementeBase + 200 + (i * 50);
    const i1 = rngLocal(sementeIrmao, 0, 1);
    const eMaisVelho = i1.valor === 0;

    let i2;
    if (eMaisVelho) {
      i2 = rngLocal(i1.proximaSemente, anoNascimentoProtagonista - 8, anoNascimentoProtagonista - 1);
    } else {
      i2 = rngLocal(i1.proximaSemente, anoNascimentoProtagonista + 1, anoNascimentoProtagonista + 6);
    }
    const anoNascimentoIrmao = i2.valor;

    const i3 = rngLocal(i2.proximaSemente, 0, 1);
    const generoIrmao: 'M' | 'F' = i3.valor === 0 ? 'M' : 'F';

    const i4 = rngLocal(i3.proximaSemente, 1, 12);
    const mesNascimentoIrmao = i4.valor;

    const i5 = rngLocal(i4.proximaSemente, 1, 28);
    const diaNascimentoIrmao = i5.valor;

    const seletorIrmao: SelectorNpc = {
      papel: 'irmao',
      tipo: 'sempre_novo',
      persistenciaApos: 'permanente',
      constraints: {
        genero: generoIrmao,
      },
    };
    const irmaoRaw = gerarNpcNovo(seletorIrmao, sementeIrmao);
    const irmao: Npc = {
      ...irmaoRaw,
      npcId: crypto.randomUUID(),
      dataNascimento: {
        ano: anoNascimentoIrmao,
        mes: mesNascimentoIrmao,
        dia: diaNascimentoIrmao,
      },
      persistencia: 'permanente',
      relacionamentoComJogador: {
        tipo: 'familia_irmao',
        afeto: 50,
        conhecidoDesde: eMaisVelho
          ? { ano: anoNascimentoProtagonista, mes: 1 }
          : { ano: anoNascimentoIrmao, mes: mesNascimentoIrmao },
      },
    };
    roster.push(irmao);
  }

  return roster;
}

export function gerarAtributosNpcComHeranca(
  atributosPai: Atributos | undefined,
  atributosMae: Atributos | undefined,
  semente: number,
): Atributos {
  if (atributosPai !== undefined && atributosMae !== undefined) {
    return gerarAtributosGeneticos(atributosPai, atributosMae, semente);
  }
  // Se um dos pais não disponível: gerar aleatório com viés do pai disponível
  const base = atributosPai ?? atributosMae;
  if (base !== undefined) {
    const aleatorio = gerarAtributosIniciais();
    return {
      forca:        Math.round((base.forca + aleatorio.forca) / 2),
      inteligencia: Math.round((base.inteligencia + aleatorio.inteligencia) / 2),
      carisma:      Math.round((base.carisma + aleatorio.carisma) / 2),
      constituicao: Math.round((base.constituicao + aleatorio.constituicao) / 2),
      sorte:        Math.round((base.sorte + aleatorio.sorte) / 2),
    };
  }
  return gerarAtributosIniciais();
}

