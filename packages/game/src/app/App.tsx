import React, { useEffect, useState } from 'react';
import { PixiStage } from '../stage/PixiStage';
import { BarraSuperior } from '../ui/BarraSuperior';
import { EventoBase } from '../ui/EventoBase';
import { NewGameScreen } from '../ui/NewGameScreen';
import { SettingsScreen } from '../ui/SettingsScreen';
import { DeathScreen } from '../ui/DeathScreen';
import { LoadGameScreen } from '../ui/LoadGameScreen';
import type { DadosNovoPersonagem } from '../ui/NewGameScreen';
import type { DeathScreenProps } from '../ui/DeathScreen';
import { useHudStore } from '../state/hudStore';
import { v4 as uuidv4 } from 'uuid';
import type { SaveSlot } from '@lifesim/core';
import { SaveManager, listarSaves, carregarSave, deletarSave } from '@core/persistence/SaveManager';
import { forcarAutosave } from '@core/persistence/Autosave';
import { gerarAtributosIniciais } from '@core/rpg/Attributes';
import { gerarRosterInicial } from '@core/npc/NpcGenerator';
import './App.css';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

type TelaAtual = 'jogo' | 'selecionar_save' | 'novo_personagem' | 'configuracoes' | 'morte';

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function App(): React.JSX.Element {
  const [telaAtual,    setTelaAtual]    = useState<TelaAtual>('jogo');
  const [dadosMorte,   setDadosMorte]   = useState<Omit<DeathScreenProps, 'aoNovaVida' | 'aoMenuPrincipal'> | undefined>(undefined);
  const [saves,        setSaves]        = useState<readonly SaveSlot[]>([]);
  const [bootCompleto, setBootCompleto] = useState<boolean>(false);
  const [erroCarregar, setErroCarregar] = useState<string | undefined>(undefined);

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
    realizarAtividade,
    avancarTempo,
  } = useHudStore();

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
    const anoNascimento  = 1990 + Math.floor(Math.random() * 16); // 1990–2005
    const saveManager    = new SaveManager();
    const rosterFamiliar = gerarRosterInicial(anoNascimento, Date.now() % 100000);

    const novoSave = await saveManager.criarNovoSave({
      nomeSlot: `${dados.nome} ${dados.sobrenome}`,
      ritmo: dados.ritmo,
      roster: rosterFamiliar,
      protagonista: {
        schemaVersion: '1.0.0' as const,
        characterId: uuidv4(),
        nome: dados.nome,
        sobrenome: dados.sobrenome,
        genero: dados.genero,
        dataNascimento: { ano: anoNascimento, mes: 1, dia: 1 },
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
        atributos:          dados.atributos,
        atributosGeneticos: dados.atributos,
        dinheiro:     0,
        humorAtual:   70,
        saudeAtual:   100,
        salarioMensal: 0,
        flags:          [],
        eventosVividos: [],
      },
    });

    inicializarEngine(novoSave);
    setTelaAtual('jogo');
    void recarregarSaves();
  }

  // ── Atividades ────────────────────────────────────────────────────────────

  function aoClicarAtividade(idAtividade: string): void {
    realizarAtividade(idAtividade);
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
              <PixiStage />
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
