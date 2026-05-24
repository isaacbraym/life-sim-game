import { migrarSave } from './Migracoes';

const saveValidoV100 = {
  schemaVersion: '1.0.0' as const,
  saveId: '3b251323-8cf3-41fa-8a1a-cb320857bbff',
  nomeSlot: 'Save de Teste',
  criadoEm: '2026-05-24T00:00:00.000Z',
  ultimaPartida: '2026-05-24T00:00:00.000Z',
  tempoJogadoMs: 0,
  configuracoes: {
    ritmo: 'anual' as const,
    conteudoAdultoLiberado: false,
    idioma: 'pt-BR' as const
  },
  protagonista: {
    schemaVersion: '1.0.0' as const,
    characterId: '3b251323-8cf3-41fa-8a1a-cb320857bbfe',
    nome: 'João',
    sobrenome: 'Silva',
    genero: 'M' as const,
    dataNascimento: { ano: 2000, mes: 1, dia: 1 },
    idadeAtualMeses: 12,
    tracosFisicos: {
      corPele: '#f1c27d',
      corOlhos: '#634e34',
      formatoRosto: 'oval',
      formatoNariz: 'reto',
      formatoBoca: 'fina',
      estiloCorporalBase: 'medio' as const,
      alturaBase: 1.70
    },
    tracosVariaveis: {
      corCabelo: '#090806',
      estiloCabelo: 'curto',
      temGrisalho: false,
      temRugas: false,
      temOlheiras: false,
      usaOculos: false,
      pesoAtual: 70,
      alturaAtual: 1.70
    },
    atributos: {
      forca: 10,
      inteligencia: 10,
      carisma: 10,
      constituicao: 10,
      sorte: 10
    },
    atributosGeneticos: {
      forca: 10,
      inteligencia: 10,
      carisma: 10,
      constituicao: 10,
      sorte: 10
    },
    dinheiro: 100,
    humorAtual: 80,
    saudeAtual: 90,
    salarioMensal: 0,
    flags: [],
    eventosVividos: []
  },
  roster: [],
  estadoMundo: {
    anoAtual: 2001,
    mesAtual: 1,
    flagsGlobais: []
  },
  cooldownRegistry: {}
};

console.log('Executando testes de migração...');

// Teste 1: save fictício versão '0.9.0' -> deve disparar throw (sem migração disponível)
try {
  const saveV090 = {
    ...saveValidoV100,
    schemaVersion: '0.9.0'
  };
  migrarSave(saveV090);
  throw new Error('Deveria ter lançado erro para versão 0.9.0 sem migrações disponíveis.');
} catch (erro: any) {
  if (erro.message && erro.message.includes('Sem migração disponível da versão 0.9.0')) {
    console.log('✅ Teste 1: versão 0.9.0 disparou throw corretamente.');
  } else {
    throw new Error(`Mensagem de erro inesperada: ${erro.message}`);
  }
}

// Teste 2: save versão '1.0.0' -> passa sem mudanças e valida com Zod
try {
  const resultado = migrarSave(saveValidoV100);
  if (JSON.stringify(resultado) !== JSON.stringify(saveValidoV100)) {
    throw new Error('O resultado da migração difere do save original.');
  }
  console.log('✅ Teste 2: versão 1.0.0 passou com sucesso sem mudanças.');
} catch (erro: any) {
  throw new Error(`Teste 2 falhou inesperadamente: ${erro.message}`);
}

console.log('Todos os testes de migração passaram com sucesso! 🎉');
