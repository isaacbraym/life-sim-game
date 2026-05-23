import React from 'react';
import { PixiStage } from '../stage/PixiStage';
import { HudLateral } from '../ui/HudLateral';
import { EventoBase } from '../ui/EventoBase';
import { useHudStore } from '../state/hudStore';

export function App(): React.JSX.Element {
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
    avancarSemEvento,
  } = useHudStore();

  function aoClicarAtividade(idAtividade: string): void {
    // TODO Sprint 1.6: conectar ao ActivityEngine
    console.log('Atividade selecionada:', idAtividade);
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
          aoAvancar={avancarSemEvento}
        />
      </div>
    </div>
  );
}
