import React, { useCallback, useEffect, useState } from 'react';
import { BarraSuperior } from '../ui/BarraSuperior';
import { EventoBase } from '../ui/EventoBase';
import { NewGameScreen } from '../ui/NewGameScreen';
import { SettingsScreen } from '../ui/SettingsScreen';
import { DeathScreen } from '../ui/DeathScreen';
import { LoadGameScreen } from '../ui/LoadGameScreen';
import { WorldMapScreen } from '../screens/WorldMapScreen';
import { ExplorationScene } from '../screens/ExplorationScene';
import type { DadosNovoPersonagem } from '../ui/NewGameScreen';
import type { DeathScreenProps } from '../ui/DeathScreen';
import { useHudStore } from '../state/hudStore';
import { useExplorationStore } from '../state/explorationStore';
import { obterComodoEntrada } from '../content/locationCatalog';
import { v4 as uuidv4 } from 'uuid';
import type { SaveSlot } from '@lifesim/core';
import type { ComodoDefinition } from '@core/schemas/location';
import { SaveManager, listarSaves, carregarSave, deletarSave } from '@core/persistence/SaveManager';
import { forcarAutosave } from '@core/persistence/Autosave';
import './App.css';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

type TelaAtual = 'jogo' | 'selecionar_save' | 'novo_personagem' | 'configuracoes' | 'morte';
type TelaAtiva = 'mapa' | 'exploracao' | 'carregando';
type DestinoExploracao = ComodoDefinition['pontosDeSaida'][number]['destino'];

const DURACAO_FADE_MS = 300;

