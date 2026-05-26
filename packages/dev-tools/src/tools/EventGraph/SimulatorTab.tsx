import { useEffect, useMemo, useState } from 'react';
import type { ActionDefinition } from '@core/schemas/action';
import type { Effect } from '@core/schemas/effect';
import type { Event as EventoDefinition } from '@core/schemas/event';
import type { OpcaoEscolha } from '@core/schemas/scene';
import type { EstadoDeJogo } from '@core/events/EstadoDeJogo';
import { avaliarPredicado } from '@core/events/PredicateEvaluator';
import {
  aplicarEfeitos,
  criarEstadoProgressaoVazio,
  resolverAcao,
  type EstadoProgressao,
} from '@core/interaction';
import { ModuleTracer } from './ModuleTracer';
import { StateDiffPanel, type EstadoSimulador, type ResultadoDiff } from './StateDiffPanel';

type SimulatorTabProps = {
  readonly eventos: readonly EventoDefinition[];
  readonly eventoAtivo: EventoDefinition | undefined;
  readonly aoSelecionarEvento: (evento: EventoDefinition | undefined) => void;
};

type ResultadoPredicados = {
  readonly passou: boolean;
  readonly linhas: readonly string[];
  readonly falha: string | undefined;
};

const FASES_DE_VIDA = ['bebe', 'crianca', 'adolescente', 'jovem_adulto', 'adulto', 'idoso'] as const;
const ATRIBUTOS = ['forca', 'inteligencia', 'carisma', 'constituicao', 'sorte'] as const;

const ESTADO_INICIAL: EstadoSimulador = {
  forca: 10,
  inteligencia: 10,
  carisma: 10,
  constituicao: 10,
  sorte: 10,
  dinheiro: 300,
  idade: 18,
  ano: 2003,
  mes: 1,
  faseDeVida: 'jovem_adulto',
  flagsAtivas: [],
};

function escolhasDoEvento(evento: EventoDefinition | undefined): readonly OpcaoEscolha[] {
  if (evento === undefined) return [];
  return evento.scene.beats.flatMap(beat => (beat.tipo === 'escolha' ? beat.opcoes : []));
}

function converterParaEstadoDeJogo(estado: EstadoSimulador): EstadoDeJogo {
  return {
    anoNascimento: estado.ano - estado.idade,
    anoAtual: estado.ano,
    humor: 50,
    saude: 100,
    dinheiro: estado.dinheiro,
    atributos: {
      forca: estado.forca,
      inteligencia: estado.inteligencia,
      carisma: estado.carisma,
      constituicao: estado.constituicao,
      sorte: estado.sorte,
    },
    flags: estado.flagsAtivas,
    cooldownRegistry: {},
  };
}

function converterDeEstadoDeJogo(estadoCore: EstadoDeJogo, estadoAnterior: EstadoSimulador): EstadoSimulador {
  return {
    ...estadoAnterior,
    forca: estadoCore.atributos.forca ?? estadoAnterior.forca,
    inteligencia: estadoCore.atributos.inteligencia ?? estadoAnterior.inteligencia,
    carisma: estadoCore.atributos.carisma ?? estadoAnterior.carisma,
    constituicao: estadoCore.atributos.constituicao ?? estadoAnterior.constituicao,
    sorte: estadoCore.atributos.sorte ?? estadoAnterior.sorte,
    dinheiro: estadoCore.dinheiro,
    flagsAtivas: estadoCore.flags,
  };
}

function descreverEfeito(efeito: Effect): string {
  switch (efeito.tipo) {
    case 'alterar_atributo':
      return `${efeito.delta > 0 ? '+' : ''}${efeito.delta} ${efeito.atributo}`;
    case 'alterar_dinheiro':
      return `${efeito.delta > 0 ? '+' : ''}${efeito.delta} dinheiro`;
    case 'adicionar_flag':
      return `adicionar flag "${efeito.flag}"`;
    case 'remover_flag':
      return `remover flag "${efeito.flag}"`;
    case 'alterar_saude':
      return `${efeito.delta > 0 ? '+' : ''}${efeito.delta} saúde`;
    case 'alterar_humor':
      return `${efeito.delta > 0 ? '+' : ''}${efeito.delta} humor`;
    case 'alterar_relacionamento':
      return `${efeito.delta > 0 ? '+' : ''}${efeito.delta} relacionamento com ${efeito.npcId}`;
    case 'matar_npc':
      return `matar NPC ${efeito.npcId}`;
    case 'mudar_profissao':
      return `mudar profissão para ${efeito.profissao}`;
    case 'aplicar_status':
      return `aplicar status ${efeito.status}`;
    case 'disparar_evento':
      return `disparar evento ${efeito.eventoId}`;
  }
}

