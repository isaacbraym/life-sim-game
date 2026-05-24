import React, { useState } from 'react';
import { PixiStage } from '../stage/PixiStage';
import { HudLateral } from '../ui/HudLateral';
import { EventoBase } from '../ui/EventoBase';
import { NewGameScreen } from '../ui/NewGameScreen';
import type { DadosNovoPersonagem } from '../ui/NewGameScreen';
import { useHudStore } from '../state/hudStore';
import { v4 as uuidv4 } from 'uuid';
import { SaveManager } from '@core/persistence/SaveManager';
import { gerarAtributosIniciais } from '@core/rpg/Attributes';
import { gerarRosterInicial } from '@core/npc/NpcGenerator';

export function App(): React.JSX.Element {
  const [telaAtual, setTelaAtual] = useState<'jogo' | 'novo_personagem'>('jogo');

  const {
    nomePersonagem,
    profissaoAtual,
    idadeAnos,
    anoAtual,
    humor,
    saude,
    dinheiro,
    atributos,
    eventoAtivo,
    resolverOpcao,
    inicializarEngine,
  } = useHudStore();

  function aoClicarAtividade(idAtividade: string): void {
    // TODO Sprint 1.6: conectar ao ActivityEngine
    console.log('Atividade selecionada:', idAtividade);
  }

  async function aoConfirmarNovoPersonagem(dados: DadosNovoPersonagem): Promise<void> {
    const anoNascimento = 1990 + Math.floor(Math.random() * 16); // 1990–2005
    const saveManager = new SaveManager();

    const rosterFamiliar = gerarRosterInicial(
      anoNascimento,
      Date.now() % 100000,
    );

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
          corPele: '#f1c27d',
          corOlhos: '#634e34',
          formatoRosto: 'oval',
          formatoNariz: 'reto',
          formatoBoca: 'fina',
          estiloCorporalBase: 'medio',
          alturaBase: 1.70,
        },
        tracosVariaveis: {
          corCabelo: '#090806',
          estiloCabelo: 'curto',
          temGrisalho: false,
          temRugas: false,
          temOlheiras: false,
          usaOculos: false,
          pesoAtual: 70,
          alturaAtual: 1.70,
        },
        atributos: dados.atributos,
        atributosGeneticos: dados.atributos,
        dinheiro: 0,
        humorAtual: 70,
        saudeAtual: 100,
        salarioMensal: 0,
        flags: [],
        eventosVividos: [],
      },
    });

    inicializarEngine(novoSave);
    setTelaAtual('jogo');
  }

  if (telaAtual === 'novo_personagem') {
    return (
      <NewGameScreen
        aoConfirmar={(dados) => { void aoConfirmarNovoPersonagem(dados); }}
        aoCancelar={() => setTelaAtual('jogo')}
      />
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        width: '100vw',
        height: '100vh',
        background: '#0f1117',
        overflow: 'hidden',
      }}
    >
      <HudLateral
        nomePersonagem={nomePersonagem}
        profissaoAtual={profissaoAtual}
        idadeAnos={idadeAnos}
        anoAtual={anoAtual}
        humor={humor}
        saude={saude}
        dinheiro={dinheiro}
        atributos={atributos}
        aoClicarAtividade={aoClicarAtividade}
        aoNovoJogo={() => setTelaAtual('novo_personagem')}
      />

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <PixiStage />
        </div>

        <EventoBase
          evento={eventoAtivo}
          aoEscolher={resolverOpcao}
        />
      </div>
    </div>
  );
}
