import React, { useState } from 'react';
import { PixiStage } from '../stage/PixiStage';
import { HudLateral } from '../ui/HudLateral';
import { EventoBase } from '../ui/EventoBase';
import { NewGameScreen } from '../ui/NewGameScreen';
import type { DadosNovoPersonagem } from '../ui/NewGameScreen';
import { useHudStore } from '../state/hudStore';

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
  } = useHudStore();

  function aoClicarAtividade(idAtividade: string): void {
    // TODO Sprint 1.6: conectar ao ActivityEngine
    console.log('Atividade selecionada:', idAtividade);
  }

  function aoConfirmarNovoPersonagem(dados: DadosNovoPersonagem): void {
    // TODO Sprint 1.7: inicializar GameEngine com save gerado a partir de dados
    console.log('Novo personagem:', dados);
    setTelaAtual('jogo');
  }

  if (telaAtual === 'novo_personagem') {
    return (
      <NewGameScreen
        aoConfirmar={aoConfirmarNovoPersonagem}
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