function criarAcaoDaEscolha(evento: EventoDefinition, escolha: OpcaoEscolha, indiceEscolha: number): ActionDefinition {
  return {
    id: `${evento.eventoId}_choice_${indiceEscolha + 1}`,
    rotulo: escolha.texto,
    requisitos: escolha.requisitos,
    resolutionMode: escolha.atributoCheck === undefined ? 'direct' : 'check',
    check: escolha.atributoCheck === undefined
      ? undefined
      : {
        atributo: escolha.atributoCheck.atributo,
        dc: escolha.atributoCheck.dificuldade,
      },
    onSuccess: escolha.efeitos,
    onFailure: [],
    eventHooks: escolha.proximoEventoId === undefined
      ? undefined
      : [{ condicao: 'always', eventoId: escolha.proximoEventoId, chance: 1 }],
    logAcao: escolha.texto,
    logSucesso: escolha.texto,
    logFalha: `Falha em: ${escolha.texto}`,
    narrativeWeight: evento.narrativeWeight ?? 'routine',
  };
}

function avaliarEvento(evento: EventoDefinition, estado: EstadoSimulador): ResultadoPredicados {
  const estadoCore = converterParaEstadoDeJogo(estado);
  const linhas: string[] = [];

  if (evento.triggers.idadeRange !== undefined) {
    const [minimo, maximo] = evento.triggers.idadeRange;
    const passouIdade = estado.idade >= minimo && estado.idade <= maximo;
    linhas.push(`[PredicateEvaluator] idade ${estado.idade} em ${minimo}-${maximo} → ${passouIdade ? 'predicado PASSOU' : 'predicado FALHOU'}`);
    if (!passouIdade) {
      return { passou: false, linhas, falha: `idade ${estado.idade} fora do range ${minimo}-${maximo}` };
    }
  }

  if (evento.triggers.requisitos === undefined) {
    linhas.push('[PredicateEvaluator] sem triggers.requisitos → predicado PASSOU');
    return { passou: true, linhas, falha: undefined };
  }

  const passou = avaliarPredicado(evento.triggers.requisitos, estadoCore);
  linhas.push(`[PredicateEvaluator] triggers.requisitos → predicado ${passou ? 'PASSOU' : 'FALHOU'}`);

  return {
    passou,
    linhas,
    falha: passou ? undefined : JSON.stringify(evento.triggers.requisitos),
  };
}

function desfechoParaTier(desfecho: string): string {
  switch (desfecho) {
    case 'critico_sucesso':
      return 'SUCESSO_CRITICO';
    case 'sucesso':
    case 'direto':
      return 'SUCESSO';
    case 'critico_falha':
      return 'FALHA_CRITICA';
    case 'falha':
      return 'FALHA';
    default:
      return desfecho.toUpperCase();
  }
}

function criarLinhasEfeito(antes: EstadoDeJogo, depois: EstadoDeJogo): readonly string[] {
  const linhas: string[] = [];

  for (const atributo of ATRIBUTOS) {
    const valorAntes = antes.atributos[atributo] ?? 0;
    const valorDepois = depois.atributos[atributo] ?? 0;
    const delta = valorDepois - valorAntes;
    if (delta !== 0) {
      linhas.push(`[EffectEngine] ${delta > 0 ? '+' : ''}${delta} ${atributo} (era ${valorAntes} → agora ${valorDepois})`);
    }
  }

  const deltaDinheiro = depois.dinheiro - antes.dinheiro;
  if (deltaDinheiro !== 0) {
    linhas.push(`[EffectEngine] ${deltaDinheiro > 0 ? '+' : ''}${deltaDinheiro} dinheiro (era ${antes.dinheiro} → agora ${depois.dinheiro})`);
  }

  const deltaHumor = depois.humor - antes.humor;
  if (deltaHumor !== 0) {
    linhas.push(`[EffectEngine] ${deltaHumor > 0 ? '+' : ''}${deltaHumor} humor (era ${antes.humor} → agora ${depois.humor})`);
  }

  const deltaSaude = depois.saude - antes.saude;
  if (deltaSaude !== 0) {
    linhas.push(`[EffectEngine] ${deltaSaude > 0 ? '+' : ''}${deltaSaude} saúde (era ${antes.saude} → agora ${depois.saude})`);
  }

  for (const flag of depois.flags) {
    if (!antes.flags.includes(flag)) {
      linhas.push(`[EffectEngine] flag "${flag}" adicionada`);
    }
  }

  for (const flag of antes.flags) {
    if (!depois.flags.includes(flag)) {
      linhas.push(`[EffectEngine] flag "${flag}" removida`);
    }
  }

  return linhas.length > 0 ? linhas : ['[EffectEngine] nenhum campo editável alterado'];
}