function aguardar(ms: number): Promise<void> {
  return new Promise((resolver) => {
    window.setTimeout(resolver, ms);
  });
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function App(): React.JSX.Element {
  const [telaAtual,    setTelaAtual]    = useState<TelaAtual>('jogo');
  const [telaAtiva,    setTelaAtiva]    = useState<TelaAtiva>('mapa');
  const [fadeAtivo,    setFadeAtivo]    = useState<boolean>(false);
  const [dadosMorte,   setDadosMorte]   = useState<Omit<DeathScreenProps, 'aoNovaVida' | 'aoMenuPrincipal'> | undefined>(undefined);
  const [saves,        setSaves]        = useState<readonly SaveSlot[]>([]);
  const [bootCompleto, setBootCompleto] = useState<boolean>(false);
  const [erroCarregar, setErroCarregar] = useState<string | undefined>(undefined);
  const comodoAtualId = useExplorationStore((estado) => estado.comodoAtualId);

  const {
    nomePersonagem,
    profissaoAtual,
    idadeAnos,
    anoAtual,
    dinheiro,
    eventoAtivo,
    ritmoAtual,
    resolverOpcao,
    inicializarEngine,
    avancarTempo,
  } = useHudStore();

  const transicionarTelaAtiva = useCallback(async (
    proximaTela: TelaAtiva,
    aoTrocar?: () => void,
  ): Promise<void> => {
    setTelaAtiva('carregando');
    setFadeAtivo(true);
    await aguardar(DURACAO_FADE_MS);
    aoTrocar?.();
    setTelaAtiva(proximaTela);
    await aguardar(20);
    setFadeAtivo(false);
    await aguardar(DURACAO_FADE_MS);
  }, []);

  const aoLocalEscolhido = useCallback((localId: string, comodoId: string) => {
    void transicionarTelaAtiva('exploracao', () => {
      const comodoEntradaId = obterComodoEntrada(localId) ?? comodoId;
      useExplorationStore.getState().entrarEmExploracao(localId, comodoEntradaId);
    });
  }, [transicionarTelaAtiva]);

  const aoSaidaExploracao = useCallback((destino: DestinoExploracao) => {
    if (destino.tipo === 'mapa') {
      void transicionarTelaAtiva('mapa', () => {
        useExplorationStore.getState().sairDeExploracao();
      });
      return;
    }

    const localAtualId = useExplorationStore.getState().localAtualId ?? 'casa';
    void transicionarTelaAtiva('exploracao', () => {
      useExplorationStore.getState().entrarEmExploracao(localAtualId, destino.comodoId);
    });
  }, [transicionarTelaAtiva]);

  // ── Boot: listar saves e decidir tela inicial ─────────────────────────────

  useEffect(() => {
    let cancelado = false;
    async function carregarListaInicial(): Promise<void> {
      try {
        const lista = await listarSaves();
        if (cancelado) return;
        setSaves(lista);
        setTelaAtual(lista.length > 0 ? 'selecionar_save' : 'novo_personagem');
      } catch (erro) {
        if (cancelado) return;
        console.error('[App] Falha ao listar saves no boot:', erro);
        setSaves([]);
        setTelaAtual('novo_personagem');
      } finally {
        if (!cancelado) setBootCompleto(true);
      }
    }
    void carregarListaInicial();
    return () => { cancelado = true; };
  }, []);

  async function recarregarSaves(): Promise<void> {
    try {
      const lista = await listarSaves();
      setSaves(lista);
    } catch (erro) {
      console.error('[App] Falha ao re-listar saves:', erro);
    }
  }

  async function aoContinuarSave(saveId: string): Promise<void> {
    setErroCarregar(undefined);
    try {
      const save = await carregarSave(saveId);
      if (save === undefined) {
        setErroCarregar('Save não encontrado. Atualize a lista.');
        await recarregarSaves();
        return;
      }
      inicializarEngine(save);
      setTelaAtual('jogo');
    } catch (erro) {
      console.error('[App] Falha ao carregar save:', erro);
      setErroCarregar('Não foi possível carregar este save. Tente novamente.');
    }
  }

  async function aoDeletarSave(saveId: string): Promise<void> {
    try {
      await deletarSave(saveId);
      await recarregarSaves();
    } catch (erro) {
      console.error('[App] Falha ao deletar save:', erro);
    }
  }

  // ── Novo personagem ────────────────────────────────────────────────────────

  async function aoConfirmarNovoPersonagem(dados: DadosNovoPersonagem): Promise<void> {
    const saveManager = new SaveManager();
    const estadoInicial = dados.estadoInicial;

    const novoSave = await saveManager.criarNovoSave({
      nomeSlot: `${dados.nome} ${dados.sobrenome}`,
      ritmo: dados.ritmo,
      roster: [...estadoInicial.rosterInicial],
      protagonista: {
        schemaVersion: '1.0.0' as const,
        characterId: uuidv4(),
        nome: dados.nome,
        sobrenome: dados.sobrenome,
        genero: dados.genero,
        dataNascimento: { ano: dados.perfilNascimento.anoNascimento, mes: 1, dia: 1 },
        idadeAtualMeses: 0,
        tracosFisicos: {
          corPele:          '#f1c27d',
          corOlhos:         '#634e34',
          formatoRosto:     'oval',
          formatoNariz:     'reto',
          formatoBoca:      'fina',
          estiloCorporalBase: 'medio',
          alturaBase:       1.70,
        },
        tracosVariaveis: {
          corCabelo:    '#090806',
          estiloCabelo: 'curto',
          temGrisalho:  false,
          temRugas:     false,
          temOlheiras:  false,
          usaOculos:    false,
          pesoAtual:    70,
          alturaAtual:  1.70,
        },
        atributos:          estadoInicial.protagonista.atributos,
        atributosGeneticos: estadoInicial.protagonista.atributosGeneticos,
        dinheiro:     estadoInicial.dinheiro,
        humorAtual:   70,
        saudeAtual:   100,
        salarioMensal: 0,
        flags:          [],
        eventosVividos: [],
      },
    });

    inicializarEngine(novoSave);
    setTelaAtual('jogo');
    setTelaAtiva('mapa');
    useExplorationStore.getState().sairDeExploracao();
    void recarregarSaves();
  }

  // ── Renderização condicional ───────────────────────────────────────────────

  // Boot ainda não decidiu — render vazio para não piscar a tela de jogo
  if (!bootCompleto) {
    return <div className="vida-app vida-app--boot" />;
  }

  if (telaAtual === 'selecionar_save') {
    return (
      <>
        <LoadGameScreen
          saves={saves}
          aoContinuar={(saveId) => { void aoContinuarSave(saveId); }}
          aoDeletar={(saveId) => { void aoDeletarSave(saveId); }}
          aoNovoJogo={() => {
            setErroCarregar(undefined);
            setTelaAtual('novo_personagem');
          }}
        />
        {erroCarregar !== undefined && (
          <div className="vida-app__erro-toast" role="alert">{erroCarregar}</div>
        )}
      </>
    );
  }

  if (telaAtual === 'novo_personagem') {
    return (
      <NewGameScreen
        aoConfirmar={(dados) => { void aoConfirmarNovoPersonagem(dados); }}
        aoCancelar={() => setTelaAtual(saves.length > 0 ? 'selecionar_save' : 'novo_personagem')}
      />
    );
  }

  if (telaAtual === 'morte' && dadosMorte !== undefined) {
    return (
      <DeathScreen
        {...dadosMorte}
        aoNovaVida={() => {
          setDadosMorte(undefined);
          setTelaAtual('novo_personagem');
        }}
        aoMenuPrincipal={() => {
          setDadosMorte(undefined);
          setTelaAtual('selecionar_save');
        }}
      />
    );
  }

  // ── Layout principal de jogo (inclui SettingsScreen como overlay) ──────────

  return (
    <>
      <div className="vida-app">
        <BarraSuperior
          nomePersonagem={nomePersonagem}
          profissaoAtual={profissaoAtual}
          idadeAnos={idadeAnos}
          anoAtual={anoAtual}
          dinheiro={dinheiro}
          ritmo={ritmoAtual}
          aoAvancarTempo={avancarTempo}
          desabilitadoAvancar={eventoAtivo !== undefined}
          aoNovoJogo={() => setTelaAtual('novo_personagem')}
          aoAbrirConfig={() => {
            const salvoAtual = useHudStore.getState().saveAtual;
            if (salvoAtual !== undefined) {
              void forcarAutosave(salvoAtual);
            }
            setTelaAtual('configuracoes');
          }}
        />

        <div className="vida-app__corpo">
          <div className="vida-app__centro">
            <div className="vida-app__stage">
              {telaAtiva === 'mapa' && (
                <WorldMapScreen onLocalEscolhido={aoLocalEscolhido} />
              )}
              {telaAtiva === 'exploracao' && comodoAtualId !== undefined && (
                <ExplorationScene comodoId={comodoAtualId} onSaida={aoSaidaExploracao} />
              )}
              {telaAtiva === 'carregando' && (
                <div className="vida-app__carregando" aria-label="Carregando" />
              )}
              <div
                className={`vida-app__fade${fadeAtivo ? ' vida-app__fade--ativo' : ''}`}
                aria-hidden="true"
              />
            </div>
            <EventoBase evento={eventoAtivo} aoEscolher={resolverOpcao} />
          </div>
        </div>

      </div>

      {/* SettingsScreen como overlay sobre o jogo */}
      {telaAtual === 'configuracoes' && (
        <SettingsScreen
          aoFechar={() => setTelaAtual('jogo')}
          aoMenuPrincipal={() => setTelaAtual('selecionar_save')}
        />
      )}
    </>
  );
}