function criarProgressaoDepois(
  progressaoAntes: EstadoProgressao,
  progressoAtualizado: Readonly<Record<string, number>>,
): EstadoProgressao {
  return {
    ...progressaoAntes,
    contadores: {
      ...progressaoAntes.contadores,
      ...progressoAtualizado,
    },
  };
}

function criarLinhasProgressao(
  progressaoAntes: EstadoProgressao,
  progressaoDepois: EstadoProgressao,
  acao: ActionDefinition,
): readonly string[] {
  if (acao.progression === undefined) {
    return ['[ProgressionTracker] sem regra de progressão para esta escolha'];
  }

  const contadorId = acao.progression.contadorId;
  const valorAntes = progressaoAntes.contadores[contadorId] ?? 0;
  const valorDepois = progressaoDepois.contadores[contadorId] ?? 0;
  const limiar = acao.progression.limiar;
  const limiarAtingido = valorAntes + 1 >= limiar;

  return [
    `[ProgressionTracker] contador "${contadorId}" → ${valorDepois} (limiar ${limiar} ${limiarAtingido ? 'atingido' : 'não atingido'})`,
  ];
}

function executarComD20<T>(d20: number, executar: () => T): T {
  const aleatorioOriginal = Math.random;
  Math.random = () => (d20 - 1) / 20;

  try {
    return executar();
  } finally {
    Math.random = aleatorioOriginal;
  }
}

export function SimulatorTab({ eventos, eventoAtivo, aoSelecionarEvento }: SimulatorTabProps) {
  const [estadoSimulador, definirEstadoSimulador] = useState<EstadoSimulador>(ESTADO_INICIAL);
  const [eventoSelecionadoId, definirEventoSelecionadoId] = useState<string>('');
  const [resultadoPredicados, definirResultadoPredicados] = useState<ResultadoPredicados | undefined>(undefined);
  const [indiceEscolhaAtiva, definirIndiceEscolhaAtiva] = useState<number | undefined>(undefined);
  const [d20, definirD20] = useState(10);
  const [novaFlag, definirNovaFlag] = useState('');
  const [resultadoDiff, definirResultadoDiff] = useState<ResultadoDiff | undefined>(undefined);
  const [linhasTrace, definirLinhasTrace] = useState<readonly string[]>([]);
  const [estadoProgressao, definirEstadoProgressao] = useState<EstadoProgressao>(() => criarEstadoProgressaoVazio());

  useEffect(() => {
    if (eventoAtivo !== undefined) {
      definirEventoSelecionadoId(eventoAtivo.eventoId);
    }
  }, [eventoAtivo]);

  const eventoSelecionado = useMemo(
    () => eventos.find(evento => evento.eventoId === eventoSelecionadoId) ?? eventoAtivo,
    [eventos, eventoSelecionadoId, eventoAtivo],
  );
  const escolhas = useMemo(() => escolhasDoEvento(eventoSelecionado), [eventoSelecionado]);
  const escolhaAtiva = indiceEscolhaAtiva === undefined ? undefined : escolhas[indiceEscolhaAtiva];

  function atualizarCampoNumerico(campo: keyof Pick<EstadoSimulador, 'dinheiro' | 'idade' | 'ano' | 'mes'>, valor: number) {
    definirEstadoSimulador(estadoAtual => ({ ...estadoAtual, [campo]: valor }));
  }

  function atualizarAtributo(atributo: (typeof ATRIBUTOS)[number], valor: number) {
    definirEstadoSimulador(estadoAtual => ({ ...estadoAtual, [atributo]: valor }));
  }

  function adicionarFlag() {
    const flagNormalizada = novaFlag.trim();
    if (flagNormalizada === '') return;

    definirEstadoSimulador(estadoAtual => ({
      ...estadoAtual,
      flagsAtivas: estadoAtual.flagsAtivas.includes(flagNormalizada)
        ? estadoAtual.flagsAtivas
        : [...estadoAtual.flagsAtivas, flagNormalizada],
    }));
    definirNovaFlag('');
  }

  function removerFlag(flag: string) {
    definirEstadoSimulador(estadoAtual => ({
      ...estadoAtual,
      flagsAtivas: estadoAtual.flagsAtivas.filter(flagAtiva => flagAtiva !== flag),
    }));
  }

  function verificarPredicados() {
    if (eventoSelecionado === undefined) return;

    const resultado = avaliarEvento(eventoSelecionado, estadoSimulador);
    definirResultadoPredicados(resultado);
    definirLinhasTrace(linhas => [...linhas, '▶ Nova verificação de predicados', ...resultado.linhas]);
  }

  function selecionarEvento(eventoId: string) {
    definirEventoSelecionadoId(eventoId);
    const proximoEvento = eventos.find(evento => evento.eventoId === eventoId);
    aoSelecionarEvento(proximoEvento);
    definirIndiceEscolhaAtiva(undefined);
    definirResultadoPredicados(undefined);
  }

  function simular() {
    if (eventoSelecionado === undefined || escolhaAtiva === undefined || indiceEscolhaAtiva === undefined) return;

    const predicados = resultadoPredicados ?? avaliarEvento(eventoSelecionado, estadoSimulador);
    if (!predicados.passou) {
      definirResultadoPredicados(predicados);
      definirLinhasTrace(linhas => [...linhas, '▶ Nova simulação', ...predicados.linhas]);
      return;
    }

    const estadoAntes = converterParaEstadoDeJogo(estadoSimulador);
    const acao = criarAcaoDaEscolha(eventoSelecionado, escolhaAtiva, indiceEscolhaAtiva);
    try {
      const resultadoAcao = executarComD20(d20, () => resolverAcao(acao, {
        estado: estadoAntes,
        progressao: estadoProgressao,
        anoJogo: estadoSimulador.ano,
        mesJogo: estadoSimulador.mes,
        localId: eventoSelecionado.localContextId,
      }));
    const estadoDepoisCore = aplicarEfeitos(resultadoAcao.efeitosAplicados, estadoAntes);
    const estadoDepois = converterDeEstadoDeJogo(estadoDepoisCore, estadoSimulador);
    const progressaoDepois = criarProgressaoDepois(estadoProgressao, resultadoAcao.progressoAtualizado);

    definirEstadoSimulador(estadoDepois);
    definirEstadoProgressao(progressaoDepois);
    definirResultadoDiff({
      antes: estadoSimulador,
      depois: estadoDepois,
      progressaoAntes: estadoProgressao,
      progressaoDepois,
    });

    const linhasEfeitos = criarLinhasEfeito(estadoAntes, estadoDepoisCore);
    const linhasProgressao = criarLinhasProgressao(estadoProgressao, progressaoDepois, acao);
    const linhasLogs = resultadoAcao.logsGerados.map(log => `[LifeLog] camada: ${log.camada} | "${log.texto}"`);
    const linhasEventos = resultadoAcao.eventosDisparados.map(eventoId => `[ActionResolver] eventHook disparado: ${eventoId}`);

    definirLinhasTrace(linhas => [
      ...linhas,
      '▶ Nova simulação',
      ...predicados.linhas,
      `[ActionResolver] resolutionMode: ${acao.resolutionMode} | D20: ${acao.resolutionMode === 'check' ? d20 : '-'} | tier: ${desfechoParaTier(resultadoAcao.desfecho)}`,
      `[ActionResolver] efeitos resolvidos: ${resultadoAcao.efeitosAplicados.map(descreverEfeito).join(', ') || 'nenhum'}`,
      ...linhasEventos,
      ...linhasEfeitos,
      ...linhasProgressao,
      ...linhasLogs,
    ]);
    } catch (erroDesconhecido) {
      const mensagem = erroDesconhecido instanceof Error ? erroDesconhecido.message : 'erro desconhecido';
      definirLinhasTrace(linhas => [
        ...linhas,
        '▶ Nova simulação',
        ...predicados.linhas,
        `[ActionResolver] erro ao resolver ação: ${mensagem}`,
      ]);
    }
  }

  return (
    <div className="simulatorTab">
      <aside className="simulatorTab__estado">
        <h2>EstadoDeJogo editável</h2>
        <div className="estadoGrid">
          {ATRIBUTOS.map(atributo => (
            <label key={atributo} className="campo">
              <span>{atributo}: {estadoSimulador[atributo]}</span>
              <input
                type="range"
                min={1}
                max={20}
                value={estadoSimulador[atributo]}
                onChange={evento => atualizarAtributo(atributo, Number(evento.currentTarget.value))}
              />
            </label>
          ))}
          <label className="campo">
            <span>dinheiro</span>
            <input type="number" value={estadoSimulador.dinheiro} onChange={evento => atualizarCampoNumerico('dinheiro', Number(evento.currentTarget.value))} />
          </label>
          <label className="campo">
            <span>idade</span>
            <input type="number" value={estadoSimulador.idade} onChange={evento => atualizarCampoNumerico('idade', Number(evento.currentTarget.value))} />
          </label>
          <label className="campo">
            <span>ano</span>
            <input type="number" value={estadoSimulador.ano} onChange={evento => atualizarCampoNumerico('ano', Number(evento.currentTarget.value))} />
          </label>
          <label className="campo">
            <span>mes</span>
            <input type="number" min={1} max={12} value={estadoSimulador.mes} onChange={evento => atualizarCampoNumerico('mes', Number(evento.currentTarget.value))} />
          </label>
          <label className="campo">
            <span>faseDeVida</span>
            <select
              value={estadoSimulador.faseDeVida}
              onChange={evento => definirEstadoSimulador(estadoAtual => ({ ...estadoAtual, faseDeVida: evento.currentTarget.value }))}
            >
              {FASES_DE_VIDA.map(fase => <option key={fase} value={fase}>{fase}</option>)}
            </select>
          </label>
          <div className="campo">
            <span>flagsAtivas</span>
            <div className="flagsEditor">
              <div className="flagsEditor__linha">
                <input value={novaFlag} onChange={evento => definirNovaFlag(evento.currentTarget.value)} />
                <button type="button" onClick={adicionarFlag}>Adicionar</button>
              </div>
              <div>
                {estadoSimulador.flagsAtivas.map(flag => (
                  <span key={flag} className="flagPill">
                    {flag}
                    <button type="button" aria-label={`Remover ${flag}`} onClick={() => removerFlag(flag)}>×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </aside>

      <section className="simulatorTab__execucao">
        <label className="campo">
          <span>Evento</span>
          <select value={eventoSelecionado?.eventoId ?? ''} onChange={evento => selecionarEvento(evento.currentTarget.value)}>
            <option value="">Selecione um evento</option>
            {eventos.map(evento => <option key={evento.eventoId} value={evento.eventoId}>{evento.eventoId} · {evento.titulo}</option>)}
          </select>
        </label>

        <section className="passo">
          <h2>1. Verificar predicados</h2>
          <button type="button" disabled={eventoSelecionado === undefined} onClick={verificarPredicados}>
            Verificar predicados
          </button>
          {resultadoPredicados !== undefined && (
            <p>
              {resultadoPredicados.passou ? 'Passou' : `Não passou: ${resultadoPredicados.falha ?? 'predicado falhou'}`}
            </p>
          )}
        </section>

        <section className="passo">
          <h2>2. Choices disponíveis</h2>
          <div className="choiceLista">
            {escolhas.map((escolha, indice) => (
              <button
                key={`${escolha.texto}-${indice}`}
                type="button"
                className={indiceEscolhaAtiva === indice ? 'choiceButton choiceButton--ativa' : 'choiceButton'}
                onClick={() => definirIndiceEscolhaAtiva(indice)}
              >
                <strong>{escolha.texto}</strong>
                <br />
                atributo: {escolha.atributoCheck?.atributo ?? 'direto'} · DC: {escolha.atributoCheck?.dificuldade ?? '-'}
              </button>
            ))}
          </div>
        </section>

        <section className="passo">
          <h2>3. D20</h2>
          <label className="campo">
            <span>D20: {d20}</span>
            <input type="range" min={1} max={20} value={d20} onChange={evento => definirD20(Number(evento.currentTarget.value))} />
          </label>
          <button type="button" onClick={() => definirD20(Math.floor(Math.random() * 20) + 1)}>
            Rolar aleatório
          </button>
        </section>

        <section className="passo">
          <h2>4. Simular</h2>
          <button type="button" disabled={eventoSelecionado === undefined || escolhaAtiva === undefined} onClick={simular}>
            Simular
          </button>
        </section>
      </section>

      <section className="simulatorTab__resultado">
        <StateDiffPanel resultado={resultadoDiff} />
        <ModuleTracer linhas={linhasTrace} aoLimpar={() => definirLinhasTrace([])} />
      </section>
    </div>
  );
}
